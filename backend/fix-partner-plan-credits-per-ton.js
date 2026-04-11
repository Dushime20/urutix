// Fix existing partner plans to inherit creditsPerTonTenant from parent subscription
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
});

async function fixPartnerPlanCreditsPerTon() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get all partner plans (plans with parent_subscription_id)
    const partnerPlansResult = await client.query(`
      SELECT 
        pp.id as partner_plan_id,
        pp.name as partner_plan_name,
        pp.credits_per_ton_tenant as current_tenant_rate,
        pp.credits_per_ton_truck_owner as current_truck_owner_rate,
        pp.parent_subscription_id,
        parent_plan.id as parent_plan_id,
        parent_plan.name as parent_plan_name,
        parent_plan.credits_per_ton_tenant as parent_tenant_rate,
        parent_plan.credits_per_ton_truck_owner as parent_truck_owner_rate
      FROM subscription_plans pp
      INNER JOIN tenant_subscriptions ts ON pp.parent_subscription_id = ts.id
      INNER JOIN subscription_plans parent_plan ON ts.plan_id = parent_plan.id
      WHERE pp.parent_subscription_id IS NOT NULL
    `);

    if (partnerPlansResult.rows.length === 0) {
      console.log('No partner plans found to update');
      return;
    }

    console.log(`Found ${partnerPlansResult.rows.length} partner plan(s) to update:\n`);

    for (const row of partnerPlansResult.rows) {
      console.log(`Partner Plan: ${row.partner_plan_name}`);
      console.log(`  - Current Tenant Rate: ${row.current_tenant_rate}`);
      console.log(`  - Current Truck Owner Rate: ${row.current_truck_owner_rate}`);
      console.log(`  - Parent Plan: ${row.parent_plan_name}`);
      console.log(`  - Parent Tenant Rate: ${row.parent_tenant_rate}`);
      console.log(`  - Parent Truck Owner Rate: ${row.parent_truck_owner_rate}`);

      // Update the partner plan to inherit from parent
      if (row.current_tenant_rate !== row.parent_tenant_rate) {
        console.log(`  → Updating creditsPerTonTenant from ${row.current_tenant_rate} to ${row.parent_tenant_rate}`);
        
        await client.query(`
          UPDATE subscription_plans
          SET credits_per_ton_tenant = $1
          WHERE id = $2
        `, [row.parent_tenant_rate, row.partner_plan_id]);
        
        console.log('  ✓ Updated successfully');
      } else {
        console.log('  ✓ Already has correct value');
      }
      console.log('');
    }

    // Verify the updates
    console.log('Verification - Updated Partner Plans:');
    const verifyResult = await client.query(`
      SELECT 
        pp.name as partner_plan_name,
        pp.credits_per_ton_tenant,
        pp.credits_per_ton_truck_owner,
        parent_plan.name as parent_plan_name,
        parent_plan.credits_per_ton_tenant as parent_tenant_rate,
        parent_plan.credits_per_ton_truck_owner as parent_truck_owner_rate
      FROM subscription_plans pp
      INNER JOIN tenant_subscriptions ts ON pp.parent_subscription_id = ts.id
      INNER JOIN subscription_plans parent_plan ON ts.plan_id = parent_plan.id
      WHERE pp.parent_subscription_id IS NOT NULL
    `);

    for (const row of verifyResult.rows) {
      console.log(`\n${row.partner_plan_name}:`);
      console.log(`  - Tenant Rate: ${row.credits_per_ton_tenant} (Parent: ${row.parent_tenant_rate}) ${row.credits_per_ton_tenant === row.parent_tenant_rate ? '✓' : '✗'}`);
      console.log(`  - Truck Owner Rate: ${row.credits_per_ton_truck_owner} (Parent: ${row.parent_truck_owner_rate}) ${row.credits_per_ton_truck_owner === row.parent_truck_owner_rate ? '✓' : '✗'}`);
    }

    console.log('\n✓ Partner plan credits per ton fixed successfully!');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixPartnerPlanCreditsPerTon().catch(console.error);
