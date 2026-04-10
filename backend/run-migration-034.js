const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    database: 'urutix',
    user: 'postgres',
    password: '1234',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const migrationPath = path.join(__dirname, 'migrations', '034_add_revenue_tracking_to_credit_accounts.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration: 034_add_revenue_tracking_to_credit_accounts.sql');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
