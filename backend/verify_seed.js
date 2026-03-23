const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function checkSeeds() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    // Run the seed first to be sure
    const sql = fs.readFileSync('seed_driver_reports.sql', 'utf8');
    await client.query(sql);

    const res = await client.query('SELECT COUNT(*) FROM safety_inspections');
    console.log(`Safety Inspections count: ${res.rows[0].count}`);
    
    const res2 = await client.query("SELECT COUNT(*) FROM loads WHERE metadata->>'inspectionStatus' = 'COMPLETED'");
    console.log(`Completed Cargo Inspections count: ${res2.rows[0].count}`);
  } catch (err) {
    console.error('Error during seeding/verification:', err);
  } finally {
    await client.end();
  }
}

checkSeeds();
