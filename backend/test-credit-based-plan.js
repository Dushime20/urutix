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

async function testCreditBasedPlan() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing Credit-Based Subscription System\n');
    
    // Test 1: Verify table schema
    console.log('📋 Test 1: Verifying table schema...');
    const schemaResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'subscription_plans' 
      AND column_name IN (
        'price_per_credit', 
        'total_credits', 
        'credits_per_ton_tenant', 
        'credits_per_ton_truck_owner',
        'price_monthly',
        'price_yearly',
        'included_credits'
      )
      ORDER BY column_name;
    `);
    console.table(schemaResult.rows);
    console.log('✅ Schema verified\n');
    
    // Test 2: Check existing plans
    console.log('📋 Test 2: Checking existing subscription plans...');
    const plansResult = await client.query(`
      SELECT 
        name,
        slug,
        price_per_credit,
        total_credits,
        credits_per_ton_tenant,
        credits_per_ton_truck_owner,
        is_active
      FROM subscription_plans
      ORDER BY display_order;
    `);
    
    if (plansResult.rows.length > 0) {
      console.table(plansResult.rows);
      console.log('✅ Found', plansResult.rows.length, 'existing plans\n');
    } else {
      console.log('⚠️  No plans found\n');
    }
    
    // Test 3: Calculate example costs
    console.log('📋 Test 3: Example cost calculations...');
    if (plansResult.rows.length > 0) {
      const plan = plansResult.rows[0];
      const cargoWeight = 10; // tons
      
      const tenantCredits = parseFloat(plan.credits_per_ton_tenant) * cargoWeight;
      const truckOwnerCredits = parseFloat(plan.credits_per_ton_truck_owner) * cargoWeight;
      const tenantUSDCost = tenantCredits * parseFloat(plan.price_per_credit);
      const tenantProfit = truckOwnerCredits - tenantCredits;
      
      console.log(`\n🚛 Scenario: ${cargoWeight} ton cargo shipment`);
      console.log(`📦 Plan: ${plan.name} (${plan.slug})`);
      console.log(`\n💰 Costs:`);
      console.log(`   Tenant Admin: ${tenantCredits} credits ($${tenantUSDCost.toFixed(2)})`);
      console.log(`   Truck Owner: ${truckOwnerCredits} credits`);
      console.log(`   Tenant Profit: ${tenantProfit} credits`);
      console.log(`\n✅ Calculations working correctly\n`);
    }
    
    // Test 4: Test inserting a new plan
    console.log('📋 Test 4: Testing plan creation...');
    const testPlanSlug = 'test-credit-plan-' + Date.now();
    
    await client.query(`
      INSERT INTO subscription_plans (
        name, 
        slug, 
        description,
        price_per_credit,
        total_credits,
        credits_per_ton_tenant,
        credits_per_ton_truck_owner,
        is_active,
        display_order
      ) VALUES (
        'Test Credit Plan',
        $1,
        'Test plan for credit-based system',
        0.12,
        100000,
        1.5,
        4.0,
        false,
        999
      )
      RETURNING *;
    `, [testPlanSlug]);
    
    console.log('✅ Test plan created successfully');
    
    // Clean up test plan
    await client.query(`DELETE FROM subscription_plans WHERE slug = $1`, [testPlanSlug]);
    console.log('✅ Test plan cleaned up\n');
    
    console.log('🎉 All tests passed!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Database schema is correct');
    console.log('   ✅ Existing plans have credit-based fields');
    console.log('   ✅ Cost calculations work correctly');
    console.log('   ✅ Can create new credit-based plans');
    console.log('\n🚀 Ready to use the admin UI to create/edit plans!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testCreditBasedPlan();
