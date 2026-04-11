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

async function fixPlanCredits() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Check the "pro max" plan
    const plans = await AppDataSource.query(`
      SELECT id, name, slug, included_credits
      FROM subscription_plans
      WHERE slug = 'pro-max'
    `);

    if (plans.length) {
      const plan = plans[0];
      console.log('📋 Current "pro max" plan:');
      console.log(`   ID: ${plan.id}`);
      console.log(`   Name: ${plan.name}`);
      console.log(`   Included Credits: ${plan.included_credits}`);
      console.log('');

      if (plan.included_credits === 0) {
        console.log('❌ Plan has 0 credits! This is wrong.');
        console.log('🔧 Fixing: Setting included_credits to 5000...');
        
        await AppDataSource.query(`
          UPDATE subscription_plans
          SET included_credits = 5000
          WHERE id = $1
        `, [plan.id]);
        
        console.log('✅ Plan fixed!');
        console.log('');
      } else {
        console.log('✅ Plan already has correct credits');
        console.log('');
      }
    }

    // Now check tenant admin's subscriptions
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    const subscriptions = await AppDataSource.query(`
      SELECT ts.id, ts.status, sp.name, sp.included_credits
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.tenant_id = $1 AND ts.user_id = $2
      ORDER BY ts.created_at ASC
    `, [tenantId, adminUserId]);

    console.log(`📋 Tenant admin's subscriptions (${subscriptions.length}):\n`);
    
    let totalCreditsExpected = 0;
    for (const sub of subscriptions) {
      console.log(`Subscription: ${sub.id.substring(0, 8)}...`);
      console.log(`  Plan: ${sub.name}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Included Credits: ${sub.included_credits}`);
      
      if (sub.status === 'active') {
        totalCreditsExpected += Number(sub.included_credits);
      }
      console.log('');
    }

    console.log(`💰 Total credits expected from ACTIVE subscriptions: ${totalCreditsExpected}`);
    console.log('');

    // Check current balance
    const account = await AppDataSource.query(`
      SELECT current_balance, lifetime_earned, lifetime_spent
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (account.length) {
      const acc = account[0];
      console.log('📊 Current credit account:');
      console.log(`   Current Balance: ${acc.current_balance}`);
      console.log(`   Lifetime Earned: ${acc.lifetime_earned}`);
      console.log(`   Lifetime Spent: ${acc.lifetime_spent}`);
      console.log('');

      const correctBalance = totalCreditsExpected - acc.lifetime_spent;
      
      if (acc.current_balance !== correctBalance) {
        console.log(`❌ Balance is wrong! Should be: ${correctBalance}`);
        console.log('🔧 Fixing credit account...');
        
        await AppDataSource.query(`
          UPDATE credit_accounts
          SET 
            lifetime_earned = $1,
            current_balance = $2,
            subscription_credits = $3
          WHERE tenant_id = $4 AND user_id = $5
        `, [totalCreditsExpected, correctBalance, totalCreditsExpected, tenantId, adminUserId]);
        
        console.log('✅ Credit account fixed!');
        console.log('');
        console.log(`🎉 Tenant admin now has ${correctBalance} credits available!`);
      } else {
        console.log('✅ Balance is correct!');
      }
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPlanCredits();
