const { Client } = require('pg');
require('dotenv').config();

async function dropAlertsTable() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🗑️  Dropping alerts table...');
    await client.query('DROP TABLE IF EXISTS alerts CASCADE');
    console.log('✅ Alerts table dropped!\n');

    console.log('🎉 Ready to run sync script again!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

dropAlertsTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
