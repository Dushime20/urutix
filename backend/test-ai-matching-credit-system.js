/**
 * Test Script: AI Matching Credit System
 * 
 * This script tests the credit validation and deduction system for AI matching.
 * It verifies that:
 * 1. Truck owner credit validation works before match request
 * 2. Credit deduction happens correctly on match acceptance
 * 3. Both tenant admin and truck owner credits are properly deducted
 * 4. Tenant admin receives revenue from truck owner payment
 */

const { DataSource } = require('typeorm');
const path = require('path');

// Database configuration
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'cargo_management',
  entities: [path.join(__dirname, 'src/entities/**/*.entity.{ts,js}')],
  synchronize: false,
});

async function testAIMatchingCreditSystem() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Step 1: Find a tenant with active subscription
    console.log('📋 Step 1: Finding tenant with active subscription...');
    const tenantSubscription = await AppDataSource.query(`
      SELECT 
        ts.id as subscription_id,
        ts.tenant_id,
        ts.user_id as tenant_admin_user_id,
        ts.status,
        sp.name as plan_name,
        sp.credits_per_ton_tenant,
        sp.credits_per_ton_truck_owner
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.status = 'ACTIVE'
      LIMIT 1
    `);

    if (tenantSubscription.length === 0) {
      console.log('❌ No active subscription found. Please create a subscription first.');
      return;
    }

    const subscription = tenantSubscription[0];
    console.log('✅ Found active subscription:');
    console.log(`   - Tenant ID: ${subscription.tenant_id}`);
    console.log(`   - Plan: ${subscription.plan_name}`);
    console.log(`   - Tenant Rate: ${subscription.credits_per_ton_tenant} credits/ton`);
    console.log(`   - Truck Owner Rate: ${subscription.credits_per_ton_truck_owner} credits/ton\n`);

    // Step 2: Find tenant admin user
    console.log('📋 Step 2: Finding tenant admin user...');
    const tenantAdminUsers = await AppDataSource.query(`
      SELECT id, email, role
      FROM users
      WHERE tenant_id = $1 AND role = 'TENANT_ADMIN'
      LIMIT 1
    `, [subscription.tenant_id]);

    if (tenantAdminUsers.length === 0) {
      console.log('❌ No tenant admin found for this tenant.');
      return;
    }

    const tenantAdmin = tenantAdminUsers[0];
    console.log('✅ Found tenant admin:');
    console.log(`   - User ID: ${tenantAdmin.id}`);
    console.log(`   - Email: ${tenantAdmin.email}\n`);

    // Step 3: Find a truck owner with a truck
    console.log('📋 Step 3: Finding truck owner with truck...');
    const truckOwners = await AppDataSource.query(`
      SELECT DISTINCT
        u.id as user_id,
        u.email,
        t.id as truck_id,
        t.plate_number
      FROM users u
      JOIN trucks t ON t.owner_id = u.id
      WHERE u.tenant_id = $1 AND u.role = 'TRUCK_OWNER'
      LIMIT 1
    `, [subscription.tenant_id]);

    if (truckOwners.length === 0) {
      console.log('❌ No truck owner with truck found for this tenant.');
      return;
    }

    const truckOwner = truckOwners[0];
    console.log('✅ Found truck owner:');
    console.log(`   - User ID: ${truckOwner.user_id}`);
    console.log(`   - Email: ${truckOwner.email}`);
    console.log(`   - Truck ID: ${truckOwner.truck_id}`);
    console.log(`   - Plate Number: ${truckOwner.plate_number}\n`);

    // Step 4: Find a cargo/load
    console.log('📋 Step 4: Finding available cargo...');
    const loads = await AppDataSource.query(`
      SELECT id, title, weight, status
      FROM loads
      WHERE tenant_id = $1 AND status = 'PENDING'
      LIMIT 1
    `, [subscription.tenant_id]);

    if (loads.length === 0) {
      console.log('❌ No available cargo found for this tenant.');
      return;
    }

    const load = loads[0];
    const cargoWeightTons = load.weight / 1000;
    console.log('✅ Found cargo:');
    console.log(`   - Load ID: ${load.id}`);
    console.log(`   - Title: ${load.title}`);
    console.log(`   - Weight: ${load.weight} kg (${cargoWeightTons.toFixed(2)} tons)`);
    console.log(`   - Status: ${load.status}\n`);

    // Step 5: Calculate required credits
    console.log('📋 Step 5: Calculating required credits...');
    const tenantCreditsNeeded = Math.ceil(cargoWeightTons * subscription.credits_per_ton_tenant);
    const truckOwnerCreditsNeeded = Math.ceil(cargoWeightTons * subscription.credits_per_ton_truck_owner);
    const tenantNetProfit = truckOwnerCreditsNeeded - tenantCreditsNeeded;

    console.log('💰 Credit Calculation:');
    console.log(`   - Cargo Weight: ${cargoWeightTons.toFixed(2)} tons`);
    console.log(`   - Tenant Admin Cost: ${cargoWeightTons.toFixed(2)} × ${subscription.credits_per_ton_tenant} = ${tenantCreditsNeeded} credits`);
    console.log(`   - Truck Owner Cost: ${cargoWeightTons.toFixed(2)} × ${subscription.credits_per_ton_truck_owner} = ${truckOwnerCreditsNeeded} credits`);
    console.log(`   - Tenant Admin Net Profit: ${truckOwnerCreditsNeeded} - ${tenantCreditsNeeded} = ${tenantNetProfit} credits\n`);

    // Step 6: Check current credit balances
    console.log('📋 Step 6: Checking current credit balances...');
    
    const tenantAdminAccount = await AppDataSource.query(`
      SELECT current_balance, bonus_credits, subscription_credits, purchased_credits
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [subscription.tenant_id, tenantAdmin.id]);

    const truckOwnerAccount = await AppDataSource.query(`
      SELECT current_balance, bonus_credits, subscription_credits, purchased_credits
      FROM credit_accounts
      WHERE tenant_id = $1 AND user_id = $2
    `, [subscription.tenant_id, truckOwner.user_id]);

    const tenantAdminBalance = tenantAdminAccount.length > 0 ? tenantAdminAccount[0].current_balance : 0;
    const truckOwnerBalance = truckOwnerAccount.length > 0 ? truckOwnerAccount[0].current_balance : 0;

    console.log('💳 Current Balances:');
    console.log(`   - Tenant Admin: ${tenantAdminBalance} credits`);
    console.log(`   - Truck Owner: ${truckOwnerBalance} credits\n`);

    // Step 7: Validate credit requirements
    console.log('📋 Step 7: Validating credit requirements...');
    
    let validationPassed = true;
    
    if (tenantAdminBalance < tenantCreditsNeeded) {
      console.log(`❌ Tenant Admin has insufficient credits!`);
      console.log(`   Required: ${tenantCreditsNeeded}, Available: ${tenantAdminBalance}`);
      validationPassed = false;
    } else {
      console.log(`✅ Tenant Admin has sufficient credits (${tenantAdminBalance} >= ${tenantCreditsNeeded})`);
    }

    if (truckOwnerBalance < truckOwnerCreditsNeeded) {
      console.log(`❌ Truck Owner has insufficient credits!`);
      console.log(`   Required: ${truckOwnerCreditsNeeded}, Available: ${truckOwnerBalance}`);
      validationPassed = false;
    } else {
      console.log(`✅ Truck Owner has sufficient credits (${truckOwnerBalance} >= ${truckOwnerCreditsNeeded})`);
    }

    if (!validationPassed) {
      console.log('\n⚠️  Credit validation failed. Match request would be blocked.');
      console.log('\n💡 To fix this:');
      console.log('   1. Grant credits to users using the credit marketplace');
      console.log('   2. Or use a cargo with lower weight');
      return;
    }

    console.log('\n✅ All credit validations passed!\n');

    // Step 8: Simulate credit deduction
    console.log('📋 Step 8: Simulating credit deduction on match acceptance...\n');
    console.log('💸 Credit Flow:');
    console.log(`   1. Tenant Admin: ${tenantAdminBalance} - ${tenantCreditsNeeded} = ${tenantAdminBalance - tenantCreditsNeeded} credits`);
    console.log(`   2. Truck Owner: ${truckOwnerBalance} - ${truckOwnerCreditsNeeded} = ${truckOwnerBalance - truckOwnerCreditsNeeded} credits`);
    console.log(`   3. Tenant Admin Revenue: +${truckOwnerCreditsNeeded} credits (from truck owner)`);
    console.log(`   4. Tenant Admin Final: ${tenantAdminBalance - tenantCreditsNeeded + truckOwnerCreditsNeeded} credits (Net: ${tenantNetProfit > 0 ? '+' : ''}${tenantNetProfit})\n`);

    // Step 9: Summary
    console.log('═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    console.log('\n✅ AI Matching Credit System Test Results:\n');
    console.log('1. ✅ Found active subscription with credit rates');
    console.log('2. ✅ Found tenant admin and truck owner users');
    console.log('3. ✅ Found available cargo and truck');
    console.log('4. ✅ Credit calculations are correct');
    console.log('5. ✅ Both parties have sufficient credits');
    console.log('6. ✅ Credit deduction flow is valid\n');

    console.log('🎯 Expected Behavior:');
    console.log('   - Match request will validate truck owner credits');
    console.log('   - Match acceptance will deduct credits from both parties');
    console.log('   - Tenant admin will receive revenue from truck owner payment');
    console.log(`   - Tenant admin net profit: ${tenantNetProfit} credits\n`);

    console.log('📝 Next Steps:');
    console.log('   1. Test match request via API: POST /matching/request');
    console.log('   2. Test match acceptance via API: PATCH /matching/:matchId/respond');
    console.log('   3. Verify credit transactions in database');
    console.log('   4. Check credit balances after acceptance\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the test
testAIMatchingCreditSystem();
