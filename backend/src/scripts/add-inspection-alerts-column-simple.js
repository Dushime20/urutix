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

    console.log('🔧 Adding inspectionAlerts column to trucks table...');
    await client.query(`
      ALTER TABLE trucks 
      ADD COLUMN IF NOT EXISTS "inspectionAlerts" jsonb DEFAULT '[]'::jsonb;
    `);

    console.log('✅ inspectionAlerts column added successfully!');

    // Verify
    const result = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' AND column_name = 'inspectionAlerts';
    `);

    if (result.rows.length > 0) {
      console.log('✅ Column verification:', result.rows[0]);
    } else {
      console.warn('⚠️  Column not found after creation');
    }

    await client.end();
    console.log('✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding inspectionAlerts column:', error.message);
    await client.end();
    process.exit(1);
  }
}

addColumn();

