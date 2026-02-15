const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '012_add_user_id_to_credit_accounts.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration: 012_add_user_id_to_credit_accounts.sql\n');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration executed successfully\n');

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'credit_accounts' AND column_name = 'user_id'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Verification: user_id column exists');
      console.log(`   Type: ${result.rows[0].data_type}`);
      console.log(`   Nullable: ${result.rows[0].is_nullable}`);
    } else {
      console.log('❌ Verification failed: user_id column not found');
    }

    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'credit_accounts' AND indexname LIKE '%user%'
    `);

    console.log('\n📊 User-related indexes:');
    indexResult.rows.forEach(row => {
      console.log(`   - ${row.indexname}`);
    });

    console.log('\n✅ Migration complete! You can now restart the backend.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
