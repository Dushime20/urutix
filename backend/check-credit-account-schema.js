const { Client } = require('pg');
require('dotenv').config();

async function checkSchema() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Check credit_accounts table structure
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'credit_accounts'
      ORDER BY ordinal_position
    `);

    console.log('credit_accounts table columns:');
    console.log('='.repeat(80));
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check if user_id column exists
    const hasUserId = result.rows.some(row => row.column_name === 'user_id');
    
    console.log('\n' + '='.repeat(80));
    if (hasUserId) {
      console.log('✅ user_id column EXISTS');
    } else {
      console.log('❌ user_id column DOES NOT EXIST - needs to be added');
    }

    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'credit_accounts'
    `);

    console.log('\nIndexes on credit_accounts:');
    console.log('='.repeat(80));
    indexResult.rows.forEach(row => {
      console.log(`${row.indexname}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema();
