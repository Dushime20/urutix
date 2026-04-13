/**
 * Comprehensive Migration Runner
 * 
 * This script runs all SQL migrations in order and tracks their execution.
 * It prevents duplicate migrations and handles errors gracefully.
 * 
 * Usage:
 *   node run-all-migrations.js              # Run all pending migrations
 *   node run-all-migrations.js --force      # Force re-run all migrations
 *   node run-all-migrations.js --status     # Check migration status
 *   node run-all-migrations.js --rollback   # Rollback last migration
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
};

// Migration tracking table
const MIGRATION_TABLE = 'schema_migrations';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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

/**
 * Create migration tracking table if it doesn't exist
 */
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
  logSuccess('Migration tracking table ready');
}

/**
 * Get list of all migration files
 */
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    logError(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort alphabetically to ensure order
  
  return files;
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(client) {
  const result = await client.query(
    `SELECT migration_name, executed_at, status FROM ${MIGRATION_TABLE} ORDER BY id`
  );
  return result.rows;
}

/**
 * Calculate checksum for migration file
 */
function calculateChecksum(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Check if migration has been executed
 */
async function isMigrationExecuted(client, migrationName) {
  const result = await client.query(
    `SELECT id FROM ${MIGRATION_TABLE} WHERE migration_name = $1`,
    [migrationName]
  );
  return result.rows.length > 0;
}

/**
 * Record migration execution
 */
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

/**
 * Execute a single migration
 */
async function executeMigration(client, migrationFile, force = false) {
  const migrationPath = path.join(__dirname, 'migrations', migrationFile);
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const checksum = calculateChecksum(migrationContent);
  
  // Check if already executed
  if (!force && await isMigrationExecuted(client, migrationFile)) {
    logWarning(`Skipping ${migrationFile} (already executed)`);
    return { skipped: true };
  }
  
  logInfo(`Executing ${migrationFile}...`);
  
  const startTime = Date.now();
  
  try {
    // Execute migration in a transaction
    await client.query('BEGIN');
    await client.query(migrationContent);
    
    const executionTime = Date.now() - startTime;
    
    // Record successful migration
    await recordMigration(client, migrationFile, executionTime, 'success', null, checksum);
    
    await client.query('COMMIT');
    
    logSuccess(`${migrationFile} executed successfully (${executionTime}ms)`);
    return { success: true, executionTime };
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    const executionTime = Date.now() - startTime;
    
    // Record failed migration
    await recordMigration(client, migrationFile, executionTime, 'failed', error.message, checksum);
    
    logError(`${migrationFile} failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Show migration status
 */
async function showStatus(client) {
  log('\n' + '='.repeat(80), colors.bright);
  log('MIGRATION STATUS', colors.bright);
  log('='.repeat(80) + '\n', colors.bright);
  
  const allMigrations = getMigrationFiles();
  const executedMigrations = await getExecutedMigrations(client);
  
  const executedMap = new Map(
    executedMigrations.map(m => [m.migration_name, m])
  );
  
  log(`Total migrations: ${allMigrations.length}`, colors.cyan);
  log(`Executed: ${executedMigrations.length}`, colors.green);
  log(`Pending: ${allMigrations.length - executedMigrations.length}`, colors.yellow);
  log('');
  
  // Show detailed status
  log('Detailed Status:', colors.bright);
  log('-'.repeat(80));
  
  allMigrations.forEach((migration, index) => {
    const executed = executedMap.get(migration);
    const number = String(index + 1).padStart(3, '0');
    
    if (executed) {
      const status = executed.status === 'success' ? '✅' : '❌';
      const date = new Date(executed.executed_at).toLocaleString();
      log(`${number}. ${status} ${migration} (${date})`, 
          executed.status === 'success' ? colors.green : colors.red);
    } else {
      log(`${number}. ⏳ ${migration} (pending)`, colors.yellow);
    }
  });
  
  log('');
}

/**
 * Rollback last migration
 */
async function rollbackLastMigration(client) {
  const result = await client.query(
    `SELECT migration_name FROM ${MIGRATION_TABLE} 
     WHERE status = 'success' 
     ORDER BY executed_at DESC 
     LIMIT 1`
  );
  
  if (result.rows.length === 0) {
    logWarning('No migrations to rollback');
    return;
  }
  
  const lastMigration = result.rows[0].migration_name;
  logWarning(`Rolling back: ${lastMigration}`);
  
  // Check if rollback file exists
  const rollbackFile = lastMigration.replace('.sql', '_rollback.sql');
  const rollbackPath = path.join(__dirname, 'migrations', rollbackFile);
  
  if (!fs.existsSync(rollbackPath)) {
    logError(`Rollback file not found: ${rollbackFile}`);
    logInfo('Manual rollback required');
    return;
  }
  
  const rollbackContent = fs.readFileSync(rollbackPath, 'utf8');
  
  try {
    await client.query('BEGIN');
    await client.query(rollbackContent);
    
    // Remove migration record
    await client.query(
      `DELETE FROM ${MIGRATION_TABLE} WHERE migration_name = $1`,
      [lastMigration]
    );
    
    await client.query('COMMIT');
    logSuccess(`Rolled back: ${lastMigration}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    logError(`Rollback failed: ${error.message}`);
  }
}

/**
 * Main migration runner
 */
async function runMigrations() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const showStatusOnly = args.includes('--status');
  const rollback = args.includes('--rollback');
  
  const client = new Client(dbConfig);
  
  try {
    log('\n' + '='.repeat(80), colors.bright);
    log('DATABASE MIGRATION RUNNER', colors.bright);
    log('='.repeat(80) + '\n', colors.bright);
    
    logInfo('Connecting to database...');
    await client.connect();
    logSuccess('Connected to database');
    
    // Create migration tracking table
    await createMigrationTable(client);
    
    // Handle different modes
    if (showStatusOnly) {
      await showStatus(client);
      return;
    }
    
    if (rollback) {
      await rollbackLastMigration(client);
      return;
    }
    
    // Get all migrations
    const migrationFiles = getMigrationFiles();
    logInfo(`Found ${migrationFiles.length} migration files`);
    
    if (migrationFiles.length === 0) {
      logWarning('No migration files found');
      return;
    }
    
    // Execute migrations
    log('\n' + '-'.repeat(80));
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
          logError('Migration failed. Stopping execution.');
          break;
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Summary
    log('\n' + '='.repeat(80), colors.bright);
    log('MIGRATION SUMMARY', colors.bright);
    log('='.repeat(80) + '\n', colors.bright);
    
    log(`Total migrations: ${migrationFiles.length}`, colors.cyan);
    log(`Executed: ${executed}`, colors.green);
    log(`Skipped: ${skipped}`, colors.yellow);
    log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);
    log(`Total time: ${totalTime}ms`, colors.cyan);
    log('');
    
    if (failed === 0 && executed > 0) {
      logSuccess('All migrations completed successfully! 🎉');
    } else if (failed > 0) {
      logError('Some migrations failed. Please check the errors above.');
      process.exit(1);
    } else if (skipped === migrationFiles.length) {
      logInfo('All migrations already executed. Database is up to date.');
    }
    
  } catch (error) {
    logError(`Migration runner error: ${error.message}`);
    console.error(error);
    process.exit(1);
    
  } finally {
    await client.end();
    logInfo('Database connection closed');
  }
}

// Run migrations
runMigrations().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
