const { Client } = require('pg');
require('dotenv').config();

async function checkLoadsSchema() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log(`📊 Database: ${process.env.DB_NAME || 'urutix'} on port ${process.env.DB_PORT || 5432}`);
    console.log('');

    // Get all columns from loads table
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'loads'
      ORDER BY ordinal_position
    `);

    console.log('📋 Loads table columns:');
    console.log('─'.repeat(80));
    
    const requiredColumns = ['loadType', 'equipmentType', 'cargoType', 'visibility'];
    const foundColumns = result.rows.map(row => row.column_name);
    
    console.log('\n🔍 Checking required columns:');
    requiredColumns.forEach(col => {
      const exists = foundColumns.includes(col);
      console.log(`   ${exists ? '✅' : '❌'} ${col}`);
    });

    console.log('\n📊 All columns in loads table:');
    result.rows.forEach((row, index) => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(required)';
      console.log(`   ${index + 1}. ${row.column_name} - ${row.data_type} ${nullable}`);
    });

    console.log('\n✅ Schema check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkLoadsSchema();
