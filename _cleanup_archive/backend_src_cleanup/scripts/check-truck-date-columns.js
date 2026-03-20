const { Client } = require('pg');
require('dotenv').config();

async function checkColumns() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' 
      AND (column_name LIKE '%created%' OR column_name LIKE '%updated%' OR column_name LIKE '%deleted%')
      ORDER BY column_name;
    `);

    console.log('\n📋 Date columns in trucks table:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

checkColumns();

