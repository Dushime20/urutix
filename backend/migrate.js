#!/usr/bin/env node
/**
 * Professional Database Migration Tool
 * 
 * This script provides a complete migration management system:
 * - Run pending migrations
 * - Check migration status
 * - Rollback migrations
 * - Create new migrations
 * 
 * Usage:
 *   npm run migrate              # Run all pending migrations
 *   npm run migrate:status       # Check migration status
 *   npm run migrate:create name  # Create new migration file
 *   npm run migrate:rollback     # Rollback last migration
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const {
  SUCCESS_LIKE,
  MIGRATION_HEALTH,
  assessMigration,
} = require('./migration-health');

const MIGRATION_TABLE = 'schema_migrations';
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logHeader(message) {
  log('\n' + '='.repeat(80), colors.bright);
  log(message, colors.bright);
  log('='.repeat(80) + '\n', colors.bright);
}

// Database configuration
function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'urutix',
  };
}

// Create migration tracking table
async function createMigrationTable(client) {
  const query = `
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER,
      status VARCHAR(50) DEFAULT 'success',
      error_message TEXT,
      checksum VARCHAR(64)
    );
    
    CREATE INDEX IF NOT EXISTS idx_migration_name ON ${MIGRATION_TABLE}(migration_name);
    CREATE INDEX IF NOT EXISTS idx_executed_at ON ${MIGRATION_TABLE}(executed_at);
  `;
  
  await client.query(query);
}

// Get all migration files
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }
  
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql') && !file.endsWith('_rollback.sql'))
    .sort();
}

// Get executed migrations
async function getExecutedMigrations(client) {
  const result = await client.query(
    `SELECT migration_name, executed_at, status, execution_time_ms 
     FROM ${MIGRATION_TABLE} 
     ORDER BY id`
  );
  return result.rows;
}

// Calculate file checksum
function calculateChecksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Check if migration was executed
async function isMigrationExecuted(client, migrationName) {
  const result = await client.query(
    `SELECT id FROM ${MIGRATION_TABLE} WHERE migration_name = $1`,
    [migrationName]
  );
  return result.rows.length > 0;
}

// Record migration execution
async function recordMigration(client, migrationName, executionTime, status = 'success', error = null, checksum = null) {
  await client.query(
    `INSERT INTO ${MIGRATION_TABLE} (migration_name, execution_time_ms, status, error_message, checksum)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (migration_name) 
     DO UPDATE SET 
       executed_at = CURRENT_TIMESTAMP,
       execution_time_ms = $2,
       status = $3,
       error_message = $4,
       checksum = $5`,
    [migrationName, executionTime, status, error, checksum]
  );
}

// Execute a single migration
async function executeMigration(client, migrationFile, force = false) {
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);

  const stats = fs.statSync(migrationPath);
  if (stats.size === 0) {
    logWarning(`Skipping ${migrationFile} (empty file)`);
    await recordMigration(client, migrationFile, 0, 'success', null, calculateChecksum(''));
    return { skipped: true, reason: 'empty' };
  }

  const migrationContent = fs.readFileSync(migrationPath, 'utf8').trim();

  if (!migrationContent) {
    logWarning(`Skipping ${migrationFile} (no content)`);
    await recordMigration(client, migrationFile, 0, 'success', null, calculateChecksum(''));
    return { skipped: true, reason: 'empty' };
  }

  const checksum = calculateChecksum(migrationContent);
  const noTransaction = /@no-transaction/i.test(migrationContent);

  if (!force && await isMigrationExecuted(client, migrationFile)) {
    const statusResult = await client.query(
      `SELECT status FROM ${MIGRATION_TABLE} WHERE migration_name = $1`,
      [migrationFile]
    );
    const status = statusResult.rows[0]?.status;
    if (SUCCESS_LIKE.has(status)) {
      logInfo(`Skipping ${migrationFile} (already executed)`);
      return { skipped: true, reason: 'executed' };
    }
    logInfo(`Skipping ${migrationFile} (recorded as ${status}; use: node migrate.js retry-failed or reconcile)`);
    return { skipped: true, reason: status || 'executed' };
  }

  logInfo(`Executing ${migrationFile}${noTransaction ? ' (no transaction)' : ''}...`);

  const startTime = Date.now();

  try {
    if (!noTransaction) {
      await client.query('BEGIN');
    }
    await client.query(migrationContent);

    const executionTime = Date.now() - startTime;
    await recordMigration(client, migrationFile, executionTime, 'success', null, checksum);

    if (!noTransaction) {
      await client.query('COMMIT');
    }

    logSuccess(`${migrationFile} completed (${executionTime}ms)`);
    return { success: true, executionTime };
  } catch (error) {
    if (!noTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch (_) {
        /* ignore */
      }
    }

    const executionTime = Date.now() - startTime;
    await recordMigration(client, migrationFile, executionTime, 'failed', error.message, checksum);

    logError(`${migrationFile} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function markMigrationResolved(client, migrationName, status, note) {
  await client.query(
    `UPDATE ${MIGRATION_TABLE}
     SET status = $2,
         error_message = $3,
         executed_at = CURRENT_TIMESTAMP
     WHERE migration_name = $1`,
    [migrationName, status, note],
  );
}

async function reconcileMigrations({ exitOnUnresolved = false } = {}) {
  logHeader('MIGRATION RECONCILIATION');

  const config = getDbConfig();
  const client = new Client(config);

  try {
    await client.connect();
    await createMigrationTable(client);

    const failed = await client.query(
      `SELECT migration_name, error_message, executed_at
       FROM ${MIGRATION_TABLE}
       WHERE status = 'failed'
       ORDER BY id`,
    );

    if (failed.rows.length === 0) {
      logSuccess('No failed migrations — database ledger is clean.');
      return { reconciled: 0, retried: 0, unresolved: 0 };
    }

    logInfo(`Found ${failed.rows.length} failed migration(s). Assessing and repairing...\n`);

    let reconciled = 0;
    let retried = 0;
    let unresolved = 0;

    for (const row of failed.rows) {
      const name = row.migration_name;
      const assessment = await assessMigration(client, name, { ...row, status: 'failed' });

      if (assessment.healthy) {
        const status = assessment.reason?.startsWith('superseded') ? 'superseded' : 'reconciled';
        await markMigrationResolved(
          client,
          name,
          status,
          assessment.reason || 'objective verified by migration-health',
        );
        logSuccess(`${name} → ${status} (${assessment.reason})`);
        reconciled++;
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, name);
      if (!fs.existsSync(filePath)) {
        logWarning(`${name} — file missing, cannot retry`);
        unresolved++;
        continue;
      }

      logInfo(`${name} — retrying SQL...`);
      const run = await executeMigration(client, name, true);
      if (run.success) {
        retried++;
        logSuccess(`${name} → success (retry)`);
        continue;
      }

      const after = await assessMigration(client, name, {
        ...row,
        status: 'failed',
      });
      if (after.healthy) {
        await markMigrationResolved(
          client,
          name,
          'reconciled',
          'objective verified after retry failure',
        );
        logSuccess(`${name} → reconciled (objective met despite retry error)`);
        reconciled++;
      } else {
        logError(`${name} — still unresolved: ${row.error_message || run.error || 'unknown'}`);
        unresolved++;
      }
    }

    logHeader('RECONCILIATION SUMMARY');
    log(`🔧 Reconciled/superseded: ${reconciled}`, colors.green);
    log(`🔁 Fixed by retry: ${retried}`, colors.green);
    log(`❌ Unresolved: ${unresolved}`, unresolved > 0 ? colors.red : colors.green);

    if (unresolved > 0 && exitOnUnresolved) {
      logError('\nUnresolved failed migrations remain. Run: node migrate.js doctor');
      process.exit(1);
    }

    return { reconciled, retried, unresolved };
  } finally {
    await client.end();
  }
}

async function doctorMigrations() {
  logHeader('MIGRATION DOCTOR');

  const config = getDbConfig();
  const client = new Client(config);

  try {
    await client.connect();
    await createMigrationTable(client);

    const executed = await getExecutedMigrations(client);
    const executedMap = new Map(executed.map((m) => [m.migration_name, m]));
    const allMigrations = getMigrationFiles();

    let healthy = 0;
    let warnings = 0;
    let critical = 0;

    for (const migration of allMigrations) {
      const row = executedMap.get(migration);
      const assessment = await assessMigration(client, migration, row);

      if (!row) {
        log(`⏳ ${migration} — PENDING`, colors.yellow);
        warnings++;
        continue;
      }

      if (SUCCESS_LIKE.has(row.status)) {
        log(`✅ ${migration} — ${row.status}`, colors.green);
        healthy++;
        continue;
      }

      if (assessment.healthy) {
        log(`🔧 ${migration} — failed but objective met (${assessment.reason})`, colors.yellow);
        logInfo(`   Run: node migrate.js reconcile`);
        warnings++;
        continue;
      }

      log(`❌ ${migration} — FAILED`, colors.red);
      if (row.error_message) {
        log(`   error: ${row.error_message}`, colors.yellow);
      }
      if (MIGRATION_HEALTH[migration]?.description) {
        log(`   expects: ${MIGRATION_HEALTH[migration].description}`, colors.cyan);
      }
      critical++;
    }

    logHeader('DOCTOR SUMMARY');
    log(`✅ Healthy: ${healthy}`, colors.green);
    log(`⚠️  Warnings (pending / needs reconcile): ${warnings}`, colors.yellow);
    log(`❌ Critical (failed + objective missing): ${critical}`, critical > 0 ? colors.red : colors.green);

    if (critical > 0) {
      logError('\nAction: fix SQL or run node migrate.js reconcile');
      process.exit(1);
    }
    if (warnings > 0) {
      logWarning('\nRun: node migrate.js reconcile');
    } else {
      logSuccess('Migration ledger is healthy.');
    }
  } finally {
    await client.end();
  }
}

async function showFailedErrors(client) {
  logHeader('FAILED MIGRATION ERRORS');
  const result = await client.query(
    `SELECT migration_name, error_message, executed_at
     FROM ${MIGRATION_TABLE}
     WHERE status = 'failed'
     ORDER BY executed_at`
  );
  if (result.rows.length === 0) {
    logSuccess('No failed migrations recorded.');
    return;
  }
  for (const row of result.rows) {
    log(`\n❌ ${row.migration_name}`, colors.red);
    log(`   at: ${new Date(row.executed_at).toLocaleString()}`, colors.cyan);
    log(`   error: ${row.error_message || '(no message stored)'}`, colors.yellow);
  }
  log('');
}

async function retryFailedMigrations() {
  logHeader('RETRY FAILED MIGRATIONS');
  const config = getDbConfig();
  const client = new Client(config);

  try {
    await client.connect();
    await createMigrationTable(client);

    const result = await client.query(
      `SELECT migration_name, error_message FROM ${MIGRATION_TABLE} WHERE status = 'failed' ORDER BY id`
    );

    if (result.rows.length === 0) {
      logSuccess('No failed migrations to retry.');
      return;
    }

    logInfo(`Found ${result.rows.length} failed migration(s) to retry:\n`);
    for (const row of result.rows) {
      log(`  - ${row.migration_name}: ${row.error_message || '(no message)'}`, colors.yellow);
    }
    log('');

    let ok = 0;
    let fail = 0;

    for (const row of result.rows) {
      const file = row.migration_name;
      if (!fs.existsSync(path.join(MIGRATIONS_DIR, file))) {
        logWarning(`File missing: ${file} — leaving failed record`);
        fail++;
        continue;
      }
      // Clear failed record so executeMigration with force rewrites it
      const run = await executeMigration(client, file, true);
      if (run.success) ok++;
      else if (run.skipped) ok++;
      else fail++;
    }

    logHeader('RETRY SUMMARY');
    logSuccess(`Succeeded: ${ok}`);
    if (fail > 0) {
      logError(`Still failing: ${fail}`);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

// Show migration status
async function showStatus(client) {
  logHeader('MIGRATION STATUS');
  
  const allMigrations = getMigrationFiles();
  const executedMigrations = await getExecutedMigrations(client);
  
  const executedMap = new Map(
    executedMigrations.map(m => [m.migration_name, m])
  );
  
  const pending = allMigrations.filter(m => !executedMap.has(m));
  const failedCount = executedMigrations.filter(m => m.status === 'failed').length;
  const reconciledCount = executedMigrations.filter(m =>
    m.status === 'reconciled' || m.status === 'superseded'
  ).length;

  log(`📊 Total migrations: ${allMigrations.length}`, colors.cyan);
  log(`✅ Successful: ${executedMigrations.filter(m => m.status === 'success').length}`, colors.green);
  if (reconciledCount > 0) {
    log(`🔧 Reconciled/superseded: ${reconciledCount}`, colors.cyan);
  }
  if (failedCount > 0) {
    log(`❌ Failed (needs action): ${failedCount}`, colors.red);
  }
  log(`⏳ Pending: ${pending.length}`, colors.yellow);
  log('');
  
  if (allMigrations.length === 0) {
    logWarning('No migration files found');
    return;
  }
  
  log('Migration Details:', colors.bright);
  log('-'.repeat(80));
  
  allMigrations.forEach((migration, index) => {
    const executed = executedMap.get(migration);
    const number = String(index + 1).padStart(3, '0');
    
    if (executed) {
      const icon = executed.status === 'success' ? '✅'
        : executed.status === 'reconciled' ? '🔧'
        : executed.status === 'superseded' ? '↪️'
        : executed.status === 'failed' ? '❌' : '•';
      const color = SUCCESS_LIKE.has(executed.status) ? colors.green
        : executed.status === 'failed' ? colors.red : colors.yellow;
      const date = new Date(executed.executed_at).toLocaleString();
      const time = executed.execution_time_ms ? `${executed.execution_time_ms}ms` : 'N/A';
      const label = executed.status === 'success' ? '' : ` [${executed.status}]`;
      log(`${number}. ${icon} ${migration.padEnd(50)} ${date} (${time})${label}`, color);
    } else {
      log(`${number}. ⏳ ${migration.padEnd(50)} PENDING`, colors.yellow);
    }
  });
  
  log('');
}

/**
 * Bootstrap: unconditionally run 000_base_schema.sql (the foundational schema).
 *
 * Problem this solves: on an existing DB whose schema_migrations table already
 * records 000_base_schema.sql as "executed", but the tables it creates were
 * subsequently dropped (DB reset, volume swap, partial restore, etc.), later
 * migrations that reference users / tenants / credit_accounts will fail.
 *
 * Because every statement in 000_base_schema.sql uses CREATE TABLE IF NOT EXISTS,
 * CREATE EXTENSION IF NOT EXISTS, and DO $$ BEGIN … EXCEPTION WHEN duplicate_object
 * THEN NULL; END $$, re-running it on an intact DB is a safe no-op.
 *
 * The bootstrap runs OUTSIDE of migrate.js's normal tracking loop so it:
 *   1. Executes even when schema_migrations already has a row for it.
 *   2. Does NOT update that row (avoids double-counting in the summary).
 *   3. Rolls back and exits on any error so we never proceed with a broken schema.
 */
async function bootstrapBaseSchema(client) {
  const BASE_MIGRATION = '000_base_schema.sql';
  const basePath = path.join(MIGRATIONS_DIR, BASE_MIGRATION);

  if (!fs.existsSync(basePath)) {
    logWarning(`${BASE_MIGRATION} not found — skipping bootstrap.`);
    return;
  }

  const content = fs.readFileSync(basePath, 'utf8').trim();
  if (!content) {
    logWarning(`${BASE_MIGRATION} is empty — skipping bootstrap.`);
    return;
  }

  logInfo(`Bootstrap: ensuring base schema (${BASE_MIGRATION}) is applied...`);
  const t0 = Date.now();

  try {
    await client.query('BEGIN');
    await client.query(content);
    const elapsed = Date.now() - t0;
    // Record as executed so the normal migration loop skips it cleanly.
    // Uses ON CONFLICT so this is safe whether the row already exists or not.
    await client.query(`
      INSERT INTO ${MIGRATION_TABLE} (migration_name, execution_time_ms, status)
      VALUES ($1, $2, 'success')
      ON CONFLICT (migration_name) DO UPDATE
        SET status            = 'success',
            executed_at       = CURRENT_TIMESTAMP,
            execution_time_ms = $2,
            error_message     = NULL
    `, [BASE_MIGRATION, elapsed]);
    await client.query('COMMIT');
    logSuccess(`Bootstrap complete (${elapsed}ms) — base tables are ready.\n`);
  } catch (err) {
    await client.query('ROLLBACK');
    logError(`Bootstrap FAILED: ${err.message}`);
    if (err.code === '42703' || /column .* does not exist/i.test(err.message || '')) {
      logError(
        'Hint: an existing table is missing a column that 000_base_schema.sql indexes. ' +
        'CREATE TABLE IF NOT EXISTS is a no-op on old tables — ensure ADD COLUMN runs before CREATE INDEX.',
      );
    }
    if (err.code === '42710' || /already exists/i.test(err.message || '')) {
      logError(
        'Hint: bootstrap hit a duplicate constraint/object. ' +
        'Ensure ADD CONSTRAINT blocks catch duplicate_object and check existing FKs by column, not exact name casing.',
      );
    }
    logError('Cannot proceed without the base schema. Aborting.');
    throw err;   // propagate → runMigrations will exit(1)
  }
}

// Run all pending migrations
async function runMigrations(force = false) {
  logHeader('DATABASE MIGRATION');
  
  const config = getDbConfig();
  const client = new Client(config);
  
  try {
    logInfo('Connecting to database...');
    log(`   Host: ${config.host}:${config.port}`, colors.cyan);
    log(`   Database: ${config.database}`, colors.cyan);
    log('');
    
    await client.connect();
    logSuccess('Connected to database\n');

    // ── Order matters: tracking table first, then bootstrap ─────────────────
    // createMigrationTable uses only pg system tables so it has no dependencies.
    // bootstrapBaseSchema then inserts into schema_migrations, so it must go second.
    await createMigrationTable(client);
    await bootstrapBaseSchema(client);
    
    const migrationFiles = getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      logWarning('No migration files found in ' + MIGRATIONS_DIR);
      return;
    }
    
    logInfo(`Found ${migrationFiles.length} migration files\n`);
    
    log('-'.repeat(80));
    log('EXECUTING MIGRATIONS', colors.bright);
    log('-'.repeat(80) + '\n');
    
    let executed = 0;
    let skipped = 0;
    let failed = 0;
    const startTime = Date.now();
    
    for (const migrationFile of migrationFiles) {
      const result = await executeMigration(client, migrationFile, force);
      
      if (result.skipped) {
        skipped++;
      } else if (result.success) {
        executed++;
      } else {
        failed++;
        if (!force) {
          logError('\nMigration failed. Stopping execution.');
          logInfo('Fix the error and run again, or use --force to continue');
          break;
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    logHeader('MIGRATION SUMMARY');
    
    log(`📊 Total: ${migrationFiles.length}`, colors.cyan);
    log(`✅ Executed: ${executed}`, colors.green);
    log(`⏭️  Skipped: ${skipped}`, colors.yellow);
    log(`❌ Failed: ${failed}`, failed > 0 ? colors.red : colors.green);
    log(`⏱️  Time: ${totalTime}ms`, colors.cyan);
    log('');
    
    if (failed === 0 && executed > 0) {
      logSuccess('All migrations completed successfully! 🎉');
    } else if (failed > 0) {
      logError('Some migrations failed. Please check the errors above.');
      process.exit(1);
    } else if (skipped === migrationFiles.length) {
      logInfo('All migrations already executed. Database is up to date.');
    }

    // Auto-reconcile historical failures (objective met / superseded / retry)
    const exitOnUnresolved = process.env.FAIL_ON_MIGRATION_ERROR !== 'false';
    await reconcileMigrations({ exitOnUnresolved });

  } catch (error) {
    logError(`Migration error: ${error.message}`);
    console.error(error);
    process.exit(1);

  } finally {
    await client.end();
    logInfo('Database connection closed');
  }
}

// Create new migration file
function createMigration(name) {
  logHeader('CREATE NEW MIGRATION');
  
  if (!name) {
    logError('Migration name is required');
    logInfo('Usage: npm run migrate:create <name>');
    process.exit(1);
  }
  
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const fileName = `${timestamp}_${name}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }
  
  const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- Description: Add your migration description here

