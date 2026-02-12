const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log(`\nTables in database (${result.rows.length}):\n`);
    result.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });
    
    // Check specifically for key tables
    const keyTables = ['trucks', 'users', 'loads', 'notifications'];
    console.log('\nKey tables status:');
    keyTables.forEach(table => {
      const exists = result.rows.find(r => r.tablename === table);
      console.log(`  ${exists ? '✓' : '✗'} ${table}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
