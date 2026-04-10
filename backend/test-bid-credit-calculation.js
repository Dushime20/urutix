const { Client } = require('pg');
require('dotenv').config();

async function testBidCreditCalculation() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    const truckOwnerId = 'ba42dac0-275d-4657-b18c-8ec03c685537'; // truckowner5
    const tenantAdminId = '007eb9d5-a71b-42be-8c9e-1c968dd97c71'; // tenantadmin
    const tenantId = '3174d68f-cb7d-4428-b578-e931d1a3f464'; // Demo Tenant

    console.log('=== CREDIT CALCULATION TEST ===\n');

    // Get current balances
    const balancesResult = await client.query(`
      SELECT 
        u.email,
        ca.current_balance,
        ca.user_id
      FROM credit_accounts ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.user_id IN ($1, $2) AND ca.tenant_id = $3
    `, [truckOwnerId, tenantAdminId, tenantId]);

    console.log('Current Balances:');
    balancesResult.rows.forEach(row => {
      console.log(`  ${row.email}: ${row.current_balance} credits`);
    });

    // Get credit rates
    const ratesResult = await client.query(`
      SELECT 
        u.email,
        sp.name as plan_name,
        sp.credits_per_ton_tenant,
        sp.credits_per_ton_truck_owner
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      JOIN users u ON ts.user_id = u.id
      WHERE ts.user_id IN ($1, $2) AND ts.tenant_id = $3 AND ts.status = 'active'
    `, [truckOwnerId, tenantAdminId, tenantId]);

    console.log('\nCredit Rates:');
    ratesResult.rows.forEach(row => {
      console.log(`  ${row.email} (${row.plan_name}):`);
      if (row.email.includes('tenantadmin')) {
        console.log(`    Tenant rate: ${row.credits_per_ton_tenant} credits/ton`);
      } else {
        console.log(`    Truck owner rate: ${row.credits_per_ton_truck_owner} credits/ton`);
      }
    });

    // Simulate different cargo weights
    console.log('\n=== SIMULATION: Credit Deduction for Different Cargo Weights ===\n');

    const tenantRate = 2; // credits/ton for tenant admin
    const truckOwnerRate = 5; // credits/ton for truck owner
    const tenantBalance = 4976;
    const truckOwnerBalance = 3000;

    const cargoWeights = [1, 4, 10, 50, 100, 500, 600];

    console.log('Cargo Weight | Tenant Deduction | Truck Owner Deduction | Total Cost | Can Afford?');
    console.log('-------------|------------------|----------------------|------------|------------');

    cargoWeights.forEach(weight => {
      const tenantDeduction = Math.ceil(weight * tenantRate);
      const truckOwnerDeduction = Math.ceil(weight * truckOwnerRate);
      const totalCost = tenantDeduction + truckOwnerDeduction;
      
      const tenantCanAfford = tenantBalance >= tenantDeduction;
      const truckOwnerCanAfford = truckOwnerBalance >= truckOwnerDeduction;
      const canAfford = tenantCanAfford && truckOwnerCanAfford;

      const status = canAfford ? '✅ Yes' : '❌ No';
      const reason = !canAfford ? 
        (!tenantCanAfford ? ' (Tenant insufficient)' : ' (Truck owner insufficient)') : '';

      console.log(
        `${weight.toString().padEnd(12)} | ` +
        `${tenantDeduction.toString().padEnd(16)} | ` +
        `${truckOwnerDeduction.toString().padEnd(20)} | ` +
        `${totalCost.toString().padEnd(10)} | ` +
        `${status}${reason}`
      );
    });

    console.log('\n=== MAXIMUM CARGO CAPACITY ===\n');
    
    const maxTenantCapacity = Math.floor(tenantBalance / tenantRate);
    const maxTruckOwnerCapacity = Math.floor(truckOwnerBalance / truckOwnerRate);
    const actualMaxCapacity = Math.min(maxTenantCapacity, maxTruckOwnerCapacity);

    console.log(`Tenant admin can afford: ${maxTenantCapacity} tons (${tenantBalance} credits ÷ ${tenantRate} credits/ton)`);
    console.log(`Truck owner can afford: ${maxTruckOwnerCapacity} tons (${truckOwnerBalance} credits ÷ ${truckOwnerRate} credits/ton)`);
    console.log(`\nActual maximum cargo: ${actualMaxCapacity} tons (limited by truck owner)`);

    console.log('\n=== RECOMMENDATION ===\n');
    if (actualMaxCapacity < 100) {
      console.log('⚠️  Truck owner should purchase more credits to handle larger cargo loads.');
      console.log(`   Current capacity: ${actualMaxCapacity} tons`);
      console.log(`   Recommended: At least 500 tons capacity (2,500 credits needed)`);
    } else {
      console.log('✅ Both parties have sufficient credits for normal operations.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testBidCreditCalculation();
