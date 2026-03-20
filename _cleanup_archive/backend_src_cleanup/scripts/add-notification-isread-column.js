const { Client } = require('pg');
require('dotenv').config();

async function addColumn() {
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

    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'isRead';
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ isRead column already exists');
    } else {
      console.log('🔧 Adding isRead column to notifications table...');
      await client.query(`
        ALTER TABLE notifications 
        ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('✅ isRead column added successfully!');
    }

    // Also check and add metadata column if needed
    const metadataCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'metadata';
    `);

    if (metadataCheck.rows.length > 0) {
      console.log('✅ metadata column already exists');
    } else {
      console.log('🔧 Adding metadata column to notifications table...');
      await client.query(`
        ALTER TABLE notifications 
        ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
      `);
      console.log('✅ metadata column added successfully!');
    }

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('isRead', 'metadata')
      ORDER BY column_name;
    `);

    console.log('✅ Column verification:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
    });

    await client.end();
    console.log('✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
    console.error('❌ Error details:', error);
    await client.end();
    process.exit(1);
  }
}

addColumn();

