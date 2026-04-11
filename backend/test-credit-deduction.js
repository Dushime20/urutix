// Test credit deduction logic for bid acceptance
const axios = require('axios');

const API_BASE = 'http://localhost:3005/api';

// Test credentials
const TENANT_ADMIN = {
  email: 'tenantadmin@demo.com',
  password: 'TenantAdmin@123'
};

const CARGO_OWNER = {
  email: 'cargoowner1@demo.com',
  password: 'CargoOwner123!'
};

const TRUCK_OWNER = {
  email: 'truckowner5@demo.com',
  password: 'TruckOwner@123'
};

async function login(credentials) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, credentials);
    return response.data.accessToken;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getCreditBalance(token) {
  try {
    const response = await axios.get(`${API_BASE}/credits/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to get credit balance:', error.response?.data || error.message);
    return null;
  }
}

async function getSubscription(token) {
  try {
    const response = await axios.get(`${API_BASE}/subscriptions/my-subscriptions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to get subscription:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('\n=== Testing Credit Deduction Logic ===\n');

  // Login as tenant admin
  console.log('1. Logging in as tenant admin...');
  const tenantAdminToken = await login(TENANT_ADMIN);
  console.log('✓ Logged in successfully\n');

  // Get tenant admin credit balance and subscription
  console.log('2. Checking tenant admin credits and subscription...');
  const tenantAdminCredits = await getCreditBalance(tenantAdminToken);
  const tenantAdminSubs = await getSubscription(tenantAdminToken);
  
  if (tenantAdminCredits) {
    console.log(`✓ Tenant Admin Credit Balance: ${tenantAdminCredits.currentBalance}`);
    console.log(`  - Lifetime Earned: ${tenantAdminCredits.lifetimeEarned}`);
    console.log(`  - Lifetime Spent: ${tenantAdminCredits.lifetimeSpent}`);
  }
  
  if (tenantAdminSubs && tenantAdminSubs.length > 0) {
    const activeSub = tenantAdminSubs.find(s => s.status === 'active');
    if (activeSub) {
      console.log(`✓ Tenant Admin Active Subscription: ${activeSub.plan?.name}`);
      console.log(`  - Credits Per Ton (Tenant): ${activeSub.plan?.creditsPerTonTenant || 'N/A'}`);
      console.log(`  - Credits Per Ton (Truck Owner): ${activeSub.plan?.creditsPerTonTruckOwner || 'N/A'}`);
    }
  }
  console.log('');

  // Login as truck owner
  console.log('3. Logging in as truck owner...');
  const truckOwnerToken = await login(TRUCK_OWNER);
  console.log('✓ Logged in successfully\n');

  // Get truck owner credit balance and subscription
  console.log('4. Checking truck owner credits and subscription...');
  const truckOwnerCredits = await getCreditBalance(truckOwnerToken);
  const truckOwnerSubs = await getSubscription(truckOwnerToken);
  
  if (truckOwnerCredits) {
    console.log(`✓ Truck Owner Credit Balance: ${truckOwnerCredits.currentBalance}`);
    console.log(`  - Lifetime Earned: ${truckOwnerCredits.lifetimeEarned}`);
    console.log(`  - Lifetime Spent: ${truckOwnerCredits.lifetimeSpent}`);
  }
  
  if (truckOwnerSubs && truckOwnerSubs.length > 0) {
    const activeSub = truckOwnerSubs.find(s => s.status === 'active');
    if (activeSub) {
      console.log(`✓ Truck Owner Active Subscription: ${activeSub.plan?.name}`);
      console.log(`  - Credits Per Ton (Tenant): ${activeSub.plan?.creditsPerTonTenant || 'N/A'}`);
      console.log(`  - Credits Per Ton (Truck Owner): ${activeSub.plan?.creditsPerTonTruckOwner || 'N/A'}`);
    }
  }
  console.log('');

  // Summary
  console.log('=== Credit Deduction Calculation ===\n');
  
  if (tenantAdminSubs && tenantAdminSubs.length > 0 && truckOwnerSubs && truckOwnerSubs.length > 0) {
    const tenantSub = tenantAdminSubs.find(s => s.status === 'active');
    const truckSub = truckOwnerSubs.find(s => s.status === 'active');
    
    if (tenantSub && truckSub) {
      const cargoWeightKg = 4000; // Example: 4000 kg
      const cargoWeightTons = cargoWeightKg / 1000;
      
      const tenantRate = tenantSub.plan?.creditsPerTonTenant || 0;
      const truckOwnerRate = truckSub.plan?.creditsPerTonTruckOwner || 0;
      
      const tenantCreditsNeeded = Math.ceil(cargoWeightTons * tenantRate);
      const truckOwnerCreditsNeeded = Math.ceil(cargoWeightTons * truckOwnerRate);
      
      console.log(`For a cargo of ${cargoWeightKg} kg (${cargoWeightTons} tons):`);
      console.log(`  - Tenant Admin will be charged: ${cargoWeightTons} tons × ${tenantRate} credits/ton = ${tenantCreditsNeeded} credits`);
      console.log(`  - Truck Owner will be charged: ${cargoWeightTons} tons × ${truckOwnerRate} credits/ton = ${truckOwnerCreditsNeeded} credits`);
      console.log('');
      
      // Check if they have enough credits
      const tenantHasEnough = tenantAdminCredits && tenantAdminCredits.currentBalance >= tenantCreditsNeeded;
      const truckOwnerHasEnough = truckOwnerCredits && truckOwnerCredits.currentBalance >= truckOwnerCreditsNeeded;
      
      console.log('Credit Sufficiency Check:');
      console.log(`  - Tenant Admin: ${tenantHasEnough ? '✓ Sufficient' : '✗ Insufficient'} (${tenantAdminCredits?.currentBalance || 0} available, ${tenantCreditsNeeded} needed)`);
      console.log(`  - Truck Owner: ${truckOwnerHasEnough ? '✓ Sufficient' : '✗ Insufficient'} (${truckOwnerCredits?.currentBalance || 0} available, ${truckOwnerCreditsNeeded} needed)`);
      console.log('');
      
      if (tenantHasEnough && truckOwnerHasEnough) {
        console.log('✓ Both parties have sufficient credits for bid acceptance');
      } else {
        console.log('✗ One or both parties have insufficient credits');
      }
    }
  }

  console.log('\n=== Test Complete ===\n');
}

main().catch(console.error);
