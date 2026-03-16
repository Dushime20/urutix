const { Client } = require('pg');
require('dotenv').config();

async function checkFullSchema() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check cargo_owner_analytics table schema
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cargo_owner_analytics'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 cargo_owner_analytics Table Schema:');
    console.log('======================================');
    result.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkFullSchema();