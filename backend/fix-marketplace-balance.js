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

async function fixMarketplaceBalance() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    console.log('🔍 Analyzing the issue...\n');
    console.log('The tenant admin has:');
    console.log('  - 2 subscriptions of 5,000 credits each = 10,000 total');
    console.log('  - Used 24 credits in actual operations (2 bid acceptances)');
    console.log('  - Should have: 10,000 - 24 = 9,976 credits available');
    console.log('  - Currently shows: 4,976 credits (missing 5,000!)');
    console.log('');
    console.log('The problem: lifetime_spent shows 5,024 instead of 24');
    console.log('The extra 5,000 was incorrectly deducted (likely from old partner plan allocation)');
    console.log('');

    // Get current account state
    const account = await AppDataSource.query(`
      SELECT * FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (!account.length) {
      console.log('❌ Account not found');
      return;
    }

    const acc = account[0];
    console.log('📊 Current State:');
    console.log(`   Lifetime Earned: ${acc.lifetime_earned}`);
    console.log(`   Lifetime Spent: ${acc.lifetime_spent}`);
    console.log(`   Current Balance: ${acc.current_balance}`);
    console.log(`   Subscription Credits: ${acc.subscription_credits}`);
    console.log('');

    // Calculate correct values from transactions
    const transactions = await AppDataSource.query(`
      SELECT type, amount
      FROM credit_transactions ct
      JOIN credit_accounts ca ON ct.credit_account_id = ca.id
      WHERE ca.tenant_id = $1 AND ca.user_id = $2
    `, [tenantId, adminUserId]);

    let correctEarned = 0;
    let correctSpent = 0;

    for (const tx of transactions) {
      if (tx.amount > 0) {
        correctEarned += Number(tx.amount);
      } else if (tx.amount < 0) {
        correctSpent += Math.abs(Number(tx.amount));
      }
    }

    const correctBalance = correctEarned - correctSpent;

    console.log('✅ Correct Values (from transactions):');
    console.log(`   Lifetime Earned: ${correctEarned}`);
    console.log(`   Lifetime Spent: ${correctSpent}`);
    console.log(`   Current Balance: ${correctBalance}`);
    console.log('');

    // There's a missing 5000 grant transaction, but we know from the UI that
    // the tenant admin has 2 subscriptions of 5000 credits each
    const totalSubscriptionCredits = 10000; // 2 × 5000

    console.log(`📋 Subscriptions:`);
    console.log(`   Total Subscription Credits: ${totalSubscriptionCredits} (2 subscriptions × 5000)`);
    console.log('');

    // The correct lifetime_earned should be totalSubscriptionCredits
    const finalCorrectEarned = totalSubscriptionCredits;
    const finalCorrectSpent = correctSpent; // 24
    const finalCorrectBalance = finalCorrectEarned - finalCorrectSpent;

    console.log('🎯 Final Correct Values:');
    console.log(`   Lifetime Earned: ${finalCorrectEarned} (from 2 subscriptions)`);
    console.log(`   Lifetime Spent: ${finalCorrectSpent} (actual consumption only)`);
    console.log(`   Current Balance: ${finalCorrectBalance}`);
    console.log(`   Subscription Credits: ${totalSubscriptionCredits}`);
    console.log('');

    console.log('🔧 Applying fix...');
    
    await AppDataSource.query(`
      UPDATE credit_accounts
      SET 
        lifetime_earned = $1,
        lifetime_spent = $2,
        current_balance = $3,
        subscription_credits = $4
      WHERE tenant_id = $5 AND user_id = $6
    `, [
      finalCorrectEarned,
      finalCorrectSpent,
      finalCorrectBalance,
      totalSubscriptionCredits,
      tenantId,
      adminUserId
    ]);

    console.log('✅ Fix applied successfully!');
    console.log('');

    // Verify
    const updated = await AppDataSource.query(`
      SELECT * FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    const upd = updated[0];
    console.log('✅ Verified - New State:');
    console.log(`   Lifetime Earned: ${upd.lifetime_earned}`);
    console.log(`   Lifetime Spent: ${upd.lifetime_spent}`);
    console.log(`   Current Balance: ${upd.current_balance}`);
    console.log(`   Subscription Credits: ${upd.subscription_credits}`);
    console.log('');
    console.log(`🎉 Tenant admin now has ${upd.current_balance} credits available for marketplace!`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMarketplaceBalance();
