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

async function fixTenantAdminBalance() {
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
    console.log('');

    // Get current account state
    const accountResult = await AppDataSource.query(`
      SELECT id, current_balance, lifetime_earned, lifetime_spent
      FROM credit_accounts
      WHERE user_id = $1
    `, [admin.id]);

    if (accountResult.length === 0) {
      console.log('❌ No credit account found');
      await AppDataSource.destroy();
      return;
    }

    const account = accountResult[0];
    console.log('💰 Current Account State:');
    console.log(`   Current Balance: ${account.current_balance} credits`);
    console.log(`   Lifetime Earned: ${account.lifetime_earned} credits`);
    console.log(`   Lifetime Spent: ${account.lifetime_spent} credits`);
    console.log('');

    // Calculate correct values from transactions
    const transactions = await AppDataSource.query(`
      SELECT amount
      FROM credit_transactions
      WHERE user_id = $1
      ORDER BY created_at ASC
    `, [admin.id]);

    const totalEarned = transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalSpent = transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const correctBalance = account.lifetime_earned - totalSpent;

    console.log('📊 Calculated from Transactions:');
    console.log(`   Total Earned (from transactions): ${totalEarned} credits`);
    console.log(`   Total Spent (from transactions): ${totalSpent} credits`);
    console.log(`   Correct Balance: ${correctBalance} credits`);
    console.log('');

    // Check if correction is needed
    if (account.current_balance === correctBalance && account.lifetime_spent === totalSpent) {
      console.log('✅ Balance is already correct! No fix needed.');
      await AppDataSource.destroy();
      return;
    }

    console.log('⚠️  Balance correction needed:');
    console.log(`   Current Balance: ${account.current_balance} → ${correctBalance} (${correctBalance - account.current_balance > 0 ? '+' : ''}${correctBalance - account.current_balance})`);
    console.log(`   Lifetime Spent: ${account.lifetime_spent} → ${totalSpent} (${totalSpent - account.lifetime_spent > 0 ? '+' : ''}${totalSpent - account.lifetime_spent})`);
    console.log('');

    // Apply fix
    console.log('🔧 Applying fix...');
    await AppDataSource.query(`
      UPDATE credit_accounts
      SET 
        current_balance = $1,
        lifetime_spent = $2
      WHERE id = $3
    `, [correctBalance, totalSpent, account.id]);

    console.log('✅ Balance corrected successfully!');
    console.log('');

    // Verify fix
    const verifyResult = await AppDataSource.query(`
      SELECT current_balance, lifetime_earned, lifetime_spent
      FROM credit_accounts
      WHERE id = $1
    `, [account.id]);

    console.log('✅ Verified Account State:');
    console.log(`   Current Balance: ${verifyResult[0].current_balance} credits`);
    console.log(`   Lifetime Earned: ${verifyResult[0].lifetime_earned} credits`);
    console.log(`   Lifetime Spent: ${verifyResult[0].lifetime_spent} credits`);
    console.log(`   Calculated: ${verifyResult[0].lifetime_earned - verifyResult[0].lifetime_spent} credits`);
    console.log('');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixTenantAdminBalance();
