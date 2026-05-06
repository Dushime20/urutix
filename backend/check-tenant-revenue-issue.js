const { Client } = require('pg');

async function checkTenantRevenueIssue() {
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

    const tenantId = '49e52b60-7c9f-4946-a6ca-2fe8bb0d9e95';

    console.log('═'.repeat(70));
    console.log(`🔍 INVESTIGATING TENANT: ${tenantId}`);
    console.log('═'.repeat(70));
    console.log();

    // 1. Check tenant info
    console.log('1️⃣  TENANT INFORMATION:');
    console.log('─'.repeat(70));
    const tenant = await client.query(`
      SELECT id, name, subdomain, status, "createdAt"
      FROM tenants
      WHERE id = $1
    `, [tenantId]);

    if (tenant.rows.length === 0) {
      console.log('❌ Tenant not found!');
      return;
    }

    const tenantInfo = tenant.rows[0];
    console.log(`Name: ${tenantInfo.name}`);
    console.log(`Subdomain: ${tenantInfo.subdomain}`);
    console.log(`Status: ${tenantInfo.status}`);
    console.log(`Created: ${tenantInfo.createdAt}`);
    console.log();

    // 2. Check credit account
    console.log('2️⃣  CREDIT ACCOUNT (Tenant-Level):');
    console.log('─'.repeat(70));
    const creditAccount = await client.query(`
      SELECT 
        id,
        tenant_id,
        user_id,
        current_balance,
        revenue_from_partner_sales,
        total_partners_sold,
        credits_allocated_to_partners,
        "createdAt",
        "updatedAt"
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id IS NULL
    `, [tenantId]);

    if (creditAccount.rows.length === 0) {
      console.log('ℹ️  No tenant-level credit account found');
    } else {
      const acc = creditAccount.rows[0];
      console.log(`Account ID: ${acc.id}`);
      console.log(`Current Balance: ${acc.current_balance}`);
      console.log(`Revenue from Partner Sales: ${acc.revenue_from_partner_sales} ⚠️`);
      console.log(`Total Partners Sold: ${acc.total_partners_sold}`);
      console.log(`Credits Allocated: ${acc.credits_allocated_to_partners}`);
      console.log(`Created: ${acc.createdAt}`);
      console.log(`Updated: ${acc.updatedAt}`);
    }
    console.log();

    // 3. Check payments
    console.log('3️⃣  COMPLETED PAYMENTS (Last 7 days):');
    console.log('─'.repeat(70));
    const payments = await client.query(`
      SELECT 
        id,
        amount,
        status,
        "createdAt"
      FROM payments
      WHERE tenant_id = $1 
        AND status = 'COMPLETED'
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      ORDER BY "createdAt" DESC
    `, [tenantId]);

    if (payments.rows.length === 0) {
      console.log('ℹ️  No completed payments found');
    } else {
      console.log(`Found ${payments.rows.length} payments:`);
      let totalPayments = 0;
      payments.rows.forEach(p => {
        console.log(`  - ${p.createdAt}: $${p.amount} (${p.status})`);
        totalPayments += parseFloat(p.amount);
      });
      console.log(`Total Payment Revenue: $${totalPayments}`);
    }
    console.log();

    // 4. Check partner subscriptions
    console.log('4️⃣  PARTNER PLAN SUBSCRIPTIONS:');
    console.log('─'.repeat(70));
    const subs = await client.query(`
      SELECT 
        ts.id,
        ts.user_id,
        u.email,
        sp.name as plan_name,
        sp.credit_cost_per_partner,
        sp.price_per_credit,
        ts.status,
        ts."createdAt"
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      LEFT JOIN users u ON u.id = ts.user_id
      WHERE ts.tenant_id = $1
        AND sp.parent_subscription_id IS NOT NULL
      ORDER BY ts."createdAt" DESC
    `, [tenantId]);

    if (subs.rows.length === 0) {
      console.log('ℹ️  No partner plan subscriptions found');
    } else {
      console.log(`Found ${subs.rows.length} partner subscriptions:`);
      let totalRevenue = 0;
      subs.rows.forEach(sub => {
        const revenue = sub.credit_cost_per_partner * parseFloat(sub.price_per_credit);
        totalRevenue += revenue;
        console.log(`  - ${sub.email || 'N/A'}: ${sub.plan_name}`);
        console.log(`    Credits: ${sub.credit_cost_per_partner}, Price: $${sub.price_per_credit}`);
        console.log(`    Revenue: $${revenue}, Status: ${sub.status}`);
      });
      console.log(`Total Partner Revenue: $${totalRevenue}`);
    }
    console.log();

    // 5. Check loads
    console.log('5️⃣  LOADS (Last 7 days):');
    console.log('─'.repeat(70));
    const loads = await client.query(`
      SELECT COUNT(*) as count, status
      FROM loads
      WHERE tenant_id = $1
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY status
    `, [tenantId]);

    if (loads.rows.length === 0) {
      console.log('ℹ️  No loads found');
    } else {
      loads.rows.forEach(row => {
        console.log(`  ${row.status}: ${row.count}`);
      });
    }
    console.log();

    // 6. Check trips
    console.log('6️⃣  TRIPS (Last 7 days):');
    console.log('─'.repeat(70));
    const trips = await client.query(`
      SELECT COUNT(*) as count, status
      FROM trips
      WHERE tenant_id = $1
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY status
    `, [tenantId]);

    if (trips.rows.length === 0) {
      console.log('ℹ️  No trips found');
    } else {
      trips.rows.forEach(row => {
        console.log(`  ${row.status}: ${row.count}`);
      });
    }
    console.log();

    // 7. SUMMARY
    console.log('═'.repeat(70));
    console.log('📊 REVENUE CALCULATION SUMMARY:');
    console.log('═'.repeat(70));
    
    const operationalRevenue = payments.rows.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const partnerRevenue = creditAccount.rows.length > 0 
      ? parseFloat(creditAccount.rows[0].revenue_from_partner_sales) 
      : 0;
    const totalRevenue = operationalRevenue + partnerRevenue;

    console.log(`Operational Revenue (Payments): $${operationalRevenue.toFixed(2)}`);
    console.log(`Partner Sales Revenue (Credit Account): $${partnerRevenue.toFixed(2)} ⚠️`);
    console.log(`─`.repeat(70));
    console.log(`TOTAL REVENUE: $${totalRevenue.toFixed(2)}`);
    console.log();

    if (partnerRevenue > 0 && subs.rows.length === 0) {
      console.log('🚨 ISSUE DETECTED:');
      console.log('   The credit account shows partner sales revenue,');
      console.log('   but there are NO partner subscriptions for this tenant!');
      console.log();
      console.log('💡 POSSIBLE CAUSES:');
      console.log('   1. Data was migrated incorrectly from another tenant');
      console.log('   2. A script set default values incorrectly');
      console.log('   3. The credit account was created with wrong data');
      console.log();
      console.log('✅ RECOMMENDED FIX:');
      console.log('   Reset the revenue_from_partner_sales to 0 for this tenant');
      console.log();
      console.log('   SQL Command:');
      console.log(`   UPDATE credit_accounts`);
      console.log(`   SET revenue_from_partner_sales = 0,`);
      console.log(`       total_partners_sold = 0,`);
      console.log(`       credits_allocated_to_partners = 0`);
      console.log(`   WHERE tenant_id = '${tenantId}' AND user_id IS NULL;`);
    }

    console.log('═'.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkTenantRevenueIssue();
