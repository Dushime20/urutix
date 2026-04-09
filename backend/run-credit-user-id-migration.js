const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'urutix',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding user_id column to credit_accounts...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '030_add_user_id_to_credit_accounts.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    console.log('📝 Executing migration SQL...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify the column exists
    console.log('🔍 Verifying user_id column...');
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'credit_accounts' 
      AND column_name = 'user_id';
    `);
    
    if (result.rows.length > 0) {
      console.log('\n✅ user_id column verified:');
      console.table(result.rows);
    } else {
      console.log('\n⚠️  user_id column not found!');
    }
    
    // Check existing credit accounts
    const accountsResult = await client.query(`
      SELECT 
        id,
        tenant_id,
        user_id,
        current_balance,
        created_at
      FROM credit_accounts
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    
    if (accountsResult.rows.length > 0) {
      console.log('\n📋 Recent credit accounts (showing user_id):');
      console.table(accountsResult.rows);
    } else {
      console.log('\n⚠️  No credit accounts found in database.');
    }
    
    console.log('\n✨ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Test purchasing a subscription');
    console.log('   3. Verify credit accounts are created correctly');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
