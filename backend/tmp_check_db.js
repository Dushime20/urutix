const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, status, metadata FROM loads LIMIT 5');
    console.log('LOADS:', JSON.stringify(res.rows, null, 2));
    
    const trips = await client.query('SELECT id, "tripNumber", status FROM trips LIMIT 5');
    console.log('TRIPS:', JSON.stringify(trips.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
