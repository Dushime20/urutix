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

async function monitorChanges() {
  try {
    await AppDataSource.initialize();
    
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    console.log('🔍 Monitoring credit account changes...\n');
    console.log('Press Ctrl+C to stop\n');

    let lastBalance = null;
    let lastSpent = null;

    setInterval(async () => {
      try {
        const result = await AppDataSource.query(`
          SELECT current_balance, lifetime_spent, updated_at
          FROM credit_accounts
          WHERE tenant_id = $1 AND user_id = $2
        `, [tenantId, adminUserId]);

        if (result.length) {
          const acc = result[0];
          const balance = Number(acc.current_balance);
          const spent = Number(acc.lifetime_spent);
          const updated = acc.updated_at;

          if (lastBalance !== null && (balance !== lastBalance || spent !== lastSpent)) {
            console.log(`⚠️  CHANGE DETECTED at ${new Date().toISOString()}`);
            console.log(`   Balance: ${lastBalance} → ${balance} (${balance - lastBalance > 0 ? '+' : ''}${balance - lastBalance})`);
            console.log(`   Spent: ${lastSpent} → ${spent} (${spent - lastSpent > 0 ? '+' : ''}${spent - lastSpent})`);
            console.log(`   Updated At: ${updated}`);
            console.log('');
          }

          lastBalance = balance;
          lastSpent = spent;
        }
      } catch (error) {
        console.error('Error checking:', error.message);
      }
    }, 1000); // Check every second

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

monitorChanges();
