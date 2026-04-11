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

async function testCreditBalanceStats() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Get tenant admin
    const adminResult = await AppDataSource.query(`
      SELECT id, email, "tenantId"
      FROM users 
      WHERE role = 'TENANT_ADMIN'
      LIMIT 1
    `);

    const admin = adminResult[0];
    console.log('👤 Tenant Admin:', admin.email);
    console.log('═'.repeat(70));
    console.log('');

    // Get all transactions
    const transactions = await AppDataSource.query(`
      SELECT type, amount, description, reference_type
      FROM credit_transactions
      WHERE user_id = $1
      ORDER BY created_at ASC
    `, [admin.id]);

    console.log('📋 Transaction Breakdown:\n');

    // Marketplace sales
    const marketplaceSales = transactions
      .filter(tx => tx.type === 'CONSUMPTION' && tx.reference_type === 'MARKETPLACE_SALE')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    console.log('💰 Marketplace Sales Revenue:');
    console.log(`   Credits sold to truck owners: ${marketplaceSales} credits`);
    console.log('');

    // Bid revenues
    const bidRevenues = transactions.filter(tx => 
      tx.type === 'BONUS' && tx.description?.includes('Bid revenue')
    );
    const totalBidRevenue = bidRevenues.reduce((sum, tx) => sum + tx.amount, 0);
    
    console.log('💵 Bid Transaction Revenue:');
    if (bidRevenues.length > 0) {
      bidRevenues.forEach((tx, index) => {
        console.log(`   ${index + 1}. +${tx.amount} credits - ${tx.description}`);
      });
      console.log(`   Total: ${totalBidRevenue} credits`);
    } else {
      console.log('   No bid revenues yet');
    }
    console.log('');

    // Operational costs
    const operationalCosts = transactions.filter(tx => 
      tx.type === 'CONSUMPTION' && tx.description?.includes('operational cost')
    );
    const totalOperationalCosts = operationalCosts.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    console.log('💸 Operational Costs:');
    if (operationalCosts.length > 0) {
      operationalCosts.forEach((tx, index) => {
        console.log(`   ${index + 1}. -${Math.abs(tx.amount)} credits - ${tx.description}`);
      });
      console.log(`   Total: ${totalOperationalCosts} credits`);
    } else {
      console.log('   No operational costs yet');
    }
    console.log('');

    // Calculate totals
    const totalRevenue = marketplaceSales + totalBidRevenue;
    const totalProfit = totalRevenue - totalOperationalCosts;

    console.log('═'.repeat(70));
    console.log('📊 Summary Statistics:\n');
    console.log(`   Revenue from Marketplace Sales: ${marketplaceSales} credits`);
    console.log(`   Revenue from Bid Transactions: ${totalBidRevenue} credits`);
    console.log(`   Total Revenue: ${totalRevenue} credits`);
    console.log(`   Operational Costs: ${totalOperationalCosts} credits`);
    console.log(`   Net Profit: ${totalProfit} credits`);
    console.log('═'.repeat(70));
    console.log('');

    // Get current balance
    const accountResult = await AppDataSource.query(`
      SELECT current_balance, lifetime_earned, lifetime_spent
      FROM credit_accounts
      WHERE user_id = $1
    `, [admin.id]);

    console.log('💰 Current Account:');
    console.log(`   Current Balance: ${accountResult[0].current_balance} credits`);
    console.log(`   Lifetime Earned: ${accountResult[0].lifetime_earned} credits`);
    console.log(`   Lifetime Spent: ${accountResult[0].lifetime_spent} credits`);
    console.log('');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testCreditBalanceStats();
