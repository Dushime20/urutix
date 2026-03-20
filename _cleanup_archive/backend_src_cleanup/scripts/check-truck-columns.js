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

    // Check all date-related columns
    const result = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'trucks' 
      AND (column_name LIKE '%created%' OR column_name LIKE '%updated%' OR column_name LIKE '%deleted%')
      ORDER BY column_name;
    `);

    console.log('\n📋 Date-related columns in trucks table:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Check if createdAt exists (camelCase)
    const camelCase = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' AND column_name = 'createdAt';
    `);

    // Check if created_at exists (snake_case)
    const snakeCase = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' AND column_name = 'created_at';
    `);

    console.log('\n🔍 Column name check:');
    console.log(`   - createdAt (camelCase): ${camelCase.rows.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   - created_at (snake_case): ${snakeCase.rows.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    if (camelCase.rows.length === 0 && snakeCase.rows.length === 0) {
      console.log('\n🔧 Need to add createdAt column...');
      await client.query(`
        ALTER TABLE trucks 
        ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ Added createdAt column');
    } else if (snakeCase.rows.length > 0 && camelCase.rows.length === 0) {
      console.log('\n⚠️  Column exists as created_at but code expects createdAt');
      console.log('   You may need to rename the column or update TypeORM configuration');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await client.end();
    process.exit(1);
  }
}

checkColumns();

