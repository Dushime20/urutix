/**
 * Fix Migration 003 Issue
 * 
 * This script fixes the issue with migration 003 by:
 * 1. Dropping the problematic view
 * 2. Removing the migration record
 * 3. Allowing it to be re-run
 */

const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
};

async function fixMigration() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔧 Fixing migration 003...\n');
    
    await client.connect();
    console.log('✅ Connected to database\n');

    // Drop the view if it exists
    console.log('Dropping view user_all_permissions...');
    await client.query('DROP VIEW IF EXISTS user_all_permissions CASCADE');
    console.log('✅ View dropped\n');

    // Remove the failed migration record
    console.log('Removing migration record for 003...');
    await client.query(`
      DELETE FROM schema_migrations 
      WHERE migration_name = '003_rbac_permissions_system.sql'
    `);
    console.log('✅ Migration record removed\n');

    console.log('✅ Fix complete! Now run: npm run migrations:run\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixMigration();
