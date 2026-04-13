/**
 * Migration Creator Script
 * 
 * This script helps create new migration files with proper naming and structure.
 * 
 * Usage:
 *   node create-migration.js "add user preferences table"
 *   node create-migration.js "update subscription plans"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
 * Get next migration number
 */
function getNextMigrationNumber() {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
    return '001';
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql') && /^\d{3}_/.test(file));
  
  if (files.length === 0) {
    return '001';
  }
  
  // Get highest number
  const numbers = files.map(file => parseInt(file.substring(0, 3)));
  const maxNumber = Math.max(...numbers);
  
  return String(maxNumber + 1).padStart(3, '0');
}

/**
 * Convert description to filename
 */
function descriptionToFilename(description) {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50); // Limit length
}

/**
 * Create migration template
 */
function createMigrationTemplate(description) {
  const timestamp = new Date().toISOString();
  
  return `-- Migration: ${description}
-- Created: ${timestamp}
-- Description: [Add detailed description here]

-- ============================================
-- UP Migration
-- ============================================

-- Add your migration SQL here
-- Example:
-- CREATE TABLE example_table (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- ============================================
-- Notes
-- ============================================
-- Add any important notes about this migration:
-- - Dependencies
-- - Breaking changes
-- - Data migration requirements
-- - Rollback considerations
`;
}

/**
 * Create rollback template
 */
function createRollbackTemplate(description) {
  const timestamp = new Date().toISOString();
  
  return `-- Rollback Migration: ${description}
-- Created: ${timestamp}
-- Description: Rollback for migration

-- ============================================
-- DOWN Migration (Rollback)
-- ============================================

-- Add your rollback SQL here
-- This should undo everything in the UP migration
-- Example:
-- DROP TABLE IF EXISTS example_table;

-- ============================================
-- Notes
-- ============================================
-- Important rollback considerations:
-- - Data loss warnings
-- - Dependencies to check
-- - Manual steps required
`;
}

/**
 * Update migrations tracker
 */
function updateMigrationsTracker(migrationNumber, filename, description) {
  const trackerPath = path.join(__dirname, 'migrations', 'MIGRATIONS_TRACKER.md');
  
  if (!fs.existsSync(trackerPath)) {
    logWarning('MIGRATIONS_TRACKER.md not found. Skipping tracker update.');
    return;
  }
  
  const trackerContent = fs.readFileSync(trackerPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  
  // Find the table and add new row
  const newRow = `| ${migrationNumber} | ${filename} | ${description} | ${today} | ⏳ |`;
  
  // Insert before the "## Notes" section
  const updatedContent = trackerContent.replace(
    /(\n## Notes)/,
    `\n${newRow}$1`
  );
  
  fs.writeFileSync(trackerPath, updatedContent, 'utf8');
  logSuccess('Updated MIGRATIONS_TRACKER.md');
}

/**
 * Main function
 */
async function createMigration() {
  log('\n' + '='.repeat(80), colors.bright);
  log('MIGRATION CREATOR', colors.bright);
  log('='.repeat(80) + '\n', colors.bright);
  
  // Get description from command line or prompt
  let description = process.argv.slice(2).join(' ');
  
  if (!description) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    description = await new Promise(resolve => {
      rl.question('Enter migration description: ', answer => {
        rl.close();
        resolve(answer);
      });
    });
  }
  
  if (!description || description.trim() === '') {
    logError('Migration description is required');
    process.exit(1);
  }
  
  description = description.trim();
  
  // Get next migration number
  const migrationNumber = getNextMigrationNumber();
  const filename = descriptionToFilename(description);
  const migrationFilename = `${migrationNumber}_${filename}.sql`;
  const rollbackFilename = `${migrationNumber}_${filename}_rollback.sql`;
  
  logInfo(`Creating migration: ${migrationFilename}`);
  
  // Create migration file
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationPath = path.join(migrationsDir, migrationFilename);
  const rollbackPath = path.join(migrationsDir, rollbackFilename);
  
  // Check if file already exists
  if (fs.existsSync(migrationPath)) {
    logError(`Migration file already exists: ${migrationFilename}`);
    process.exit(1);
  }
  
  // Create migration file
  const migrationContent = createMigrationTemplate(description);
  fs.writeFileSync(migrationPath, migrationContent, 'utf8');
  logSuccess(`Created: ${migrationFilename}`);
  
  // Create rollback file
  const rollbackContent = createRollbackTemplate(description);
  fs.writeFileSync(rollbackPath, rollbackContent, 'utf8');
  logSuccess(`Created: ${rollbackFilename}`);
  
  // Update tracker
  updateMigrationsTracker(migrationNumber, migrationFilename, description);
  
  // Summary
  log('\n' + '='.repeat(80), colors.bright);
  log('MIGRATION CREATED SUCCESSFULLY', colors.bright);
  log('='.repeat(80) + '\n', colors.bright);
  
  log(`Migration Number: ${migrationNumber}`, colors.cyan);
  log(`Description: ${description}`, colors.cyan);
  log(`File: migrations/${migrationFilename}`, colors.cyan);
  log(`Rollback: migrations/${rollbackFilename}`, colors.cyan);
  log('');
  
  logInfo('Next steps:');
  log('1. Edit the migration file and add your SQL');
  log('2. Edit the rollback file and add rollback SQL');
  log('3. Test the migration locally');
  log('4. Commit both files and MIGRATIONS_TRACKER.md');
  log('5. Run: node run-all-migrations.js');
  log('');
}

// Run
createMigration().catch(error => {
  logError(`Error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
