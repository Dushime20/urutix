const { Client } = require('pg');

async function checkTenantCredits() {
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

    // Get tenant admin user
    const tenantAdminResult = await client.query(`
      SELECT id, email, "tenantId", role 
      FROM users 
      WHERE email = 'tenantadmin@demo.com'
    `);
    
    if (tenantAdminResult.rows.length === 0) {
      console.log('❌ Tenant admin not found');
      return;
    }

    const tenantAdmin = tenantAdminResult.rows[0];
    console.log('👤 Tenant Admin:', tenantAdmin.email);
    console.log('   Tenant ID:', tenantAdmin.tenantId);
    console.log('   User ID:', tenantAdmin.id);
    console.log('');

    // Check credit accounts for this tenant
    const creditAccountsResult = await client.query(`
      SELECT 
        ca.*,
        u.email,
        u.role
      FROM credit_accounts ca
      LEFT JOIN users u ON ca.user_id = u.id
      WHERE ca.tenant_id = $1
      ORDER BY ca.created_at
    `, [tenantAdmin.tenantId]);

    console.log(`📊 Credit Accounts (${creditAccountsResult.rows.length} found):\n`);
    
    creditAccountsResult.rows.forEach((account, index) => {
      console.log(`Account ${index + 1}:`);
      console.log(`  ID: ${account.id}`);
      console.log(`  User: ${account.email || 'TENANT-LEVEL (no user)'}`);
      console.log(`  Role: ${account.role || 'N/A'}`);
      console.log(`  Current Balance: ${account.current_balance}`);
      console.log(`  Subscription Credits: ${account.subscription_credits}`);
      console.log(`  Purchased Credits: ${account.purchased_credits}`);
      console.log(`  Lifetime Earned: ${account.lifetime_earned}`);
      console.log(`  Lifetime Spent: ${account.lifetime_spent}`);
      console.log(`  Revenue from Partner Sales: ${account.revenue_from_partner_sales || 0}`);
      console.log(`  Total Partners Sold: ${account.total_partners_sold || 0}`);
      console.log(`  Credits Allocated to Partners: ${account.credits_allocated_to_partners || 0}`);
      console.log('');
    });

    // Check subscriptions
    const subscriptionsResult = await client.query(`
      SELECT 
        ts.*,
        sp.name as plan_name,
        sp.total_credits,
        sp.price_per_credit
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.tenant_id = $1
      ORDER BY ts.created_at DESC
    `, [tenantAdmin.tenantId]);

    console.log(`📋 Subscriptions (${subscriptionsResult.rows.length} found):\n`);
    
    subscriptionsResult.rows.forEach((sub, index) => {
      console.log(`Subscription ${index + 1}:`);
      console.log(`  Plan: ${sub.plan_name}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Total Credits: ${sub.total_credits}`);
      console.log(`  Price per Credit: $${sub.price_per_credit}`);
      console.log(`  User ID: ${sub.user_id || 'N/A'}`);
      console.log(`  Created: ${sub.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkTenantCredits();
