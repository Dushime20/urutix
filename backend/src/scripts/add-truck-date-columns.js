const { Client } = require('pg');
require('dotenv').config();

async function addColumns() {
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

    // Check if createdAt exists
    const checkCreated = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' AND column_name = 'createdAt';
    `);

    if (checkCreated.rows.length === 0) {
      console.log('🔧 Adding createdAt column to trucks table...');
      await client.query(`
        ALTER TABLE trucks 
        ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ createdAt column added successfully!');
    } else {
      console.log('✅ createdAt column already exists');
    }

    // Check if updatedAt exists
    const checkUpdated = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' AND column_name = 'updatedAt';
    `);

    if (checkUpdated.rows.length === 0) {
      console.log('🔧 Adding updatedAt column to trucks table...');
      await client.query(`
        ALTER TABLE trucks 
        ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
      `);
      console.log('✅ updatedAt column added successfully!');
    } else {
      console.log('✅ updatedAt column already exists');
    }

    // Verify columns
    const result = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'trucks' 
      AND column_name IN ('createdAt', 'updatedAt', 'deleted_at')
      ORDER BY column_name;
    `);

    console.log('\n✅ Column verification:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default}, nullable: ${row.is_nullable})`);
    });

    await client.end();
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    console.error('❌ Error details:', error);
    await client.end();
    process.exit(1);
  }
}

addColumns();

