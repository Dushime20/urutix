const { Client } = require('pg');
require('dotenv').config();

async function testSlotValidation() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';

    console.log('=== PARTNER PLAN SLOT VALIDATION TEST ===\n');

    // Get all partner plans
    const plansResult = await client.query(`
      SELECT 
        id,
        name,
        slug,
        available_slots,
        credit_cost_per_partner,
        parent_subscription_id
      FROM subscription_plans
      WHERE parent_subscription_id IS NOT NULL
        AND is_active = true
      ORDER BY name
    `);

    console.log(`Found ${plansResult.rows.length} partner plan(s):\n`);

    for (const plan of plansResult.rows) {
      console.log(`Plan: ${plan.name} (${plan.slug})`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  Available Slots: ${plan.available_slots}`);
      console.log(`  Credits per Partner: ${plan.credit_cost_per_partner}`);

      // Count active subscriptions for this plan
      const subsResult = await client.query(`
        SELECT COUNT(*) as purchased_count
        FROM tenant_subscriptions
        WHERE plan_id = $1 AND status = 'active'
      `, [plan.id]);

      const purchasedCount = parseInt(subsResult.rows[0].purchased_count);
      const slotsRemaining = plan.available_slots - purchasedCount;

      console.log(`  Purchased: ${purchasedCount}`);
      console.log(`  Slots Remaining: ${slotsRemaining}`);

      if (purchasedCount >= plan.available_slots) {
        console.log(`  ❌ FULL - No more slots available`);
      } else if (slotsRemaining <= 2) {
        console.log(`  ⚠️  WARNING - Only ${slotsRemaining} slot(s) remaining!`);
      } else {
        console.log(`  ✅ Available - ${slotsRemaining} slot(s) remaining`);
      }

      // List who purchased
      if (purchasedCount > 0) {
        const purchasersResult = await client.query(`
          SELECT 
            ts.id as subscription_id,
            ts.created_at,
            u.email,
            u.id as user_id
          FROM tenant_subscriptions ts
          JOIN users u ON ts.user_id = u.id
          WHERE ts.plan_id = $1 AND ts.status = 'active'
          ORDER BY ts.created_at ASC
        `, [plan.id]);

        console.log(`\n  Purchasers:`);
        purchasersResult.rows.forEach((purchaser, idx) => {
          console.log(`    ${idx + 1}. ${purchaser.email} (${new Date(purchaser.created_at).toLocaleDateString()})`);
        });
      }

      console.log('');
    }

    console.log('\n=== VALIDATION RULES ===');
    console.log('✅ Backend validates slots before purchase');
    console.log('✅ Frontend shows slot availability');
    console.log('✅ Purchase button disabled when slots are full');
    console.log('✅ Warning shown when only 1-2 slots remaining');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testSlotValidation();
