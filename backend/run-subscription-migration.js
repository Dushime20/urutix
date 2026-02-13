/**
 * Run Subscription Migration Script
 * Executes the 006_subscription_credit_system.sql migration
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Running Subscription Migration...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', '006_subscription_credit_system_simple.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executing migration SQL...\n');

    // Execute the migration
    await client.query(sql);

    console.log('✅ Migration executed successfully!\n');

    // Verify tables were created
    const tables = [
      'subscription_plans',
      'tenant_subscriptions',
      'credit_accounts',
      'credit_transactions',
      'subscription_payments',
      'credit_packages',
      'feature_credit_costs',
    ];

    console.log('🔍 Verifying tables...\n');
    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      if (result.rows[0].exists) {
        console.log(`  ✅ ${table}`);
      } else {
        console.log(`  ❌ ${table} - NOT FOUND`);
      }
    }

    console.log('\n🎉 Subscription migration complete!\n');
    console.log('Next step: Run seed script');
    console.log('  npm run seed:subscriptions\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
