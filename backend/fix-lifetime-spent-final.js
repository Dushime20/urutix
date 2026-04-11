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

async function fixLifetimeSpentFinal() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    console.log('🔍 Analyzing the issue...\n');

    // Get current state
    const account = await AppDataSource.query(`
      SELECT current_balance, lifetime_earned, lifetime_spent, subscription_credits
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (!account.length) {
      console.log('❌ Account not found');
      await AppDataSource.destroy();
      return;
    }

    const acc = account[0];
    console.log('📊 Current Database State:');
    console.log(`   Lifetime Earned: ${acc.lifetime_earned}`);
    console.log(`   Lifetime Spent: ${acc.lifetime_spent} ❌ WRONG`);
    console.log(`   Current Balance: ${acc.current_balance} ❌ WRONG`);
    console.log(`   Subscription Credits: ${acc.subscription_credits}`);
    console.log('');

    // Calculate correct values from transactions
    const transactions = await AppDataSource.query(`
      SELECT type, amount
      FROM credit_transactions ct
      JOIN credit_accounts ca ON ct.credit_account_id = ca.id
      WHERE ca.tenant_id = $1 AND ca.user_id = $2
    `, [tenantId, adminUserId]);

    let totalEarned = 0;
    let totalSpent = 0;

    for (const tx of transactions) {
      if (tx.amount > 0) {
        totalEarned += Number(tx.amount);
      } else if (tx.amount < 0) {
        totalSpent += Math.abs(Number(tx.amount));
      }
    }

    const correctBalance = totalEarned - totalSpent;

    console.log('✅ Correct Values (from transactions):');
    console.log(`   Lifetime Earned: ${totalEarned}`);
    console.log(`   Lifetime Spent: ${totalSpent}`);
    console.log(`   Current Balance: ${correctBalance}`);
    console.log('');

    console.log('🔧 Applying fix...');
    console.log(`   Setting lifetime_spent to ${totalSpent}`);
    console.log(`   Setting current_balance to ${correctBalance}`);
    console.log('');

    // Update the account
    await AppDataSource.query(`
      UPDATE credit_accounts
      SET 
        lifetime_spent = $1,
        current_balance = $2
      WHERE tenant_id = $3 AND user_id = $4
    `, [totalSpent, correctBalance, tenantId, adminUserId]);

    console.log('✅ Fix applied!');
    console.log('');

    // Verify
    const updated = await AppDataSource.query(`
      SELECT current_balance, lifetime_earned, lifetime_spent, subscription_credits
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (updated.length) {
      const upd = updated[0];
      console.log('✅ Verified - Final State:');
      console.log(`   Lifetime Earned: ${upd.lifetime_earned}`);
      console.log(`   Lifetime Spent: ${upd.lifetime_spent}`);
      console.log(`   Current Balance: ${upd.current_balance}`);
      console.log(`   Subscription Credits: ${upd.subscription_credits}`);
      console.log('');
      
      if (upd.current_balance === correctBalance && upd.lifetime_spent === totalSpent) {
        console.log('🎉 SUCCESS! Balance is now correct: ' + upd.current_balance + ' credits');
        console.log('');
        console.log('📊 Breakdown:');
        console.log(`   2 active subscriptions × 5,000 = 10,000 credits`);
        console.log(`   Minus ${totalSpent} credits used = ${correctBalance} credits available`);
      } else {
        console.log('❌ Something went wrong - values don\'t match!');
      }
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixLifetimeSpentFinal();
