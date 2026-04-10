const { Client } = require('pg');
require('dotenv').config();

async function updateCreditRates() {
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

    console.log('=== UPDATING CREDIT RATES ===\n');

    // New rates (more realistic):
    // Tenant Admin: 50 credits/ton (was 2)
    // Truck Owner: 100 credits/ton (was 5)
    // 
    // This means for a 10-ton cargo:
    // - Tenant Admin loses: 500 credits
    // - Truck Owner loses: 1,000 credits
    // - Total system cost: 1,500 credits

    const newRates = {
      creditsPerTonTenant: 50,
      creditsPerTonTruckOwner: 100,
    };

    console.log('New Rates:');
    console.log(`  Tenant Admin: ${newRates.creditsPerTonTenant} credits/ton`);
    console.log(`  Truck Owner: ${newRates.creditsPerTonTruckOwner} credits/ton`);
    console.log('');

    // Update all active plans except "Simple" (partner plan)
    const result = await client.query(`
      UPDATE subscription_plans
      SET 
        credits_per_ton_tenant = $1,
        credits_per_ton_truck_owner = $2
      WHERE is_active = true
        AND slug != 'simple'
      RETURNING id, name, slug, credits_per_ton_tenant, credits_per_ton_truck_owner
    `, [newRates.creditsPerTonTenant, newRates.creditsPerTonTruckOwner]);

    console.log(`✅ Updated ${result.rows.length} subscription plans:\n`);
    
    result.rows.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.slug})`);
      console.log(`    Tenant: ${plan.credits_per_ton_tenant} credits/ton`);
      console.log(`    Truck Owner: ${plan.credits_per_ton_truck_owner} credits/ton`);
      console.log('');
    });

    // Show example calculations
    console.log('\n=== EXAMPLE CALCULATIONS WITH NEW RATES ===\n');
    console.log('Cargo Weight | Tenant Cost | Truck Owner Cost | Total System Cost');
    console.log('-------------|-------------|------------------|------------------');
    
    const cargoWeights = [1, 5, 10, 50, 100];
    
    cargoWeights.forEach(weight => {
      const tenantCost = Math.ceil(weight * newRates.creditsPerTonTenant);
      const truckOwnerCost = Math.ceil(weight * newRates.creditsPerTonTruckOwner);
      const totalCost = tenantCost + truckOwnerCost;
      
      console.log(
        `${weight.toString().padEnd(12)} | ` +
        `${tenantCost.toString().padEnd(11)} | ` +
        `${truckOwnerCost.toString().padEnd(16)} | ` +
        `${totalCost}`
      );
    });

    console.log('\n=== IMPACT ON CURRENT USERS ===\n');

    // Check tenant admin capacity
    const tenantAdminResult = await client.query(`
      SELECT 
        u.email,
        ca.current_balance
      FROM credit_accounts ca
      JOIN users u ON ca.user_id = u.id
      WHERE u.role = 'TENANT_ADMIN'
        AND u."tenantId" = '3174d6