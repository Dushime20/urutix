const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '035_add_user_id_to_credit_transactions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration 035: Add user_id to credit_transactions...\n');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'credit_transactions' AND column_name = 'user_id'
    `);

    if (result.rows.length > 0) {
      console.log('Column details:');
      console.log(result.rows[0]);
    } else {
      console.log('⚠️ Warning: Column not found after migration');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

runMigration();
