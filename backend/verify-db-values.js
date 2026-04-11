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

async function verifyDbValues() {
  try {
    await AppDataSource.initialize();
    
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    const result = await AppDataSource.query(`
      SELECT 
        current_balance,
        lifetime_earned,
        lifetime_spent,
        subscription_credits
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (result.length) {
      const acc = result[0];
      console.log('📊 Current Database Values:');
      console.log('============================');
      console.log(`Current Balance: ${acc.current_balance}`);
      console.log(`Lifetime Earned: ${acc.lifetime_earned}`);
      console.log(`Lifetime Spent: ${acc.lifetime_spent}`);
      console.log(`Subscription Credits: ${acc.subscription_credits}`);
      console.log('');
      
      if (acc.current_balance === 9976 && acc.lifetime_spent === 24) {
        console.log('✅ Database has CORRECT values!');
        console.log('');
        console.log('⚠️  If API is still returning old values (4976), you need to:');
        console.log('   1. Restart the backend server');
        console.log('   2. Clear any API caches');
        console.log('   3. Refresh the frontend page');
      } else {
        console.log('❌ Database still has WRONG values!');
        console.log(`   Expected: balance=9976, spent=24`);
        console.log(`   Got: balance=${acc.current_balance}, spent=${acc.lifetime_spent}`);
      }
    } else {
      console.log('❌ Account not found');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyDbValues();
