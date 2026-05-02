#!/usr/bin/env node
/**
 * Mark Migrations as Executed
 * 
 * This script marks all existing migrations as already executed.
 * Use this when:
 * - Database was created using TypeORM synchronize
 * - Tables already exist and match the current schema
 * - You want to start using migrations going forward
 * 
 * Usage: node mark-migrations-done.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MIGRATION_TABLE = 'schema_migrations';
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(80), colors.bright);
  log(message, colors.bright);
  log('='.repeat(80) + '\n', colors.bright);
}

async function markMigrationsAsDone() {
  logHeader('MARK MIGRATIONS AS EXECUTED');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'urutix',
  };
  
  const client = new Client(config);
  
  try {
    log(`📊 Database: ${config.database}`, colors.cyan);
    log(`🖥️  Host: ${config.host}:${config.port}\n`, colors.cyan);
    
    log('⚠️  WARNING: This will mark ALL migrations as executed!', colors.yellow);
    log('   Only use this if tables already exist from TypeORM synchronize.\n', colors.yellow);
    log('Press Ctrl+C within 5 seconds to cancel...\n', colors.yellow);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await client.connect();
    log('✅ Connected to database\n', colors.green);
    
    // Create migration table
    await client.query(`
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
    `);
    
    log('✅ Migration tracking table ready\n', colors.green);
    
    // Get all migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql') && !file.endsWith('_rollback.sql'))
      .sort();
    
    log(`📋 Found ${migrationFiles.length} migration files\n`, colors.cyan);
    
    let marked = 0;
    let skipped = 0;
    
    for (const file of migrationFiles) {
      // Check if already marked
      const result = await client.query(
        `SELECT id FROM ${MIGRATION_TABLE} WHERE migration_name = $1`,
        [file]
      );
      
      if (result.rows.length > 0) {
        log(`⏭️  ${file} (already marked)`, colors.yellow);
        skipped++;
      } else {
        await client.query(
          `INSERT INTO ${MIGRATION_TABLE} (migration_name, execution_time_ms, status, error_message)
           VALUES ($1, 0, 'success', 'Marked as executed (schema already exists)')`,
          [file]
        );
        log(`✅ ${file}`, colors.green);
        marked++;
      }
    }
    
    logHeader('SUMMARY');
    
    log(`📊 Total migrations: ${migrationFiles.length}`, colors.cyan);
    log(`✅ Marked as executed: ${marked}`, colors.green);
    log(`⏭️  Already marked: ${skipped}`, colors.yellow);
    log('');
    
    if (marked > 0) {
      log('✅ All migrations marked as executed!', colors.green);
      log('   Future migrations will run normally.\n', colors.green);
    } else {
      log('ℹ️  All migrations were already marked.\n', colors.cyan);
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
    
  } finally {
    await client.end();
    log('Database connection closed', colors.cyan);
  }
}

markMigrationsAsDone();
