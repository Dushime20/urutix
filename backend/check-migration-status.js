const { Client } = require('pg');
require('dotenv').config();

async function checkMigrationStatus() {
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
    
    // Check executed migrations
    const migrations = await client.query(`
      SELECT id, timestamp, name 
      FROM migrations 
      ORDER BY timestamp
    `);
    
    console.log(`Executed migrations (${migrations.rows.length}):`);
    migrations.rows.forEach((row, idx) => {
      console.log(`  ${idx + 1}. [${row.timestamp}] ${row.name}`);
    });
    
    // Check existing enum types
    console.log('\n\nExisting ENUM types:');
    const enums = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      ORDER BY typname
    `);
    console.log(`Found ${enums.rows.length} enum types:`);
    enums.rows.forEach(row => {
      console.log(`  - ${row.typname}`);
    });
    
    // Check all tables
    console.log('\n\nExisting tables:');
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    console.log(`Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkMigrationStatus();
