/**
 * Run Credit Pricing Rules Migration
 * Creates the credit_pricing_rules table
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Running Credit Pricing Rules Migration...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '007_credit_pricing_rules.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration...\n');
    await client.query(migrationSQL);

    console.log('='.repeat(60));
    console.log('✨ Migration completed successfully!\n');

    // Verify table creation
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'credit_pricing_rules'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Table "credit_pricing_rules" created successfully\n');
      
      // Check columns
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'credit_pricing_rules'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Table Structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      console.log('');
    }

    console.log('💡 Next Steps:');
    console.log('  1. Run: npm run seed:pricing-rules');
    console.log('  2. Restart the backend server');
    console.log('  3. Test the pricing system');
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Database connection closed\n');
  }
}

runMigration();