-- Add your SQL statements here

`;
  
  fs.writeFileSync(filePath, template);
  
  logSuccess(`Migration created: ${fileName}`);
  logInfo(`Edit the file: ${filePath}`);
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  try {
    if (command === 'status' || command === '--status') {
      const config = getDbConfig();
      const client = new Client(config);
      await client.connect();
      await createMigrationTable(client);
      await showStatus(client);
      await client.end();

    } else if (command === 'errors' || command === '--errors') {
      const config = getDbConfig();
      const client = new Client(config);
      await client.connect();
      await createMigrationTable(client);
      await showFailedErrors(client);
      await client.end();

    } else if (command === 'retry-failed' || command === '--retry-failed') {
      await retryFailedMigrations();

    } else if (command === 'reconcile' || command === '--reconcile') {
      await reconcileMigrations({ exitOnUnresolved: true });

    } else if (command === 'doctor' || command === '--doctor') {
      await doctorMigrations();

    } else if (command === 'create' || command === '--create') {
      createMigration(args[1]);

    } else if (command === 'rollback' || command === '--rollback') {
      logError('Rollback not implemented yet');
      logInfo('Please create manual rollback migrations');

    } else {
      // Default: run migrations
      const force = args.includes('--force');
      await runMigrations(force);
    }
    
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runMigrations,
  showStatus,
  createMigration,
  reconcileMigrations,
  doctorMigrations,
};
