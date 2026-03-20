/**
 * Check Subscription Data
 * Verifies what subscription data exists in the database
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkData() {
  console.log('🔍 Checking Subscription Data...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check subscription plans
    console.log('📦 Subscription Plans:');
    const plans = await client.query('SELECT id, name, slug, price_monthly, included_credits FROM subscription_plans ORDER BY display_order');
    if (plans.rows.length > 0) {
      plans.rows.forEach(plan => {
        console.log(`  - ${plan.name} (${plan.slug}): $${plan.price_monthly}/mo, ${plan.included_credits} credits`);
        console.log(`    ID: ${plan.id}`);
      });
    } else {
      console.log('  ⚠️  No plans found');
    }

    // Check credit packages
    console.log('\n💳 Credit Packages:');
    const packages = await client.query('SELECT name, credits, price FROM credit_packages ORDER BY display_order');
    if (packages.rows.length > 0) {
      packages.rows.forEach(pkg => {
        console.log(`  - ${pkg.name}: ${pkg.credits} credits for $${pkg.price}`);
      });
    } else {
      console.log('  ⚠️  No packages found');
    }

    // Check feature costs
    console.log('\n⚙️  Feature Credit Costs:');
    const features = await client.query('SELECT feature_code, credit_cost FROM feature_credit_costs ORDER BY feature_code LIMIT 5');
    if (features.rows.length > 0) {
      features.rows.forEach(feature => {
        console.log(`  - ${feature.feature_code}: ${feature.credit_cost} credits`);
      });
      console.log(`  ... and ${await client.query('SELECT COUNT(*) FROM feature_credit_costs').then(r => r.rows[0].count - 5)} more`);
    } else {
      console.log('  ⚠️  No feature costs found');
    }

    // Check tenants
    console.log('\n🏢 Tenants:');
    const tenants = await client.query('SELECT id, name FROM tenants LIMIT 5');
    if (tenants.rows.length > 0) {
      tenants.rows.forEach(tenant => {
        console.log(`  - ${tenant.name}`);
        console.log(`    ID: ${tenant.id}`);
      });
      const totalTenants = await client.query('SELECT COUNT(*) FROM tenants');
      console.log(`  Total: ${totalTenants.rows[0].count} tenants`);
    } else {
      console.log('  ⚠️  No tenants found');
    }

    // Check tenant subscriptions
    console.log('\n📋 Tenant Subscriptions:');
    const subscriptions = await client.query(`
      SELECT ts.id, t.name as tenant_name, sp.name as plan_name, ts.status 
      FROM tenant_subscriptions ts
      JOIN tenants t ON ts.tenant_id = t.id
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      LIMIT 10
    `);
    if (subscriptions.rows.length > 0) {
      subscriptions.rows.forEach(sub => {
        console.log(`  - ${sub.tenant_name}: ${sub.plan_name} (${sub.status})`);
      });
      const totalSubs = await client.query('SELECT COUNT(*) FROM tenant_subscriptions');
      console.log(`  Total: ${totalSubs.rows[0].count} subscriptions`);
    } else {
      console.log('  ⚠️  No tenant subscriptions found');
      console.log('  💡 This is why the admin page shows "No subscriptions found"');
    }

    // Check credit accounts
    console.log('\n💰 Credit Accounts:');
    const accounts = await client.query('SELECT COUNT(*) FROM credit_accounts');
    console.log(`  Total: ${accounts.rows[0].count} credit accounts`);

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log('='.repeat(60));
    console.log(`Subscription Plans: ${plans.rows.length}`);
    console.log(`Credit Packages: ${packages.rows.length}`);
    console.log(`Feature Costs: ${features.rows.length}`);
    console.log(`Tenants: ${tenants.rows.length}`);
    console.log(`Tenant Subscriptions: ${subscriptions.rows.length} ⚠️`);
    console.log(`Credit Accounts: ${accounts.rows[0].count}`);
    
    if (subscriptions.rows.length === 0 && tenants.rows.length > 0) {
      console.log('\n💡 Next Step: Create sample tenant subscriptions');
      console.log('   Run: node seed-tenant-subscriptions.js');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkData();
