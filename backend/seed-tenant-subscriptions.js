/**
 * Seed Tenant Subscriptions
 * Creates sample subscriptions for existing tenants
 */

const { Client } = require('pg');
require('dotenv').config();

async function seedTenantSubscriptions() {
  console.log('🌱 Seeding Tenant Subscriptions...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all tenants
    const tenantsResult = await client.query('SELECT id, name FROM tenants');
    const tenants = tenantsResult.rows;

    if (tenants.length === 0) {
      console.log('⚠️  No tenants found. Please create tenants first.');
      return;
    }

    console.log(`Found ${tenants.length} tenants\n`);

    // Get subscription plans
    const plansResult = await client.query('SELECT id, name, slug, included_credits FROM subscription_plans ORDER BY display_order');
    const plans = plansResult.rows;

    if (plans.length === 0) {
      console.log('⚠️  No subscription plans found. Please run seed:subscriptions first.');
      return;
    }

    console.log(`Found ${plans.length} subscription plans\n`);
    console.log('Creating subscriptions...\n');

    let created = 0;
    let skipped = 0;

    for (const tenant of tenants) {
      // Check if tenant already has a subscription
      const existing = await client.query(
        'SELECT id FROM tenant_subscriptions WHERE tenant_id = $1',
        [tenant.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  ${tenant.name} - Already has subscription`);
        skipped++;
        continue;
      }

      // Randomly assign a plan (weighted towards Professional)
      const rand = Math.random();
      let selectedPlan;
      if (rand < 0.2) {
        selectedPlan = plans[0]; // Starter (20%)
      } else if (rand < 0.7) {
        selectedPlan = plans[1]; // Professional (50%)
      } else {
        selectedPlan = plans[2]; // Enterprise (30%)
      }

      // Randomly decide if trial or active
      const isTrial = Math.random() < 0.3; // 30% chance of trial
      const status = isTrial ? 'trial' : 'active';

      // Set dates
      const now = new Date();
      const currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(currentPeriodStart.getDate() - Math.floor(Math.random() * 20)); // Started 0-20 days ago

      const currentPeriodEnd = new Date(currentPeriodStart);
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // 1 month subscription

      let trialStart = null;
      let trialEnd = null;
      if (isTrial) {
        trialStart = currentPeriodStart;
        trialEnd = new Date(trialStart);
        trialEnd.setDate(trialEnd.getDate() + 14); // 14 day trial
      }

      // Create subscription
      await client.query(
        `INSERT INTO tenant_subscriptions 
        (tenant_id, plan_id, status, billing_cycle, current_period_start, current_period_end, 
         trial_start, trial_end, auto_renew, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          tenant.id,
          selectedPlan.id,
          status,
          'monthly',
          currentPeriodStart,
          currentPeriodEnd,
          trialStart,
          trialEnd,
          true,
        ]
      );

      // Create credit account
      await client.query(
        `INSERT INTO credit_accounts 
        (tenant_id, current_balance, subscription_credits, purchased_credits, bonus_credits, 
         lifetime_earned, lifetime_spent, created_at, updated_at)
        VALUES ($1, $2, $2, 0, 0, $2, 0, NOW(), NOW())
        ON CONFLICT (tenant_id) DO NOTHING`,
        [tenant.id, selectedPlan.included_credits]
      );

      console.log(`  ✅ ${tenant.name} - ${selectedPlan.name} (${status}) - ${selectedPlan.included_credits} credits`);
      created++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Seeding Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`  - Created: ${created} subscriptions`);
    console.log(`  - Skipped: ${skipped} (already had subscriptions)`);
    console.log(`  - Total: ${created + skipped} tenants processed`);

    // Show breakdown
    const breakdown = await client.query(`
      SELECT sp.name, ts.status, COUNT(*) as count
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      GROUP BY sp.name, ts.status
      ORDER BY sp.name, ts.status
    `);

    console.log('\n📈 Subscription Breakdown:');
    breakdown.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.status}): ${row.count}`);
    });

    console.log('\n💡 Next Steps:');
    console.log('  1. Restart backend if running');
    console.log('  2. Visit http://localhost:5173/admin/subscriptions');
    console.log('  3. You should now see tenant subscriptions!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedTenantSubscriptions();
