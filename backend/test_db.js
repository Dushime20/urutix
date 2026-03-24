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
    console.log('Connected');

    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'safety_%'");
    console.log('Tables:', res.rows.map(r => r.table_name));
    
    const countRes = await client.query("SELECT count(*) FROM safety_inspections");
    console.log('Safety Inspections:', countRes.rows[0].count);
    
    const loadRes = await client.query("SELECT count(*) FROM loads");
    console.log('Loads:', loadRes.rows[0].count);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

check();
