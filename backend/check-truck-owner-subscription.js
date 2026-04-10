const { Client } = require('pg');
require('dotenv').config();

async function checkTruckOwnerSubscription() {
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

    // Get truck owner users
    console.log('=== TRUCK OWNERS ===');
    const truckOwnersResult = await client.query(`
      SELECT id, email, role, "tenantId"
      FROM users
      WHERE role = 'TRUCK_OWNER'
      ORDER BY email
    `);
    
    console.log(`Found ${truckOwnersResult.rows.length} truck owners:\n`);
    
    for (const user of truckOwnersResult.rows) {
      console.log(`\nTruck Owner: ${user.email}`);
      console.log(`  User ID: ${user.id}`);
      console.log(`  Tenant ID: ${user.tenantId}`);
      
      // Check their subscriptions
      const subsResult = await client.query(`
        SELECT 
          ts.id,
          ts.status,
          ts."user_id",
          ts."tenant_id",
          ts."plan_id",
          sp.name as plan_name,
          sp.slug as plan_slug,
          sp."credits_per_ton_truck_owner"
        FROM tenant_subscriptions ts
        LEFT JOIN subscription_plans sp ON ts."plan_id" = sp.id
        WHERE ts."user_id" = $1
        ORDER BY ts."created_at" DESC
      `, [user.id]);
      
      if (subsResult.rows.length === 0) {
        console.log('  ❌ NO SUBSCRIPTION FOUND');
      } else {
        console.log(`  Found ${subsResult.rows.length} subscription(s):`);
        subsResult.rows.forEach((sub, idx) => {
          console.log(`\n  Subscription ${idx + 1}:`);
          console.log(`    ID: ${sub.id}`);
          console.log(`    Status: ${sub.status}`);
          console.log(`    Plan: ${sub.plan_name} (${sub.plan_slug})`);
          console.log(`    Credits per ton (truck owner): ${sub.credits_per_ton_truck_owner}`);
          console.log(`    User ID: ${sub.user_id}`);
          console.log(`    Tenant ID: ${sub.tenant_id}`);
        });
      }
      
      // Check credit balance
      const creditResult = await client.query(`
        SELECT 
          "current_balance",
          "subscription_credits",
          "purchased_credits"
        FROM credit_accounts
        WHERE "user_id" = $1 AND "tenant_id" = $2
      `, [user.id, user.tenantId]);
      
      if (creditResult.rows.length > 0) {
        const credit = creditResult.rows[0];
        console.log(`\n  Credit Balance:`);
        console.log(`    Current: ${credit.current_balance}`);
        console.log(`    Subscription: ${credit.subscription_credits}`);
        console.log(`    Purchased: ${credit.purchased_credits}`);
      } else {
        console.log(`\n  ❌ NO CREDIT ACCOUNT FOUND`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTruckOwnerSubscription();
