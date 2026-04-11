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

async function testFreshQuery() {
  try {
    await AppDataSource.initialize();
    
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    console.log('🔍 Testing fresh database query (bypassing any cache)...\n');

    // Direct SQL query - bypasses all caching
    const result = await AppDataSource.query(`
      SELECT current_balance
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [tenantId, adminUserId]);

    if (result.length) {
      const balance = result[0].current_balance;
      console.log(`📊 Database says: ${balance} credits available`);
      console.log('');
      
      if (balance === 9976) {
        console.log('✅ Database has CORRECT value (9,976)');
        console.log('');
        console.log('If your API is returning 4,976, it means:');
        console.log('  1. The backend server is using cached data');
        console.log('  2. You MUST restart the backend server');
        console.log('  3. Press Ctrl+C in the backend terminal');
        console.log('  4. Run: npm run dev (or yarn dev)');
        console.log('  5. Refresh the frontend page');
      } else if (balance === 4976) {
        console.log('❌ Database still has OLD value (4,976)');
        console.log('   The fix script did not work properly');
        console.log('   Run: node fix-marketplace-balance.js');
      } else {
        console.log(`⚠️  Unexpected value: ${balance}`);
      }
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testFreshQuery();
