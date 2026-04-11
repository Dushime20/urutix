// Test slot validation via API
const axios = require('axios');

const API_BASE = 'http://localhost:3005/api';

// Test credentials
const TENANT_ADMIN = {
  email: 'tenantadmin@demo.com',
  password: 'password123'
};

const TRUCK_OWNER = {
  email: 'truckowner5@demo.com',
  password: 'TruckOwner@123'
};

async function login(credentials) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, credentials);
    console.log('Login response:', JSON.stringify(response.data, null, 2));
    return response.data.data?.accessToken || response.data.accessToken || response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getAvailablePlans(token) {
  try {
    const response = await axios.get(`${API_BASE}/subscriptions/available-plans`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to get plans:', error.response?.data || error.message);
    throw error;
  }
}

async function purchasePlan(token, planId) {
  try {
    const response = await axios.post(
      `${API_BASE}/subscriptions/purchase`,
      {
        planId,
        paymentMethod: 'card',
        paymentDetails: {
          cardNumber: '4111111111111111',
          cardName: 'Test User',
          expiryDate: '12/25',
          cvv: '123'
        }
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Purchase failed:', error.response?.data || error.message);
    return { error: error.response?.data?.message || error.message };
  }
}

async function main() {
  console.log('\n=== Testing Slot Validation ===\n');

  // Login as truck owner
  console.log('1. Logging in as truck owner...');
  const truckOwnerToken = await login(TRUCK_OWNER);
  console.log('✓ Logged in successfully\n');

  // Get available plans
  console.log('2. Fetching available partner plans...');
  const plans = await getAvailablePlans(truckOwnerToken);
  
  const partnerPlans = plans.filter(p => p.parentSubscriptionId);
  
  if (partnerPlans.length === 0) {
    console.log('✗ No partner plans found');
    return;
  }

  console.log(`✓ Found ${partnerPlans.length} partner plan(s)\n`);

  // Display slot information
  partnerPlans.forEach((plan, index) => {
    console.log(`Plan ${index + 1}: ${plan.name}`);
    console.log(`  - Total Slots: ${plan.availableSlots}`);
    console.log(`  - Purchased: ${plan.purchasedCount || 0}`);
    console.log(`  - Remaining: ${plan.slotsRemaining || plan.availableSlots}`);
    console.log(`  - Is Full: ${plan.isFull ? 'YES' : 'NO'}`);
    console.log(`  - Credits: ${plan.creditCostPerPartner}`);
    console.log(`  - Price: $${(plan.pricePerCredit * plan.creditCostPerPartner).toFixed(2)}`);
    console.log('');
  });

  // Test purchasing a plan
  const testPlan = partnerPlans[0];
  console.log(`3. Testing purchase of "${testPlan.name}"...`);
  
  if (testPlan.isFull) {
    console.log('✓ Plan is full - attempting purchase should fail...');
    const result = await purchasePlan(truckOwnerToken, testPlan.id);
    if (result.error) {
      console.log(`✓ Purchase correctly rejected: ${result.error}\n`);
    } else {
      console.log('✗ Purchase should have been rejected but succeeded!\n');
    }
  } else {
    console.log(`✓ Plan has ${testPlan.slotsRemaining} slot(s) available`);
    console.log('  (Purchase would succeed if attempted)\n');
  }

  console.log('=== Test Complete ===\n');
}

main().catch(console.error);
