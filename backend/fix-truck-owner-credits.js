const { Client } = require('pg');

async function fixTruckOwnerCredits() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    database: 'urutix',
    user: 'postgres',
    password: '1234',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Find truck owner with incorrect credits
    const result = await client.query(`
      SELECT 
        ca.id,
        ca.user_id,
        ca.current_balance,
        ca.subscription_credits,
        ca.lifetime_earned,
        u.email,
        u.role,
        ts.id as subscription_id,
        sp.name as plan_name,
        sp.credit_cost_per_partner,
        sp.total_credits
      FROM credit_accounts ca
      JOIN users u ON ca.user_id = u.id
      LEFT JOIN tenant_subscriptions ts ON ts.user_id = ca.user_id AND ts.status = 'active'
      LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE u.role = 'TRUCK_OWNER'
        AND ca.current_balance > 1000
      ORDER BY ca.created_at DESC
    `);

    console.log(`\n📊 Found ${result.rows.length} truck owner(s) with potentially incorrect credits:\n`);

    for (const row of result.rows) {
      console.log(`👤 Truck Owner: ${row.email}`);
      console.log(`   Current Balance: ${row.current_balance}`);
      console.log(`   Subscription Credits: ${row.subscription_credits}`);
      console.log(`   Lifetime Earned: ${row.lifetime_earned}`);
      console.log(`   Plan: ${row.plan_name}`);
      console.log(`   Credit Cost Per Partner: ${row.credit_cost_per_partner}`);
      console.log(`   Total Credits (allocation): ${row.total_credits}`);
      
      if (row.credit_cost_per_partner && row.current_balance !== row.credit_cost_per_partner) {
        console.log(`   ⚠️  MISMATCH: Should have ${row.credit_cost_per_partner} credits, but has ${row.current_balance}`);
        
        // Fix the credit account
        const correctAmount = row.credit_cost_per_partner;
        await client.query(`
          UPDATE credit_accounts
          SET 
            current_balance = $1,
            subscription_credits = $1,
            lifetime_earned = $1,
            updated_at = NOW()
          WHERE id = $2
        `, [correctAmount, row.id]);
        
        console.log(`   ✅ FIXED: Updated to ${correctAmount} credits\n`);
      } else {
        console.log(`   ✅ Credits are correct\n`);
      }
    }

    console.log('✅ Credit fix completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixTruckOwnerCredits();
