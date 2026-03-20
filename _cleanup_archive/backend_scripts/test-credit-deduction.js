/**
 * Test Credit Deduction Integration
 * Verifies that the credit consumption system is working correctly
 */

const { Client } = require('pg');
require('dotenv').config();

async function testCreditDeduction() {
  console.log('🧪 Testing Credit Deduction Integration...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Check if pricing rules exist
    console.log('1️⃣  Checking pricing rules...');
    const rules = await client.query(`
      SELECT * FROM credit_pricing_rules 
      WHERE is_active = true 
      ORDER BY priority DESC
    `);
    
    if (rules.rows.length === 0) {
      console.log('❌ No active pricing rules found!');
      console.log('   Run: npm run seed:pricing-rules\n');
      return;
    }
    
    console.log(`✅ Found ${rules.rows.length} active pricing rule(s)`);
    rules.rows.forEach(rule => {
      console.log(`   - ${rule.rule_name}: ${rule.credit_cost} credits/${rule.unit}`);
    });
    console.log('');

    // 2. Check if tenants have credit accounts
    console.log('2️⃣  Checking credit accounts...');
    const accounts = await client.query(`
      SELECT ca.*, t.name as tenant_name
      FROM credit_accounts ca
      JOIN tenants t ON t.id = ca.tenant_id
      ORDER BY ca.current_balance DESC
      LIMIT 5
    `);
    
    if (accounts.rows.length === 0) {
      console.log('❌ No credit accounts found!');
      console.log('   Run: npm run seed:tenant-subscriptions\n');
      return;
    }
    
    console.log(`✅ Found ${accounts.rows.length} credit accounts (showing top 5)`);
    accounts.rows.forEach(acc => {
      console.log(`   - ${acc.tenant_name}: ${acc.current_balance} credits`);
    });
    console.log('');

    // 3. Check for recent credit transactions
    console.log('3️⃣  Checking recent credit transactions...');
    const transactions = await client.query(`
      SELECT 
        ct.*,
        t.name as tenant_name,
        ct.metadata->>'weight_tons' as weight,
        ct.metadata->>'rate_per_ton' as rate
      FROM credit_transactions ct
      JOIN tenants t ON t.id = ct.tenant_id
      WHERE ct.type = 'CONSUMPTION'
        AND ct.reference_type = 'trip'
      ORDER BY ct.created_at DESC
      LIMIT 5
    `);
    
    if (transactions.rows.length === 0) {
      console.log('ℹ️  No trip-related credit transactions found yet');
      console.log('   This is normal if no trips have been completed\n');
    } else {
      console.log(`✅ Found ${transactions.rows.length} trip-related transactions (showing last 5)`);
      transactions.rows.forEach(tx => {
        const date = new Date(tx.created_at).toLocaleString();
        console.log(`   - ${date}: ${tx.tenant_name}`);
        console.log(`     Amount: ${Math.abs(tx.amount)} credits`);
        console.log(`     Weight: ${tx.weight} tons @ ${tx.rate} credits/ton`);
        console.log(`     Balance after: ${tx.balance_after} credits`);
      });
      console.log('');
    }

    // 4. Check for completed trips
    console.log('4️⃣  Checking completed trips...');
    const trips = await client.query(`
      SELECT 
        t.id,
        t."tripNumber",
        t.status,
        t."tenantId",
        t."loadId",
        l.weight,
        l.title as load_title
      FROM trips t
      LEFT JOIN loads l ON l.id = t."loadId"
      WHERE t.status = 'COMPLETED'
      ORDER BY t."updatedAt" DESC
      LIMIT 5
    `);
    
    if (trips.rows.length === 0) {
      console.log('ℹ️  No completed trips found');
      console.log('   Complete a trip to test credit deduction\n');
    } else {
      console.log(`✅ Found ${trips.rows.length} completed trips (showing last 5)`);
      trips.rows.forEach(trip => {
        console.log(`   - ${trip.tripNumber}: ${trip.load_title || 'No title'}`);
        console.log(`     Weight: ${trip.weight || 'N/A'} tons`);
        console.log(`     Status: ${trip.status}`);
      });
      console.log('');
    }

    // 5. Summary
    console.log('='.repeat(60));
    console.log('📊 Integration Status Summary:\n');
    
    const hasRules = rules.rows.length > 0;
    const hasAccounts = accounts.rows.length > 0;
    const hasTransactions = transactions.rows.length > 0;
    
    console.log(`✅ Pricing Rules: ${hasRules ? 'CONFIGURED' : 'MISSING'}`);
    console.log(`✅ Credit Accounts: ${hasAccounts ? 'READY' : 'MISSING'}`);
    console.log(`${hasTransactions ? '✅' : 'ℹ️ '} Credit Deductions: ${hasTransactions ? 'WORKING' : 'NOT TESTED YET'}`);
    console.log('');

    if (hasRules && hasAccounts) {
      console.log('✨ System is ready for automatic credit deduction!');
      console.log('');
      console.log('💡 To test:');
      console.log('   1. Create a load with weight specified');
      console.log('   2. Create a trip for that load');
      console.log('   3. Update trip status to COMPLETED');
      console.log('   4. Check credit_transactions table for deduction');
      console.log('');
      console.log('📝 API Endpoints:');
      console.log('   - POST /api/credits/preview - Preview cost');
      console.log('   - GET /api/credits/balance - Check balance');
      console.log('   - GET /api/credits/transactions - View history');
      console.log('');
    } else {
      console.log('⚠️  System setup incomplete. Please run:');
      if (!hasRules) console.log('   - npm run seed:pricing-rules');
      if (!hasAccounts) console.log('   - npm run seed:tenant-subscriptions');
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Test complete\n');
  }
}

testCreditDeduction();
