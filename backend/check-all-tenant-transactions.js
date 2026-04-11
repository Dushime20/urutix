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

async function checkAllTenantTransactions() {
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
    const tenantId = admin.tenantId;
    
    console.log('👤 Tenant Admin:', admin.email);
    console.log('🏢 Tenant ID:', tenantId);
    console.log('═'.repeat(70));
    console.log('');

    // Get ALL transactions for this tenant (including those without user_id)
    const allTransactions = await AppDataSource.query(`
      SELECT 
        type,
        amount,
        balance_after,
        description,
        reference_type,
        user_id,
        created_at
      FROM credit_transactions
      WHERE tenant_id = $1
      ORDER BY created_at ASC
    `, [tenantId]);

    console.log(`📋 ALL Tenant Transactions (${allTransactions.length} total):\n`);
    
    allTransactions.forEach((tx, index) => {
      const sign = tx.amount > 0 ? '+' : '';
      const userLabel = tx.user_id ? (tx.user_id === admin.id ? '(Tenant Admin)' : '(Other User)') : '(No User ID)';
      console.log(`${index + 1}. ${tx.type}: ${sign}${tx.amount} credits ${userLabel}`);
      console.log(`   Description: ${tx.description}`);
      console.log(`   Balance after: ${tx.balance_after}`);
      if (tx.reference_type) {
        console.log(`   Reference: ${tx.reference_type}`);
      }
      if (tx.user_id) {
        console.log(`   User ID: ${tx.user_id.substring(0, 8)}...`);
      } else {
        console.log(`   User ID: NULL`);
      }
      console.log(`   Date: ${new Date(tx.created_at).toLocaleString()}`);
      console.log('');
    });

    console.log('═'.repeat(70));
    console.log('');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkAllTenantTransactions();
