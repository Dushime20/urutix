const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'urutix',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSubscriptions() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking existing subscriptions...\n');
    
    // Check all subscriptions
    const result = await client.query(`
      SELECT 
        ts.id,
        ts.tenant_id,
        ts.user_id,
        ts.plan_id,
        ts.status,
        ts.billing_cycle,
        ts.current_period_start,
        ts.current_period_end,
        ts.created_at,
        sp.name as plan_name,
        sp.slug as plan_slug
      FROM tenant_subscriptions ts
      LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
      ORDER BY ts.created_at DESC;
    `);
    
    if (result.rows.length > 0) {
      console.log(`📋 Found ${result.rows.length} subscription(s):\n`);
      console.table(result.rows);
      
      // Check for active subscriptions
      const activeResult = await client.query(`
        SELECT 
          ts.id,
          ts.tenant_id,
          ts.user_id,
          ts.status,
          sp.name as plan_name
        FROM tenant_subscriptions ts
        LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
        WHERE ts.status = 'active';
      `);
      
      if (activeResult.rows.length > 0) {
        console.log(`\n⚠️  Found ${activeResult.rows.length} ACTIVE subscription(s):`);
        console.table(activeResult.rows);
        
        console.log('\n💡 Options:');
        console.log('   1. Delete the existing subscription to allow a new purchase');
        console.log('   2. Change the subscription status to allow upgrades');
        console.log('   3. Modify the code to allow multiple subscriptions');
        
        console.log('\n🗑️  To delete all subscriptions, run:');
        console.log('   DELETE FROM tenant_subscriptions;');
      }
    } else {
      console.log('✅ No subscriptions found. User can purchase a new subscription.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSubscriptions();
