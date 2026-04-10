const { Client } = require('pg');
require('dotenv').config();

async function checkCreditRates() {
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

    console.log('=== CURRENT CREDIT RATES IN SUBSCRIPTION PLANS ===\n');

    const result = await client.query(`
      SELECT 
        id,
        name,
        slug,
        credits_per_ton_tenant,
        credits_per_ton_truck_owner,
        total_credits,
        price_per_credit
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY name
    `);

    result.rows.forEach(plan => {
      console.log(`Plan: ${plan.name} (${plan.slug})`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  Tenant Rate: ${plan.credits_per_ton_tenant} credits/ton`);
      console.log(`  Truck Owner Rate: ${plan.credits_per_ton_truck_owner} credits/ton`);
      console.log(`  Total Credits: ${plan.total_credits === -1 ? 'Unlimited' : plan.total_credits}`);
      console.log(`  Price per Credit: $${plan.price_per_credit}`);
      console.log('');
    });

    console.log('\n=== EXAMPLE CALCULATIONS ===\n');
    
    const cargoWeights = [1, 5, 10, 50, 100];
    
    result.rows.forEach(plan => {
      console.log(`\n${plan.name} Plan:`);
      console.log('Cargo Weight | Tenant Cost | Truck Owner Cost | Total System Cost');
      console.log('-------------|-------------|------------------|------------------');
      
      cargoWeights.forEach(weight => {
        const tenantCost = Math.ceil(weight * Number(plan.credits_per_ton_tenant));
        const truckOwnerCost = Math.ceil(weight * Number(plan.credits_per_ton_truck_owner));
        const totalCost = tenantCost + truckOwnerCost;
        
        console.log(
          `${weight.toString().padEnd(12)} | ` +
          `${tenantCost.toString().padEnd(11)} | ` +
          `${truckOwnerCost.toString().padEnd(16)} | ` +
          `${totalCost}`
        );
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkCreditRates();
