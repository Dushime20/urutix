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

async function checkAllGrantTransactions() {
  try {
    await AppDataSource.initialize();
    
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464';
    const adminUserId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';

    console.log('🔍 Checking ALL SUBSCRIPTION_GRANT transactions...\n');

    // Get ALL grant transactions for this account
    const grants = await AppDataSource.query(`
      SELECT 
        ct.id,
        ct.amount,
        ct.balance_after,
        ct.description,
        ct.created_at,
        ct.subscription_id
      FROM credit_transactions ct
      JOIN credit_accounts ca ON ct.credit_account_id = ca.id
      WHERE ca.tenant_id = $1 
        AND ca.user_id = $2
        AND ct.type = 'SUBSCRIPTION_GRANT'
      ORDER BY ct.created_at ASC
    `, [tenantId, adminUserId]);

    console.log(`Found ${grants.length} SUBSCRIPTION_GRANT transactions:\n`);
    
    for (const grant of grants) {
      console.log(`Transaction ID: ${grant.id}`);
      console.log(`  Amount: ${grant.amount}`);
      console.log(`  Balance After: ${grant.balance_after}`);
      console.log(`  Subscription ID: ${grant.subscription_id}`);
      console.log(`  Created: ${grant.created_at}`);
      console.log(`  Description: ${grant.description}`);
      console.log('');
    }

    // Check how many subscriptions the tenant admin has
    const subscriptions = await AppDataSource.query(`
      SELECT id, plan_id, status, created_at
      FROM tenant_subscriptions
      WHERE tenant_id = $1 AND user_id = $2
      ORDER BY created_at ASC
    `, [tenantId, adminUserId]);

    console.log(`\nTenant admin has ${subscriptions.length} subscriptions:\n`);
    
    for (const sub of subscriptions) {
      console.log(`Subscription ID: ${sub.id}`);
      console.log(`  Plan ID: ${sub.plan_id}`);
      console.log(`  Status: ${sub.status}`);
      console.log(`  Created: ${sub.created_at}`);
      
      // Check if there's a grant transaction for this subscription
      const hasGrant = grants.find(g => g.subscription_id === sub.id);
      console.log(`  Has Grant Transaction: ${hasGrant ? 'YES' : 'NO'}`);
      if (hasGrant) {
        console.log(`    Grant Amount: ${hasGrant.amount}`);
      }
      console.log('');
    }

    // Get the plan details
    const plans = await AppDataSource.query(`
      SELECT sp.id, sp.name, sp.included_credits
      FROM subscription_plans sp
      JOIN tenant_subscriptions ts ON ts.plan_id = sp.id
      WHERE ts.tenant_id = $1 AND ts.user_id = $2
    `, [tenantId, adminUserId]);

    console.log(`\nPlan details:\n`);
    for (const plan of plans) {
      console.log(`Plan: ${plan.name}`);
      console.log(`  Included Credits: ${plan.included_credits}`);
      console.log('');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllGrantTransactions();
