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

async function fixProMaxPlan() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Find and fix the "pro max" plan
    const plans = await AppDataSource.query(`
      SELECT id, name, slug, included_credits
      FROM subscription_plans
      WHERE slug = 'pro max'
    `);

    if (plans.length === 0) {
      console.log('❌ "pro max" plan not found!');
      await AppDataSource.destroy();
      return;
    }

    const plan = plans[0];
    console.log('📋 Found "pro max" plan:');
    console.log(`   ID: ${plan.id}`);
    console.log(`   Name: ${plan.name}`);
    console.log(`   Current Included Credits: ${plan.included_credits}`);
    console.log('');

    if (plan.included_credits === 0) {
      console.log('❌ Plan has 0 credits - this is WRONG!');
      console.log('🔧 Updating to 5000 credits...');
      
      await AppDataSource.query(`
        UPDATE subscription_plans
        SET included_credits = 5000
        WHERE id = $1
      `, [plan.id]);
      
      console.log('✅ Plan updated to 5000 credits!');
      console.log('');
    } else {
      console.log(`✅ Plan already has ${plan.included_credits} credits`);
      console.log('');
    }

    // Now fix the tenant admin's credit account
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    // Count active subscriptions
    const activeSubscriptions = await AppDataSource.query(`
      SELECT COUNT(*) as count
      FROM tenant_subscriptions
      WHERE tenant_id = $1 
        AND user_id = $2 
        AND status = 'active'
    `, [tenantId, adminUserId]);

    const activeCount = Number(activeSubscriptions[0].count);
    const totalCreditsFromSubscriptions = activeCount * 5000;

    console.log(`📊 Tenant admin has ${activeCount} active subscription(s)`);
    console.log(`💰 Total credits from subscriptions: ${totalCreditsFromSubscriptions}`);
    console.log('');

    // Get current spent amount
    const account = await AppDataSource.query(`
      SELECT lifetime_spent
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    const lifetimeSpent = account.length ? Number(account[0].lifetime_spent) : 0;
    const correctBalance = totalCreditsFromSubscriptions - lifetimeSpent;

    console.log(`📊 Calculation:`);
    console.log(`   Lifetime Earned: ${totalCreditsFromSubscriptions} (from ${activeCount} subscription(s))`);
    console.log(`   Lifetime Spent: ${lifetimeSpent}`);
    console.log(`   Correct Balance: ${correctBalance}`);
    console.log('');

    console.log('🔧 Updating credit account...');
    await AppDataSource.query(`
      UPDATE credit_accounts
      SET 
        lifetime_earned = $1,
        current_balance = $2,
        subscription_credits = $3
      WHERE tenant_id = $4 AND user_id = $5
    `, [totalCreditsFromSubscriptions, correctBalance, totalCreditsFromSubscriptions, tenantId, adminUserId]);

    console.log('✅ Credit account updated!');
    console.log('');

    // Verify
    const updated = await AppDataSource.query(`
      SELECT current_balance, lifetime_earned, lifetime_spent, subscription_credits
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (updated.length) {
      const acc = updated[0];
      console.log('✅ Verified - Final State:');
      console.log(`   Current Balance: ${acc.current_balance}`);
      console.log(`   Lifetime Earned: ${acc.lifetime_earned}`);
      console.log(`   Lifetime Spent: ${acc.lifetime_spent}`);
      console.log(`   Subscription Credits: ${acc.subscription_credits}`);
      console.log('');
      console.log(`🎉 Tenant admin now has ${acc.current_balance} credits available for marketplace!`);
      console.log('');
      console.log('⚠️  IMPORTANT: Restart the backend server to see the changes in the API!');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixProMaxPlan();
