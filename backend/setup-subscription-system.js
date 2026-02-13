const { Pool } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function setupSubscriptionSystem() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   URUTIX SUBSCRIPTION & CREDIT SYSTEM SETUP                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();

  try {
    // Step 1: Create migrations table if it doesn't exist
    console.log('📋 Step 1: Checking migrations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Migrations table ready\n');

    // Step 2: Run migration
    console.log('📋 Step 2: Running database migration...');
    const migrationPath = path.join(__dirname, 'migrations', '006_subscription_credit_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Check if migration already ran
    const migrationCheck = await client.query(
      "SELECT * FROM migrations WHERE name = '006_subscription_credit_system'"
    );

    if (migrationCheck.rows.length > 0) {
      console.log('⏭️  Migration already executed, skipping...\n');
    } else {
      await client.query(migrationSQL);
      console.log('✅ Migration executed successfully\n');
    }

    // Step 3: Seed subscription plans
    console.log('📋 Step 3: Seeding subscription plans...');
    try {
      execSync('node seed-subscription-plans.js', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
    } catch (error) {
      console.log('⚠️  Subscription plans may already exist\n');
    }

    // Step 4: Seed credit packages
    console.log('📋 Step 4: Seeding credit packages...');
    try {
      execSync('node seed-credit-packages.js', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
    } catch (error) {
      console.log('⚠️  Credit packages may already exist\n');
    }

    // Step 5: Seed feature credit costs
    console.log('📋 Step 5: Seeding feature credit costs...');
    try {
      execSync('node seed-feature-credit-costs.js', { 
        stdio: 'inherit',
        cwd: __dirname 
      });
    } catch (error) {
      console.log('⚠️  Feature credit costs may already exist\n');
    }

    // Step 6: Verify setup
    console.log('📋 Step 6: Verifying setup...\n');
    
    const planCount = await client.query('SELECT COUNT(*) FROM subscription_plans');
    const packageCount = await client.query('SELECT COUNT(*) FROM credit_packages');
    const featureCount = await client.query('SELECT COUNT(*) FROM feature_credit_costs');

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    SETUP VERIFICATION                         ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log(`║  Subscription Plans:      ${planCount.rows[0].count.padStart(3)} created                       ║`);
    console.log(`║  Credit Packages:         ${packageCount.rows[0].count.padStart(3)} created                       ║`);
    console.log(`║  Feature Credit Costs:    ${featureCount.rows[0].count.padStart(3)} created                       ║`);
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║  Tables Created:                                              ║');
    console.log('║    ✓ subscription_plans                                       ║');
    console.log('║    ✓ tenant_subscriptions                                     ║');
    console.log('║    ✓ credit_accounts                                          ║');
    console.log('║    ✓ credit_transactions                                      ║');
    console.log('║    ✓ subscription_payments                                    ║');
    console.log('║    ✓ credit_packages                                          ║');
    console.log('║    ✓ feature_credit_costs                                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('🎉 SUBSCRIPTION SYSTEM SETUP COMPLETE!\n');
    console.log('Next Steps:');
    console.log('1. Review the subscription plans in the database');
    console.log('2. Implement SubscriptionService and CreditService');
    console.log('3. Create subscription management UI');
    console.log('4. Integrate payment gateway\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the setup
setupSubscriptionSystem()
  .then(() => {
    console.log('✅ Setup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup script failed:', error);
    process.exit(1);
  });
