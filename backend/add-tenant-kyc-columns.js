const { Client } = require('pg');
require('dotenv').config();

async function addTenantKycColumns() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create KYC status enum if it doesn't exist
    console.log('📝 Creating KYC status enum...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE tenant_kyc_status_enum AS ENUM (
          'PENDING',
          'SUBMITTED',
          'UNDER_REVIEW',
          'APPROVED',
          'REJECTED',
          'INCOMPLETE'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ KYC status enum created/verified');

    // Add kycStatus column
    console.log('📝 Adding kycStatus column...');
    await client.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS "kycStatus" tenant_kyc_status_enum DEFAULT 'PENDING';
    `);
    console.log('✅ kycStatus column added');

    // Add kycData column
    console.log('📝 Adding kycData column...');
    await client.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS "kycData" jsonb DEFAULT '{}';
    `);
    console.log('✅ kycData column added');

    // Add kycSubmittedAt column
    console.log('📝 Adding kycSubmittedAt column...');
    await client.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS "kycSubmittedAt" TIMESTAMP;
    `);
    console.log('✅ kycSubmittedAt column added');

    // Add kycVerifiedAt column
    console.log('📝 Adding kycVerifiedAt column...');
    await client.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS "kycVerifiedAt" TIMESTAMP;
    `);
    console.log('✅ kycVerifiedAt column added');

    // Add kycNotes column
    console.log('📝 Adding kycNotes column...');
    await client.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS "kycNotes" TEXT;
    `);
    console.log('✅ kycNotes column added');

    // Verify columns were added
    console.log('\n📊 Verifying tenant table structure...');
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'tenants'
      AND column_name IN ('kycStatus', 'kycData', 'kycSubmittedAt', 'kycVerifiedAt', 'kycNotes')
      ORDER BY column_name;
    `);

    console.log('\n✅ KYC Columns in tenants table:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.column_default ? `(default: ${row.column_default})` : ''}`);
    });

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error adding KYC columns:', error);
    throw error;
  } finally {
    await client.end();
  }
}

addTenantKycColumns()
  .then(() => {
    console.log('\n🎉 All KYC columns added successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
