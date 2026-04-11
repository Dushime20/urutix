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

async function checkSubscriptions() {
  try {
    await AppDataSource.initialize();
    
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    const subscriptions = await AppDataSource.query(`
      SELECT 
        ts.id,
        ts.status,
        ts.created_at,
        sp.name as plan_name,
        sp.included_credits
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.tenant_id = $1 AND ts.user_id = $2
      ORDER BY ts.created_at
    `, [tenantId, adminUserId]);

    console.log(`\nTenant Admin Subscriptions (${subscriptions.length} total):\n`);
    console.log('='.repeat(60));
    
    let activeCount = 0;
    let totalActiveCredits = 0;
    
    for (const sub of subscriptions) {
      console.log(`\nSubscription ID: ${sub.id}`);
      console.log(`  Plan: ${sub.plan_name}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Included Credits: ${sub.included_credits}`);
      console.log(`  Created: ${sub.created_at}`);
      
      if (sub.status === 'active') {
        activeCount++;
        totalActiveCredits += Number(sub.included_credits);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`\nSummary:`);
    console.log(`  Total Subscriptions: ${subscriptions.length}`);
    console.log(`  Active Subscriptions: ${activeCount}`);
    console.log(`  Total Credits from Active: ${totalActiveCredits}`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSubscriptions();
