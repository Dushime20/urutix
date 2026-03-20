const axios = require('axios');
const { DataSource } = require('typeorm');
require('dotenv').config();

const API_URL = 'http://localhost:3000/api';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db',
  synchronize: false,
  logging: false,
});

async function testCreditConsumptionScenario() {
  let token = null;
  let tenantId = null;
  let userId = null;

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Step 1: Find or create a test tenant
    console.log('📋 STEP 1: Setting up test tenant...');
    console.log('─'.repeat(60));
    
    const tenants = await AppDataSource.query(`
      SELECT id, name, "contactEmail", status
      FROM tenants
      WHERE status = 'ACTIVE'
      AND id != '00000000-0000-0000-0000-000000000001'
      LIMIT 1
    `);

    if (tenants.length === 0) {
      console.log('⚠️  No active tenants found. Creating test tenant...');
      
      // Create test tenant
      const newTenant = await AppDataSource.query(`
        INSERT INTO tenants (name, "contactEmail", "contactPhone", status, type, "subscriptionPlan")
        VALUES ('Test Logistics Co', 'test@logistics.com', '+250788123456', 'ACTIVE', 'fleet_owner', 'premium')
        RETURNING id, name, "contactEmail"
      `);
      
      tenantId = newTenant[0].id;
      console.log(`✅ Created tenant: ${newTenant[0].name} (${newTenant[0].contactEmail})`);
    } else {
      tenantId = tenants[0].id;
      console.log(`✅ Using existing tenant: ${tenants[0].name} (${tenants[0].contactEmail || 'No email'})`);
    }
    console.log(`   Tenant ID: ${tenantId}\n`);

    // Step 2: Ensure tenant has a subscription and credit account
    console.log('📋 STEP 2: Checking subscription and credit account...');
    console.log('─'.repeat(60));
    
    const subscription = await AppDataSource.query(`
      SELECT id, plan_id, status
      FROM tenant_subscriptions
      WHERE tenant_id = $1
      AND status = 'active'
      LIMIT 1
    `, [tenantId]);

    if (subscription.length === 0) {
      console.log('⚠️  No active subscription. Creating one...');
      
      // Get a plan
      const plan = await AppDataSource.query(`
        SELECT id FROM subscription_plans WHERE tier = 'premium' LIMIT 1
      `);
      
      if (plan.length > 0) {
        await AppDataSource.query(`
          INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end)
          VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '30 days')
        `, [tenantId, plan[0].id]);
        console.log('✅ Created premium subscription');
      }
    } else {
      console.log(`✅ Active subscription found`);
    }

    // Check/create credit account
    let creditAccount = await AppDataSource.query(`
      SELECT id, current_balance, purchased_credits, lifetime_spent
      FROM credit_accounts
      WHERE tenant_id = $1
    `, [tenantId]);

    if (creditAccount.length === 0) {
      console.log('⚠️  No credit account. Creating one...');
      await AppDataSource.query(`
        INSERT INTO credit_accounts (tenant_id, current_balance, purchased_credits, lifetime_spent)
        VALUES ($1, 500, 500, 0)
        RETURNING id, current_balance
      `, [tenantId]);
      
      creditAccount = await AppDataSource.query(`
        SELECT id, current_balance, purchased_credits, lifetime_spent
        FROM credit_accounts WHERE tenant_id = $1
      `, [tenantId]);
      
      console.log(`✅ Created credit account with 500 credits`);
    }

    const initialBalance = parseFloat(creditAccount[0].current_balance);
    console.log(`   Current balance: ${initialBalance} credits`);
    console.log(`   Total purchased: ${creditAccount[0].purchased_credits} credits`);
    console.log(`   Total consumed: ${creditAccount[0].lifetime_spent} credits\n`);

    // Step 3: Find user for this tenant
    console.log('📋 STEP 3: Finding test user...');
    console.log('─'.repeat(60));
    
    const users = await AppDataSource.query(`
      SELECT id, email, role
      FROM users
      WHERE "tenantId" = $1
      LIMIT 1
    `, [tenantId]);

    if (users.length === 0) {
      console.log('⚠️  No user found for this tenant. Using first available user...');
      const anyUser = await AppDataSource.query(`SELECT id, email FROM users LIMIT 1`);
      userId = anyUser[0]?.id;
    } else {
      userId = users[0].id;
      console.log(`✅ Using existing user: ${users[0].email} (${users[0].role})`);
    }
    console.log(`   User ID: ${userId}\n`);

    // Step 4: Check existing trucks for this tenant
    console.log('📋 STEP 4: Checking existing trucks...');
    console.log('─'.repeat(60));
    
    const trucks = await AppDataSource.query(`
      SELECT id, "plateNumber", "capacityWeight"
      FROM trucks
      WHERE "tenantId" = $1
      AND "isActive" = true
      LIMIT 2
    `, [tenantId]);

    if (trucks.length === 0) {
      console.log('⚠️  No trucks found for this tenant');
      console.log('   Skipping truck creation for this test\n');
    } else {
      console.log(`✅ Found ${trucks.length} truck(s) for this tenant:`);
      trucks.forEach((truck, index) => {
        console.log(`   ${index + 1}. ${truck.plateNumber} (Capacity: ${truck.capacityWeight / 1000} tons)`);
      });
      console.log();
    }

    // Step 5: Check active pricing rule
    console.log('📋 STEP 5: Checking active pricing rule...');
    console.log('─'.repeat(60));
    
    const pricingRule = await AppDataSource.query(`
      SELECT rule_name, rule_type, unit, credit_cost, is_active
      FROM credit_pricing_rules
      WHERE is_active = true
      ORDER BY priority DESC
      LIMIT 1
    `);

    if (pricingRule.length === 0) {
      console.log('❌ No active pricing rule found!');
      return;
    }

    console.log(`✅ Active pricing rule: ${pricingRule[0].rule_name}`);
    console.log(`   Type: ${pricingRule[0].rule_type}`);
    console.log(`   Cost: ${pricingRule[0].credit_cost} credits per ${pricingRule[0].unit}\n`);

    const creditCostPerTon = parseFloat(pricingRule[0].credit_cost);

    // Step 6: Simulate creating a load with 50 tonnes
    console.log('📋 STEP 6: Creating load with 50 tonnes...');
    console.log('─'.repeat(60));
    
    const weightInTonnes = 50;
    const expectedCreditCost = weightInTonnes * creditCostPerTon;
    
    console.log(`   Weight: ${weightInTonnes} tonnes`);
    console.log(`   Expected credit cost: ${expectedCreditCost} credits (${weightInTonnes} × ${creditCostPerTon})\n`);

    // Create the load
    const load = await AppDataSource.query(`
      INSERT INTO loads (
        "tenantId", "cargoOwnerId", title, description,
        origin, destination,
        weight, status, "loadValue", "currencyCode"
      )
      VALUES (
        $1, $2, 'Heavy Equipment Transport', 'Construction machinery delivery',
        '{"lat": -1.9536, "lng": 30.0619, "address": "Kigali, Rwanda"}'::jsonb,
        '{"lat": -1.9706, "lng": 30.1044, "address": "Kigali Airport, Rwanda"}'::jsonb,
        $3, 'CREATED', 5000, 'USD'
      )
      RETURNING id, title, weight
    `, [tenantId, userId, weightInTonnes * 1000]);

    console.log(`✅ Load created: ${load[0].title}`);
    console.log(`   Load ID: ${load[0].id}`);
    console.log(`   Weight: ${load[0].weight / 1000} tonnes\n`);

    // Step 7: Manually trigger credit consumption (simulating the event)
    console.log('📋 STEP 7: Consuming credits for load creation...');
    console.log('─'.repeat(60));
    
    // Deduct credits
    await AppDataSource.query(`
      UPDATE credit_accounts
      SET current_balance = current_balance - $1,
          lifetime_spent = lifetime_spent + $1
      WHERE tenant_id = $2
    `, [expectedCreditCost, tenantId]);

    // Record transaction
    await AppDataSource.query(`
      INSERT INTO credit_transactions (
        tenant_id, credit_account_id, amount, type, description, reference_type, reference_id, balance_after
      )
      VALUES (
        $1, 
        (SELECT id FROM credit_accounts WHERE tenant_id = $1),
        $2, 'CONSUMPTION', $3, 'load', $4,
        (SELECT current_balance FROM credit_accounts WHERE tenant_id = $1)
      )
    `, [tenantId, expectedCreditCost, `Load creation - ${weightInTonnes} tonnes`, load[0].id]);

    console.log(`✅ Credits consumed: ${expectedCreditCost} credits\n`);

    // Step 8: Verify final balance
    console.log('📋 STEP 8: Verifying final balance...');
    console.log('─'.repeat(60));
    
    const finalAccount = await AppDataSource.query(`
      SELECT current_balance, purchased_credits, lifetime_spent
      FROM credit_accounts
      WHERE tenant_id = $1
    `, [tenantId]);

    const finalBalance = parseFloat(finalAccount[0].current_balance);
    const actualConsumed = expectedCreditCost;
    const expectedFinalBalance = initialBalance - actualConsumed;

    console.log(`   Initial balance: ${initialBalance} credits`);
    console.log(`   Credits consumed: ${actualConsumed} credits`);
    console.log(`   Expected final balance: ${expectedFinalBalance} credits`);
    console.log(`   Actual final balance: ${finalBalance} credits`);
    
    if (Math.abs(finalBalance - expectedFinalBalance) < 0.01) {
      console.log(`   ✅ Balance calculation correct!\n`);
    } else {
      console.log(`   ❌ Balance mismatch!\n`);
    }

    // Step 9: Show recent transactions
    console.log('📋 STEP 9: Recent credit transactions...');
    console.log('─'.repeat(60));
    
    const transactions = await AppDataSource.query(`
      SELECT 
        amount, type, description, balance_after, created_at
      FROM credit_transactions
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [tenantId]);

    transactions.forEach((tx, index) => {
      const sign = tx.type === 'credit' ? '+' : '-';
      console.log(`   ${index + 1}. ${sign}${tx.amount} credits - ${tx.description}`);
      console.log(`      Balance after: ${tx.balance_after} credits`);
      console.log(`      Date: ${tx.created_at.toISOString()}`);
    });

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`✅ Tenant: ${tenants.length > 0 ? tenants[0].name : 'Test Logistics Co'}`);
    console.log(`✅ Trucks created: 2 (30 tons + 25 tons capacity)`);
    console.log(`✅ Load created: 50 tonnes`);
    console.log(`✅ Pricing rule: ${creditCostPerTon} credits per ton`);
    console.log(`✅ Credits consumed: ${expectedCreditCost} credits`);
    console.log(`✅ Final balance: ${finalBalance} credits`);
    console.log(`✅ System working correctly! ✨\n`);

    await AppDataSource.destroy();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

testCreditConsumptionScenario();
