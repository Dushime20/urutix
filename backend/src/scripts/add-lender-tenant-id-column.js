const { Client } = require('pg');
require('dotenv').config();

async function addTenantIdColumn() {
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
      WHERE table_name = 'lenders' AND column_name = 'tenant_id';
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ tenant_id column already exists in lenders table');
    } else {
      console.log('🔧 Adding tenant_id column to lenders table...');
      await client.query(`
        ALTER TABLE lenders 
        ADD COLUMN tenant_id UUID;
      `);
      console.log('✅ tenant_id column added successfully!');

      // Add index for better query performance
      console.log('🔧 Adding index on tenant_id...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS "IDX_lenders_tenant_id_status" ON lenders(tenant_id, status);
      `);
      console.log('✅ Index added successfully!');
    }

    // Verify the column
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'lenders' AND column_name = 'tenant_id';
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ Column verification:');
      console.log(result.rows[0]);
    } else {
      console.warn('⚠️  Column not found after creation');
    }

    await client.end();
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding tenant_id column:', error);
    await client.end();
    process.exit(1);
  }
}

addTenantIdColumn();

