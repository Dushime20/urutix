#!/usr/bin/env node
/**
 * fix-base-schema.js
 *
 * ONE-TIME RECOVERY SCRIPT — run this on the server when the container is
 * failing with:
 *
 *   ❌ 008_email_templates.sql failed: relation "users" does not exist
 *   ❌ 009_bulk_email_logs.sql  failed: relation "tenants" does not exist
 *   ❌ 012_...                  failed: relation "credit_accounts" does not exist
 *
 * Root cause
 * ----------
 * The `000_base_schema.sql` migration (which creates users, tenants, loads,
 * user_profiles, activity_logs) was added to the migrations directory AFTER
 * the database had already been initialised (previously TypeORM synchronize
 * created those tables).  It was recorded as "executed" in schema_migrations,
 * but on a DB that lost its tables (volume swap / partial reset / restore
 * without schema) those tables no longer exist.  Later migrations that depend
 * on them then fail.
 *
 * What this script does
 * ---------------------
 *  1. Connects to the production database.
 *  2. Re-executes 000_base_schema.sql unconditionally (every statement in it
 *     uses CREATE TABLE IF NOT EXISTS / CREATE TYPE … EXCEPTION WHEN
 *     duplicate_object, so it is a safe no-op on an intact schema).
 *  3. Removes the "failed" rows (if any) for 008, 009, 012 from
 *     schema_migrations so migrate.js retries them on the next startup.
 *  4. Prints a clear summary.
 *
 * After running this script, restart the backend container:
 *   docker compose -f docker-compose.production.yml restart backend
 *
 * Usage (from project root on the server)
 * ----------------------------------------
 *   # If running inside the container:
 *   docker compose -f docker-compose.production.yml exec backend \
 *     node fix-base-schema.js
 *
 *   # If running on the host with .env loaded:
 *   cd backend && node fix-base-schema.js
 */

'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MIGRATION_TABLE = 'schema_migrations';
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// ── Colour helpers ─────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
};
const ok   = (m) => console.log(`${C.green}✅ ${m}${C.reset}`);
const warn = (m) => console.log(`${C.yellow}⚠️  ${m}${C.reset}`);
const err  = (m) => console.error(`${C.red}❌ ${m}${C.reset}`);
const info = (m) => console.log(`${C.cyan}ℹ️  ${m}${C.reset}`);
const hdr  = (m) => {
  const line = '═'.repeat(70);
  console.log(`\n${C.bold}${line}\n  ${m}\n${line}${C.reset}\n`);
};

async function main() {
  hdr('UrutiX — Base Schema Recovery');

  const config = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 5432,
    user:     process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME     || 'urutix',
  };

  info(`Connecting to ${config.database}@${config.host}:${config.port} …`);

  const client = new Client(config);
  await client.connect();
  ok('Connected.\n');

  // ── 1. Re-apply 000_base_schema.sql ────────────────────────────────────
  const baseSql = path.join(MIGRATIONS_DIR, '000_base_schema.sql');
  if (!fs.existsSync(baseSql)) {
    err('000_base_schema.sql not found. Aborting.');
    await client.end();
    process.exit(1);
  }

  const content = fs.readFileSync(baseSql, 'utf8').trim();
  if (!content) {
    err('000_base_schema.sql is empty. Aborting.');
    await client.end();
    process.exit(1);
  }

  info('Re-applying 000_base_schema.sql (safe no-op on existing tables) …');
  const t0 = Date.now();

  try {
    await client.query('BEGIN');
    await client.query(content);
    await client.query('COMMIT');
    ok(`000_base_schema.sql applied successfully (${Date.now() - t0}ms).\n`);
  } catch (e) {
    await client.query('ROLLBACK');
    err(`000_base_schema.sql failed: ${e.message}`);
    err('Cannot continue. Please review the SQL error above.');
    await client.end();
    process.exit(1);
  }

  // ── 2. Verify core tables now exist ────────────────────────────────────
  info('Verifying core tables …');
  const coreTables = ['tenants', 'users', 'user_profiles', 'loads', 'activity_logs'];
  let missing = [];

  for (const tbl of coreTables) {
    const res = await client.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1`, [tbl]
    );
    if (res.rows.length === 0) {
      missing.push(tbl);
    } else {
      ok(`  ${tbl}`);
    }
  }

  if (missing.length > 0) {
    err(`\nThese tables are STILL missing after applying 000_base_schema.sql:`);
    missing.forEach(t => err(`  • ${t}`));
    err('Something is fundamentally wrong. Check Postgres permissions and logs.');
    await client.end();
    process.exit(1);
  }

  console.log('');

  // ── 3. Ensure schema_migrations tracking table exists ──────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      id                SERIAL PRIMARY KEY,
      migration_name    VARCHAR(255) UNIQUE NOT NULL,
      executed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER,
      status            VARCHAR(50) DEFAULT 'success',
      error_message     TEXT,
      checksum          VARCHAR(64)
    );
    CREATE INDEX IF NOT EXISTS idx_migration_name ON ${MIGRATION_TABLE}(migration_name);
    CREATE INDEX IF NOT EXISTS idx_executed_at    ON ${MIGRATION_TABLE}(executed_at);
  `);

  // ── 4. Ensure 000 is recorded as executed ──────────────────────────────
  await client.query(`
    INSERT INTO ${MIGRATION_TABLE} (migration_name, execution_time_ms, status)
    VALUES ('000_base_schema.sql', $1, 'success')
    ON CONFLICT (migration_name) DO UPDATE
      SET status            = 'success',
          executed_at       = CURRENT_TIMESTAMP,
          execution_time_ms = $1,
          error_message     = NULL
  `, [Date.now() - t0]);
  ok('000_base_schema.sql recorded as executed in schema_migrations.\n');

  // ── 5. Remove "failed" rows so next startup retries them ───────────────
  info('Cleaning up failed migration records so they are retried on next boot …');
  const failedRes = await client.query(`
    SELECT migration_name FROM ${MIGRATION_TABLE}
    WHERE status = 'failed'
    ORDER BY migration_name
  `);

  if (failedRes.rows.length === 0) {
    info('No failed migration records found.\n');
  } else {
    for (const row of failedRes.rows) {
      await client.query(
        `DELETE FROM ${MIGRATION_TABLE} WHERE migration_name = $1 AND status = 'failed'`,
        [row.migration_name]
      );
      ok(`  Cleared failed record: ${row.migration_name}`);
    }
    console.log('');
  }

  // ── 6. Summary ─────────────────────────────────────────────────────────
  hdr('Recovery Complete');

  const totalRes = await client.query(
    `SELECT COUNT(*) AS cnt FROM ${MIGRATION_TABLE} WHERE status = 'success'`
  );
  ok(`${totalRes.rows[0].cnt} migration(s) recorded as executed.`);

  console.log(`
${C.bold}Next steps:${C.reset}
  1. Rebuild & restart the backend container:
       docker compose -f docker-compose.production.yml up -d --build backend

  2. Watch the logs to confirm all remaining migrations succeed:
       docker compose -f docker-compose.production.yml logs -f backend
`);

  await client.end();
}

main().catch((e) => {
  err(`Unhandled error: ${e.message}`);
  console.error(e);
  process.exit(1);
});
