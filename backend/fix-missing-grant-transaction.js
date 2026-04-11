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

async function fixMissingGrantTransaction() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    console.log('🔍 Analyzing subscription grant transactions...\n');

    // Get the grant transaction with amount=0
    const zeroTransaction = await AppDataSource.query(`
      SELECT *
      FROM credit_transactions ct
      JOIN credit_accounts ca ON ct.credit_account_id = ca.id
      WHERE ca.tenant_id = $1 
        AND ca.user_id = $2
        AND ct.type = 'SUBSCRIPTION_GRANT'
        AND ct.amount = 0
    `, [tenantId, adminUserId]);

    if (zeroTransaction.length) {
      console.log('❌ Found transaction with amount=0:');
      console.log(`   ID: ${zeroTransaction[0].id}`);
      console.log(`   Created: ${zeroTransaction[0].created_at}`);
      console.log(`   Balance After: ${zeroTransaction[0].balance_after}`);
      console.log('');
      console.log('🔧 Fixing: Updating amount to 5000...');
      
      await AppDataSource.query(`
        UPDATE credit_transactions
        SET amount = 5000
        WHERE id = $1
      `, [zeroTransaction[0].id]);
      
      console.log('✅ Transaction fixed!');
      console.log('');
    } else {
      console.log('✅ No transactions with amount=0 found');
      console.log('');
    }

    // Now recalculate the account balance based on transactions
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

    console.log('📊 Recalculated from transactions:');
    console.log(`   Total Earned: ${totalEarned}`);
    console.log(`   Total Spent: ${totalSpent}`);
    console.log(`   Correct Balance: ${correctBalance}`);
    console.log('');

    // Update the account
    console.log('🔧 Updating credit account...');
    await AppDataSource.query(`
      UPDATE credit_accounts
      SET 
        lifetime_earned = $1,
        lifetime_spent = $2,
        current_balance = $3
      WHERE tenant_id = $4 AND user_id = $5
    `, [totalEarned, totalSpent, correctBalance, tenantId, adminUserId]);

    console.log('✅ Credit account updated!');
    console.log('');

    // Verify
    const updated = await AppDataSource.query(`
      SELECT current_balance, lifetime_earned, lifetime_spent
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (updated.length) {
      const acc = updated[0];
      console.log('✅ Verified - Final State:');
      console.log(`   Current Balance: ${acc.current_balance}`);
      console.log(`   Lifetime Earned: ${acc.lifetime_earned}`);
      console.log(`   Lifetime Spent: ${acc.lifetime_spent}`);
      console.log('');
      console.log(`🎉 Tenant admin now has ${acc.current_balance} credits available!`);
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMissingGrantTransaction();
