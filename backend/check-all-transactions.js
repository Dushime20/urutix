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

    // Get tenant admin
    const adminResult = await AppDataSource.query(`
      SELECT id, email
      FROM users 
      WHERE role = 'TENANT_ADMIN'
      LIMIT 1
    `);

    const admin = adminResult[0];
    console.log('👤 Tenant Admin:', admin.email);
    console.log('═'.repeat(70));
    console.log('');

    // Get ALL transactions for tenant admin
    const allTransactions = await AppDataSource.query(`
      SELECT 
        type,
        amount,
        balance_after,
        description,
        reference_type,
        created_at
      FROM credit_transactions
      WHERE user_id = $1
      ORDER BY created_at ASC
    `, [admin.id]);

    console.log(`📋 ALL Transactions (${allTransactions.length} total):\n`);
    
    let runningTotal = 0;
    allTransactions.forEach((tx, index) => {
      runningTotal += tx.amount;
      const sign = tx.amount > 0 ? '+' : '';
      console.log(`${index + 1}. ${tx.type}: ${sign}${tx.amount} credits`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Balance after transaction: ${tx.balance_after}`);
      console.log(`   Running total (calculated): ${runningTotal}`);
      if (tx.reference_type) {
        console.log(`   Reference: ${tx.reference_type}`);
      }
      console.log(`   Date: ${new Date(tx.created_at).toLocaleString()}`);
      console.log('');
    });

    // Calculate totals
    const totalEarned = allTransactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalSpent = allTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    console.log('═'.repeat(70));
    console.log('📊 Summary:');
    console.log(`   Total Earned: +${totalEarned} credits`);
    console.log(`   Total Spent: -${totalSpent} credits`);
    console.log(`   Expected Balance: ${totalEarned - totalSpent} credits`);
    console.log('');

    // Get current account state
    const accountResult = await AppDataSource.query(`
      SELECT current_balance, lifetime_earned, lifetime_spent
      FROM credit_accounts
      WHERE user_id = $1
    `, [admin.id]);

    console.log('💰 Actual Account State:');
    console.log(`   Current Balance: ${accountResult[0].current_balance} credits`);
    console.log(`   Lifetime Earned: ${accountResult[0].lifetime_earned} credits`);
    console.log(`   Lifetime Spent: ${accountResult[0].lifetime_spent} credits`);
    console.log(`   Calculated Balance: ${accountResult[0].lifetime_earned - accountResult[0].lifetime_spent} credits`);
    console.log('');

    // Check if there's a mismatch
    const expectedBalance = totalEarned - totalSpent;
    const actualBalance = accountResult[0].current_balance;
    
    if (expectedBalance !== actualBalance) {
      console.log('⚠️  WARNING: Balance mismatch detected!');
      console.log(`   Expected: ${expectedBalance} credits`);
      console.log(`   Actual: ${actualBalance} credits`);
      console.log(`   Difference: ${actualBalance - expectedBalance} credits`);
    } else {
      console.log('✅ Balance is correct!');
    }

    console.log('');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAllTransactions();
