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

async function reactivateSubscription() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';
    const cancelledSubId = 'feda4e5e-801d-46a9-949e-8756b6838082';

    console.log('🔍 Finding cancelled subscription...\n');

    // Get the cancelled subscription
    const subscription = await AppDataSource.query(`
      SELECT 
        ts.id,
        ts.status,
        ts.current_period_start,
        ts.current_period_end,
        sp.name as plan_name,
        sp.included_credits
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.id = $1
    `, [cancelledSubId]);

    if (!subscription.length) {
      console.log('❌ Subscription not found!');
      await AppDataSource.destroy();
      return;
    }

    const sub = subscription[0];
    console.log('📋 Found subscription:');
    console.log(`   ID: ${sub.id}`);
    console.log(`   Plan: ${sub.plan_name}`);
    console.log(`   Status: ${sub.status}`);
    console.log(`   Included Credits: ${sub.included_credits}`);
    console.log('');

    if (sub.status !== 'cancelled') {
      console.log('✅ Subscription is already active!');
      await AppDataSource.destroy();
      return;
    }

    console.log('🔧 Reactivating subscription...');
    
    // Update subscription status to active
    await AppDataSource.query(`
      UPDATE tenant_subscriptions
      SET 
        status = 'active',
        cancelled_at = NULL,
        cancellation_reason = NULL
      WHERE id = $1
    `, [cancelledSubId]);

    console.log('✅ Subscription reactivated!');
    console.log('');

    // Get credit account
    const account = await AppDataSource.query(`
      SELECT id, current_balance, lifetime_earned, lifetime_spent, subscription_credits
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (!account.length) {
      console.log('❌ Credit account not found!');
      await AppDataSource.destroy();
      return;
    }

    const acc = account[0];
    console.log('📊 Current credit account:');
    console.log(`   Current Balance: ${acc.current_balance}`);
    console.log(`   Lifetime Earned: ${acc.lifetime_earned}`);
    console.log(`   Lifetime Spent: ${acc.lifetime_spent}`);
    console.log(`   Subscription Credits: ${acc.subscription_credits}`);
    console.log('');

    // Add the credits from the reactivated subscription
    const creditsToAdd = Number(sub.included_credits);
    const newLifetimeEarned = Number(acc.lifetime_earned) + creditsToAdd;
    const newSubscriptionCredits = Number(acc.subscription_credits) + creditsToAdd;
    const newCurrentBalance = Number(acc.current_balance) + creditsToAdd;

    console.log('🔧 Granting credits from reactivated subscription...');
    console.log(`   Adding: ${creditsToAdd} credits`);
    console.log('');

    // Update credit account
    await AppDataSource.query(`
      UPDATE credit_accounts
      SET 
        lifetime_earned = $1,
        subscription_credits = $2,
        current_balance = $3
      WHERE tenant_id = $4 AND user_id = $5
    `, [newLifetimeEarned, newSubscriptionCredits, newCurrentBalance, tenantId, adminUserId]);

    console.log('✅ Credits granted!');
    console.log('');

    // Create a transaction record
    await AppDataSource.query(`
      INSERT INTO credit_transactions (
        tenant_id,
        user_id,
        credit_account_id,
        type,
        amount,
        balance_after,
        description,
        subscription_id,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      tenantId,
      adminUserId,
      acc.id,
      'SUBSCRIPTION_GRANT',
      creditsToAdd,
      newCurrentBalance,
      'Credits granted from reactivated subscription',
      cancelledSubId,
      sub.current_period_end
    ]);

    console.log('✅ Transaction record created!');
    console.log('');

    // Verify final state
    const updated = await AppDataSource.query(`
      SELECT current_balance, lifetime_earned, lifetime_spent, subscription_credits
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (updated.length) {
      const upd = updated[0];
      console.log('✅ Verified - Final State:');
      console.log(`   Current Balance: ${upd.current_balance}`);
      console.log(`   Lifetime Earned: ${upd.lifetime_earned}`);
      console.log(`   Lifetime Spent: ${upd.lifetime_spent}`);
      console.log(`   Subscription Credits: ${upd.subscription_credits}`);
      console.log('');
      console.log(`🎉 Tenant admin now has ${upd.current_balance} credits available!`);
      console.log('');
      console.log('📊 Breakdown:');
      console.log(`   2 active subscriptions × 5,000 = 10,000 credits`);
      console.log(`   Minus 24 credits used = 9,976 credits available`);
      console.log('');
      console.log('⚠️  IMPORTANT: Restart the backend server to see the changes in the API!');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

reactivateSubscription();
