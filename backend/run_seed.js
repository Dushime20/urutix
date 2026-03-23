const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function runSql() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync('seed_driver_reports.sql', 'utf8');
    const res = await client.query(sql);
    console.log('Successfully executed seed_driver_reports.sql');
    
    // Check if anything was actually inserted
    const countRes = await client.query('SELECT COUNT(*) FROM safety_inspections');
    console.log(`Safety Inspections count: ${countRes.rows[0].count}`);
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

runSql();
