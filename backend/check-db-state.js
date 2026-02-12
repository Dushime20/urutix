const { Client } = require('pg');
require('dotenv').config();

async function checkDbState() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');
    
    // Check all tables
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    console.log(`Tables (${tables.rows.length}):`);
    tables.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });
    
    // Check existing enum types
    const enums = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      ORDER BY typname
    `);
    console.log(`\nENUM types (${enums.rows.length}):`);
    enums.rows.forEach(row => {
      console.log(`  - ${row.typname}`);
    });
    
    // Check extensions
    const extensions = await client.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      ORDER BY extname
    `);
    console.log(`\nInstalled extensions (${extensions.rows.length}):`);
    extensions.rows.forEach(row => {
      console.log(`  - ${row.extname} (v${row.extversion})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkDbState();
