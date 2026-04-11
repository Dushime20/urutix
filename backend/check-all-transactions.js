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

async function checkAllTransactions() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    // Get ALL transactions for this credit account
    const allTransactions = await AppDataSource.query(`
      SELECT 
        ct.id,
        ct.type,
        ct.amount,
        ct.balance_after,
        ct.description,
        ct.user_id,
        ct.credit_account_id,
        ct.created_at
      FROM credit_transactions ct
      JOIN credit_accounts ca ON ct.credit_account_id = ca.id
      WHERE ca.tenant_id = $1 AND ca.user_id = $2
      ORDER BY ct.created_at ASC
    `, [tenantId, adminUserId]);

    console.log(`📜 ALL Transactions for Tenant Admin's Account:`);
    console.log(`================================================\n`);
    
    let totalEarned = 0;
    let totalSpent = 0;

    for (const tx of allTransactions) {
      console.log(`${tx.created_at.toISOString()}`);
      console.log(`  ID: ${tx.id}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  Amount: ${tx.amount}`);
      console.log(`  Balance After: ${tx.balance_after}`);
      console.log(`  User ID: ${tx.user_id || 'NULL'}`);
      console.log(`  Description: ${tx.description}`);
      console.log('');

      if (tx.amount > 0) {
        totalEarned += Number(tx.amount);
      } else {
        totalSpent += Math.abs(Number(tx.amount));
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`===========`);
    console.log(`Total Transactions: ${allTransactions.length}`);
    console.log(`Total Earned: ${totalEarned}`);
    console.log(`Total Spent: ${totalSpent}`);
    console.log(`Expected Balance: ${totalEarned - totalSpent}`);
    console.log('');

    // Check credit account
    const account = await AppDataSource.query(`
      SELECT * FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (account.length) {
      const acc = account[0];
      console.log(`💰 Credit Account:`);
      console.log(`==================`);
      console.log(`Lifetime Earned (DB): ${acc.lifetime_earned}`);
      console.log(`Lifetime Spent (DB): ${acc.lifetime_spent}`);
      console.log(`Current Balance (DB): ${acc.current_balance}`);
      console.log('');
      console.log(`🔍 Discrepancy Check:`);
      console.log(`Lifetime Earned: DB=${acc.lifetime_earned}, Calculated=${totalEarned}, Diff=${acc.lifetime_earned - totalEarned}`);
      console.log(`Lifetime Spent: DB=${acc.lifetime_spent}, Calculated=${totalSpent}, Diff=${acc.lifetime_spent - totalSpent}`);
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllTransactions();
