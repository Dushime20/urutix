const { Client } = require('pg');

async function checkPartnerPlans() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    database: 'urutix',
    user: 'postgres',
    password: '1234',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check partner plans
    const plans = await client.query(`
      SELECT 
        id,
        name,
        total_credits,
        credit_cost_per_partner,
        available_slots,
        parent_subscription_id,
        price_per_credit
      FROM subscription_plans
      WHERE parent_subscription_id IS NOT NULL
      ORDER BY created_at
    `);

    console.log(`📋 Partner Plans (${plans.rows.length} found):\n`);
    
    for (const plan of plans.rows) {
      console.log(`Plan: ${plan.name}`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  Total Credits: ${plan.total_credits}`);
      console.log(`  Credit Cost Per Partner: ${plan.credit_cost_per_partner}`);
      console.log(`  Available Slots: ${plan.available_slots}`);
      console.log(`  Price Per Credit: $${plan.price_per_credit}`);
      console.log(`  Parent Subscription: ${plan.parent_subscription_id}\n`);
    }

    // Check subscriptions for these plans
    const subs = await client.query(`
      SELECT 
        ts.id,
        ts.tenant_id,
        ts.user_id,
        ts.status,
        sp.name as plan_name,
        sp.total_credits,
        sp.credit_cost_per_partner,
        u.email
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      LEFT JOIN users u ON u.id = ts.user_id
      WHERE sp.parent_subscription_id IS NOT NULL
      ORDER BY ts.created_at
    `);

    console.log(`📋 Partner Plan Subscriptions (${subs.rows.length} found):\n`);
    
    for (const sub of subs.rows) {
      console.log(`Subscription: ${sub.plan_name}`);
      console.log(`  User: ${sub.email}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Total Credits in Plan: ${sub.total_credits}`);
      console.log(`  Credit Cost Per Partner: ${sub.credit_cost_per_partner}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkPartnerPlans();
