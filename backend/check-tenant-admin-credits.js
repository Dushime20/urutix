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

async function checkTenantAdminCredits() {
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

    if (adminResult.length === 0) {
      console.log('❌ No tenant admin found');
      await AppDataSource.destroy();
      return;
    }

    const admin = adminResult[0];
    console.log('👤 Tenant Admin:', admin.email);
    console.log('   User ID:', admin.id);
    console.log('');

    // Get credit account
    const accountResult = await AppDataSource.query(`
      SELECT 
        current_balance,
        lifetime_earned,
        lifetime_spent,
        subscription_credits,
        purchased_credits,
        bonus_credits
      FROM credit_accounts
      WHERE user_id = $1
    `, [admin.id]);

    if (accountResult.length === 0) {
      console.log('❌ No credit account found for tenant admin');
    } else {
      console.log('💰 Credit Account:');
      console.log('   Current Balance:', accountResult[0].current_balance);
      console.log('   Lifetime Earned:', accountResult[0].lifetime_earned);
      console.log('   Lifetime Spent:', accountResult[0].lifetime_spent);
      console.log('   Subscription Credits:', accountResult[0].subscription_credits);
      console.log('   Purchased Credits:', accountResult[0].purchased_credits);
      console.log('   Bonus Credits:', accountResult[0].bonus_credits);
      console.log('');
    }

    // Get recent transactions
    const transactionsResult = await AppDataSource.query(`
      SELECT 
        type,
        amount,
        balance_after,
        description,
        reference_type,
        created_at
      FROM credit_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [admin.id]);

    console.log('📋 Recent Transactions (last 10):');
    if (transactionsResult.length === 0) {
      console.log('   No transactions found');
    } else {
      transactionsResult.forEach((tx, index) => {
        const sign = tx.amount > 0 ? '+' : '';
        console.log(`   ${index + 1}. ${tx.type}: ${sign}${tx.amount} credits`);
        console.log(`      Balance after: ${tx.balance_after}`);
        console.log(`      Description: ${tx.description}`);
        if (tx.reference_type) {
          console.log(`      Reference: ${tx.reference_type}`);
        }
        console.log(`      Date: ${new Date(tx.created_at).toLocaleString()}`);
        console.log('');
      });
    }

    // Also check truck owner
    const truckOwnerResult = await AppDataSource.query(`
      SELECT id, email
      FROM users 
      WHERE role = 'TRUCK_OWNER'
      LIMIT 1
    `);

    if (truckOwnerResult.length > 0) {
      const truckOwner = truckOwnerResult[0];
      console.log('🚛 Truck Owner:', truckOwner.email);

      const toAccountResult = await AppDataSource.query(`
        SELECT current_balance, lifetime_earned, lifetime_spent
        FROM credit_accounts
        WHERE user_id = $1
      `, [truckOwner.id]);

      if (toAccountResult.length > 0) {
        console.log('   Current Balance:', toAccountResult[0].current_balance);
        console.log('   Lifetime Earned:', toAccountResult[0].lifetime_earned);
        console.log('   Lifetime Spent:', toAccountResult[0].lifetime_spent);
      }
    }

    console.log('');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkTenantAdminCredits();
