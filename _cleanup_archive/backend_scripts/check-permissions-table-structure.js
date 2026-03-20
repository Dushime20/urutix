#!/usr/bin/env node

const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: '123',
    database: 'urutix',
  });

  try {
    console.log('🔍 Checking permissions table structure...\n');

    // Get table structure
    const result = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'permissions'
      ORDER BY ordinal_position
    `);

    console.log(`📋 Permissions table columns:\n`);
    
    result.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}`);
      if (col.column_default) {
        console.log(`   Default: ${col.column_default}`);
      }
      console.log('');
    });

    // Check a sample permission
    console.log('\n🔍 Sample permissions:\n');
    const sampleResult = await pool.query(`
      SELECT * FROM permissions LIMIT 3
    `);

    sampleResult.rows.forEach((perm, index) => {
      console.log(`${index + 1}. ${JSON.stringify(perm, null, 2)}`);
      console.log('');
    });

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
