/**
 * Run SQL Migration 036: Create Credit Marketplace Settings
 * 
 * This script runs the SQL migration directly without TypeORM
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
  });

  try {
    console.log('=== Running Migration 036: Credit Marketplace Settings ===\n');
    
    // Connect to database
    console.log('1. Connecting to database...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'urutix'}`);
    await client.connect();
    console.log('✓ Connected successfully\n');

    // Read migration file
    console.log('2. Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations', '036_create_credit_marketplace_settings.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('✓ Migration file loaded\n');

    // Check if table already exists
    console.log('3. Checking if table already exists...');
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_marketplace_settings'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log('⚠️  Table credit_marketplace_settings already exists');
      console.log('   Skipping migration (already applied)\n');
    } else {
      console.log('✓ Table does not exist, proceeding with migration\n');
      
      // Run migration
      console.log('4. Running migration SQL...');
      await client.query(migrationSQL);
      console.log('✓ Migration executed successfully\n');
    }

    // Verify table was created
    console.log('5. Verifying table structure...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'credit_marketplace_settings'
      ORDER BY ordinal_position;
    `);
    
    console.log('✓ Table structure:');
    columnsResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    console.log();

    // Check indexes
    console.log('6. Verifying indexes...');
    const indexesResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'credit_marketplace_settings';
    `);
    
    console.log('✓ Indexes created:');
    indexesResult.rows.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });
    console.log();

    // Check if credit_accounts columns were added
    console.log('7. Verifying credit_accounts columns...');
    const creditAccountsColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'credit_accounts'
      AND column_name IN ('revenue_from_marketplace_sales', 'total_credits_sold_marketplace', 'total_marketplace_transactions');
    `);
    
    if (creditAccountsColumns.rows.length === 3) {
      console.log('✓ All marketplace columns added to credit_accounts');
      creditAccountsColumns.rows.forEach(col => {
        console.log(`   - ${col.column_name}`);
      });
    } else {
      console.log('⚠️  Some columns missing from credit_accounts');
    }
    console.log();

    console.log('=== Migration 036 Completed Successfully! ===\n');
    console.log('Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test the marketplace endpoints');
    console.log('3. Configure marketplace settings in the UI\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
