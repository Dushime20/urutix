const { Client } = require('pg');
require('dotenv').config();

async function checkColumns() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'safety_inspections'");
    console.log('Columns:', res.rows.map(r => r.column_name));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkColumns();
