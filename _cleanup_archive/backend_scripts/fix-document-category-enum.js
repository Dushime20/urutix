/**
 * Fix Document Category Enum - Add Missing DRIVER and CARGO Values
 * 
 * The DocumentCategory enum in the entity has DRIVER and CARGO values,
 * but the database enum is missing them.
 */

const { Client } = require('pg');
require('dotenv').config();

async function fixDocumentCategoryEnum() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check current enum values
    console.log('\n--- Checking current enum values ---');
    const currentValues = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'documents_category_enum'
      )
      ORDER BY enumsortorder;
    `);

    console.log('Current enum values:');
    currentValues.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });

    // Check if DRIVER and CARGO already exist
    const hasDriver = currentValues.rows.some(row => row.enumlabel === 'DRIVER');
    const hasCargo = currentValues.rows.some(row => row.enumlabel === 'CARGO');

    // Add DRIVER if missing
    if (!hasDriver) {
      console.log('\n--- Adding DRIVER to enum ---');
      await client.query(`
        ALTER TYPE documents_category_enum ADD VALUE IF NOT EXISTS 'DRIVER';
      `);
      console.log('✓ Added DRIVER to documents_category_enum');
    } else {
      console.log('\n✓ DRIVER already exists in enum');
    }

    // Add CARGO if missing
    if (!hasCargo) {
      console.log('\n--- Adding CARGO to enum ---');
      await client.query(`
        ALTER TYPE documents_category_enum ADD VALUE IF NOT EXISTS 'CARGO';
      `);
      console.log('✓ Added CARGO to documents_category_enum');
    } else {
      console.log('\n✓ CARGO already exists in enum');
    }

    // Verify final enum values
    console.log('\n--- Verifying final enum values ---');
    const finalValues = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'documents_category_enum'
      )
      ORDER BY enumsortorder;
    `);

    console.log('Final enum values:');
    finalValues.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });

    console.log('\n✅ Document category enum fixed successfully!');
    console.log('\nYou can now use these category values:');
    console.log('  - IDENTITY');
    console.log('  - LICENSE');
    console.log('  - INSURANCE');
    console.log('  - CERTIFICATION');
    console.log('  - COMPLIANCE');
    console.log('  - FINANCIAL');
    console.log('  - OPERATIONAL');
    console.log('  - LEGAL');
    console.log('  - CARGO');
    console.log('  - DRIVER');
    console.log('  - OTHER');

  } catch (error) {
    console.error('❌ Error fixing document category enum:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixDocumentCategoryEnum();
