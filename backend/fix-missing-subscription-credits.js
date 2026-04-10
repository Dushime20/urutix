const { Client } = require('pg');

async function fixMissingCredits() {
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

    // Find subscriptions without corresponding credits
    const result = await client.query(`
      SELECT 
        ts.id as subscription_id,
        ts.tenant_id,
        ts.user_id,
        ts.status,
        ts.current_period_end,
        sp.name as plan_name,
        sp.total_credits,
        sp.price_per_credit,
        ca.current_balance,
        ca.subscription_credits,
        u.email
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      LEFT JOIN credit_accounts ca ON ca.tenant_id = ts.tenant_id AND ca.user_id = ts.user_id
      LEFT JOIN users u ON u.id = ts.user_id
      WHERE ts.status = 'active'
        AND ts.tenant_id = '3174d68f-cb7d-4428-b578-e931d1a3f464'
      ORDER BY ts.created_at
    `);

    console.log(`📋 Found ${result.rows.length} active subscriptions\n`);

    for (const row of result.rows) {
      console.log(`Subscription: ${row.plan_name}`);
      console.log(`  User: ${row.email}`);
      console.log(`  Total Credits in Plan: ${row.total_credits}`);
      console.log(`  Current Balance: ${row.current_balance || 0}`);
      console.log(`  Subscription Credits: ${row.subscription_credits || 0}`);

      // Check if credits need to be granted
      if (row.total_credits > 0 && (row.subscription_credits || 0) < row.total_credits) {
        const creditsToGrant = row.total_credits - (row.subscription_credits || 0);
        console.log(`  ⚠️  Missing ${creditsToGrant} credits!`);
        console.log(`  ✅ Granting ${creditsToGrant} credits...`);

        // Update credit account
        await client.query(`
          UPDATE credit_accounts
          SET 
            subscription_credits = subscription_credits + $1,
            current_balance = current_balance + $1,
            lifetime_earned = lifetime_earned + $1,
            last_refresh_date = NOW(),
            next_refresh_date = $2,
            updated_at = NOW()
          WHERE tenant_id = $3 AND user_id = $4
        `, [creditsToGrant, row.current_period_end, row.tenant_id, row.user_id]);

        // Create transaction record
        await client.query(`
          INSERT INTO credit_transactions (
            tenant_id,
            credit_account_id,
            type,
            amount,
            balance_after,
            description,
            subscription_id,
            expires_at,
            metadata,
            created_at
          )
          SELECT 
            $1,
            ca.id,
            'SUBSCRIPTION_GRANT',
            $2,
            ca.current_balance,
            'Subscription credits granted (retroactive fix)',
            $3,
            $4,
            jsonb_build_object('grantedAt', NOW(), 'retroactive', true),
            NOW()
          FROM credit_accounts ca
          WHERE ca.tenant_id = $1 AND ca.user_id = $5
        `, [row.tenant_id, creditsToGrant, row.subscription_id, row.current_period_end, row.user_id]);

        console.log(`  ✅ Credits granted successfully!\n`);
      } else {
        console.log(`  ✅ Credits already granted\n`);
      }
    }

    console.log('✅ Fix completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixMissingCredits();
