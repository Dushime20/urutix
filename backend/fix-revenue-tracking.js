const { Client } = require('pg');

async function fixRevenueTracking() {
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

    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';

    // Get partner plan subscriptions
    const subs = await client.query(`
      SELECT 
        ts.id,
        ts.tenant_id,
        ts.user_id,
        sp.name as plan_name,
        sp.credit_cost_per_partner,
        sp.price_per_credit,
        u.email
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      LEFT JOIN users u ON u.id = ts.user_id
      WHERE sp.parent_subscription_id IS NOT NULL
        AND ts.tenant_id = $1
        AND ts.status = 'active'
      ORDER BY ts.created_at
    `, [tenantId]);

    console.log(`📋 Found ${subs.rows.length} partner plan subscriptions\n`);

    if (subs.rows.length === 0) {
      console.log('No partner plan subscriptions to process');
      return;
    }

    // Calculate total revenue
    let totalRevenue = 0;
    let totalCreditsAllocated = 0;
    let totalPartners = subs.rows.length;

    for (const sub of subs.rows) {
      const revenue = sub.credit_cost_per_partner * parseFloat(sub.price_per_credit);
      totalRevenue += revenue;
      totalCreditsAllocated += sub.credit_cost_per_partner;

      console.log(`Partner: ${sub.email}`);
      console.log(`  Plan: ${sub.plan_name}`);
      console.log(`  Credits: ${sub.credit_cost_per_partner}`);
      console.log(`  Price per Credit: $${sub.price_per_credit}`);
      console.log(`  Revenue: $${revenue}\n`);
    }

    console.log(`\n💰 Total Revenue: $${totalRevenue}`);
    console.log(`📊 Total Credits Allocated: ${totalCreditsAllocated}`);
    console.log(`👥 Total Partners: ${totalPartners}\n`);

    // Get or create tenant-level credit account
    let account = await client.query(`
      SELECT * FROM credit_accounts
      WHERE tenant_id = $1 AND user_id IS NULL
    `, [tenantId]);

    if (account.rows.length === 0) {
      console.log('Creating tenant-level credit account...');
      await client.query(`
        INSERT INTO credit_accounts (
          tenant_id,
          user_id,
          current_balance,
          subscription_credits,
          purchased_credits,
          bonus_credits,
          lifetime_earned,
          lifetime_spent,
          revenue_from_partner_sales,
          total_partners_sold,
          credits_allocated_to_partners,
          created_at,
          updated_at
        ) VALUES ($1, NULL, 0, 0, 0, 0, 0, 0, $2, $3, $4, NOW(), NOW())
      `, [tenantId, totalRevenue, totalPartners, totalCreditsAllocated]);
      console.log('✅ Tenant-level account created with revenue data\n');
    } else {
      console.log('Updating tenant-level credit account...');
      await client.query(`
        UPDATE credit_accounts
        SET 
          revenue_from_partner_sales = $1,
          total_partners_sold = $2,
          credits_allocated_to_partners = $3,
          updated_at = NOW()
        WHERE tenant_id = $4 AND user_id IS NULL
      `, [totalRevenue, totalPartners, totalCreditsAllocated, tenantId]);
      console.log('✅ Tenant-level account updated with revenue data\n');
    }

    // Verify the update
    const updated = await client.query(`
      SELECT 
        revenue_from_partner_sales,
        total_partners_sold,
        credits_allocated_to_partners
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id IS NULL
    `, [tenantId]);

    if (updated.rows.length > 0) {
      const acc = updated.rows[0];
      console.log('✅ Verification:');
      console.log(`  Revenue from Partner Sales: $${acc.revenue_from_partner_sales}`);
      console.log(`  Total Partners Sold: ${acc.total_partners_sold}`);
      console.log(`  Credits Allocated to Partners: ${acc.credits_allocated_to_partners}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixRevenueTracking();
