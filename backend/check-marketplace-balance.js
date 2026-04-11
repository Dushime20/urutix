const { DataSource } = require('typeorm');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
});

async function checkMarketplaceBalance() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Get tenant admin user
    const tenantAdmin = await AppDataSource.query(`
      SELECT id, email, role, "tenantId" as tenant_id 
      FROM users 
      WHERE email = 'tenantadmin@demo.com'
    `);
    
    if (!tenantAdmin.length) {
      console.log('❌ Tenant admin not found');
      return;
    }

    const admin = tenantAdmin[0];
    console.log('📋 Tenant Admin:', admin.email);
    console.log('   User ID:', admin.id);
    console.log('   Tenant ID:', admin.tenant_id);
    console.log('');

    // Get ALL credit accounts for this tenant
    const allAccounts = await AppDataSource.query(`
      SELECT 
        id,
        tenant_id,
        user_id,
        current_balance,
        subscription_credits,
        purchased_credits,
        bonus_credits,
        lifetime_earned,
        lifetime_spent,
        revenue_from_partner_sales,
        credits_allocated_to_partners
      FROM credit_accounts
      WHERE tenant_id = $1
      ORDER BY user_id NULLS FIRST
    `, [admin.tenant_id]);

    console.log('💰 ALL Credit Accounts for Tenant:');
    console.log('=====================================');
    for (const acc of allAccounts) {
      console.log(`\nAccount ID: ${acc.id}`);
      console.log(`User ID: ${acc.user_id || 'NULL (tenant-level)'}`);
      console.log(`Current Balance: ${acc.current_balance}`);
      console.log(`Subscription Credits: ${acc.subscription_credits}`);
      console.log(`Purchased Credits: ${acc.purchased_credits}`);
      console.log(`Bonus Credits: ${acc.bonus_credits}`);
      console.log(`Lifetime Earned: ${acc.lifetime_earned}`);
      console.log(`Lifetime Spent: ${acc.lifetime_spent}`);
      console.log(`Revenue from Partner Sales: ${acc.revenue_from_partner_sales}`);
      console.log(`Credits Allocated to Partners: ${acc.credits_allocated_to_partners}`);
    }

    // Get tenant admin's specific account
    const adminAccount = await AppDataSource.query(`
      SELECT 
        id,
        current_balance,
        subscription_credits,
        purchased_credits,
        bonus_credits,
        lifetime_earned,
        lifetime_spent
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [admin.tenant_id, admin.id]);

    console.log('\n\n🎯 Tenant Admin\'s Personal Account:');
    console.log('=====================================');
    if (adminAccount.length) {
      const acc = adminAccount[0];
      console.log(`Account ID: ${acc.id}`);
      console.log(`Current Balance: ${acc.current_balance}`);
      console.log(`Subscription Credits: ${acc.subscription_credits}`);
      console.log(`Purchased Credits: ${acc.purchased_credits}`);
      console.log(`Bonus Credits: ${acc.bonus_credits}`);
      console.log(`Lifetime Earned: ${acc.lifetime_earned}`);
      console.log(`Lifetime Spent: ${acc.lifetime_spent}`);
      console.log('');
      console.log(`📊 Calculation Check:`);
      console.log(`   Lifetime Earned - Lifetime Spent = ${acc.lifetime_earned} - ${acc.lifetime_spent} = ${acc.lifetime_earned - acc.lifetime_spent}`);
      console.log(`   Current Balance (from DB): ${acc.current_balance}`);
      console.log(`   Match: ${acc.current_balance === (acc.lifetime_earned - acc.lifetime_spent) ? '✅' : '❌'}`);
    } else {
      console.log('❌ No personal account found for tenant admin');
    }

    // Get all transactions for tenant admin
    const transactions = await AppDataSource.query(`
      SELECT 
        id,
        type,
        amount,
        balance_after,
        description,
        created_at
      FROM credit_transactions
      WHERE tenant_id = $1 AND user_id = $2
      ORDER BY created_at DESC
    `, [admin.tenant_id, admin.id]);

    console.log('\n\n📜 Tenant Admin\'s Transaction History:');
    console.log('=========================================');
    for (const tx of transactions) {
      console.log(`\n${tx.created_at.toISOString()}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  Amount: ${tx.amount}`);
      console.log(`  Balance After: ${tx.balance_after}`);
      console.log(`  Description: ${tx.description}`);
    }

    // Calculate totals from transactions
    const earned = transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const spent = transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

    console.log('\n\n🧮 Transaction-Based Calculation:');
    console.log('===================================');
    console.log(`Total Earned (from transactions): ${earned}`);
    console.log(`Total Spent (from transactions): ${spent}`);
    console.log(`Expected Balance: ${earned - spent}`);
    console.log(`Actual Balance: ${adminAccount.length ? adminAccount[0].current_balance : 'N/A'}`);

    // Check marketplace settings
    const marketplaceSettings = await AppDataSource.query(`
      SELECT * FROM credit_marketplace_settings
      WHERE tenant_id = $1
    `, [admin.tenant_id]);

    console.log('\n\n🏪 Marketplace Settings:');
    console.log('=========================');
    if (marketplaceSettings.length) {
      const settings = marketplaceSettings[0];
      console.log(`Enabled: ${settings.is_enabled}`);
      console.log(`Min Purchase: ${settings.min_purchase_amount}`);
      console.log(`Max Purchase: ${settings.max_purchase_amount || 'No limit'}`);
      console.log(`Price Per Credit: ${settings.price_per_credit}`);
      console.log(`Tenant Admin User ID: ${settings.tenant_admin_user_id}`);
      console.log('');
      console.log(`✅ Marketplace is checking account for user: ${settings.tenant_admin_user_id}`);
      console.log(`   This user has ${adminAccount.length ? adminAccount[0].current_balance : 'N/A'} credits available`);
    } else {
      console.log('❌ No marketplace settings found');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMarketplaceBalance();
