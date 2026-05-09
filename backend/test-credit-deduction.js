/**
 * Test Script: Credit Deduction on Trip Start
 * 
 * This script tests the credit deduction system by:
 * 1. Finding a PLANNED trip
 * 2. Starting the trip (PLANNED → IN_PROGRESS)
 * 3. Monitoring logs for credit deduction
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3005/api';

// Test configuration
const TEST_CONFIG = {
  // You'll need to get a valid JWT token from your login
  // Replace this with an actual token from a DRIVER or TENANT_ADMIN user
  authToken: 'YOUR_JWT_TOKEN_HERE',
  
  // Or provide login credentials to get a token automatically
  loginEmail: 'admin@urutix.com', // Admin user
  loginPassword: 'Admin@123',
};

/**
 * Login and get JWT token
 */
async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_CONFIG.loginEmail,
      password: TEST_CONFIG.loginPassword,
    });
    
    if (response.data.success && response.data.data.accessToken) {
      console.log('✅ Login successful');
      return response.data.data.accessToken;
    } else {
      throw new Error('Login failed: No access token received');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get all trips
 */
async function getTrips(token) {
  try {
    console.log('\n📋 Fetching trips...');
    const response = await axios.get(`${API_BASE_URL}/trips`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 50 }
    });
    
    if (response.data.success) {
      console.log(`✅ Found ${response.data.data.length} trips`);
      return response.data.data;
    } else {
      throw new Error('Failed to fetch trips');
    }
  } catch (error) {
    console.error('❌ Failed to fetch trips:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Find a PLANNED trip
 */
function findPlannedTrip(trips) {
  const plannedTrip = trips.find(trip => trip.status === 'PLANNED');
  
  if (plannedTrip) {
    console.log(`\n✅ Found PLANNED trip:`);
    console.log(`   Trip ID: ${plannedTrip.id}`);
    console.log(`   Trip Number: ${plannedTrip.tripNumber}`);
    console.log(`   Status: ${plannedTrip.status}`);
    console.log(`   Load ID: ${plannedTrip.loadId || 'N/A'}`);
    console.log(`   Truck ID: ${plannedTrip.truckId || 'N/A'}`);
    console.log(`   Driver ID: ${plannedTrip.driverId || 'N/A'}`);
    return plannedTrip;
  } else {
    console.log('\n⚠️  No PLANNED trips found');
    console.log('Available trip statuses:');
    const statusCounts = trips.reduce((acc, trip) => {
      acc[trip.status] = (acc[trip.status] || 0) + 1;
      return acc;
    }, {});
    console.log(statusCounts);
    return null;
  }
}

/**
 * Start a trip (PLANNED → IN_PROGRESS)
 */
async function startTrip(token, tripId) {
  try {
    console.log(`\n🚀 Starting trip ${tripId}...`);
    console.log('⏳ This should trigger credit deduction...\n');
    
    const response = await axios.post(
      `${API_BASE_URL}/trips/${tripId}/start`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.success) {
      console.log('✅ Trip started successfully!');
      console.log(`   New Status: ${response.data.data.status}`);
      console.log(`   Started At: ${response.data.data.actualStartTime}`);
      return response.data.data;
    } else {
      throw new Error('Failed to start trip');
    }
  } catch (error) {
    console.error('❌ Failed to start trip:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Check credit balance
 */
async function checkCreditBalance(token) {
  try {
    console.log('\n💰 Checking credit balance...');
    const response = await axios.get(`${API_BASE_URL}/credits/balance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const balance = response.data.data;
      console.log('✅ Credit Balance:');
      console.log(`   Current Balance: ${balance.currentBalance} credits`);
      console.log(`   Subscription Credits: ${balance.subscriptionCredits} credits`);
      console.log(`   Purchased Credits: ${balance.purchasedCredits} credits`);
      console.log(`   Lifetime Earned: ${balance.lifetimeEarned} credits`);
      console.log(`   Lifetime Spent: ${balance.lifetimeSpent} credits`);
      return balance;
    }
  } catch (error) {
    console.error('❌ Failed to check balance:', error.response?.data || error.message);
  }
}

/**
 * Main test function
 */
async function runTest() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CREDIT DEDUCTION TEST - Trip Start');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // Step 1: Login
    const token = await login();
    
    // Step 2: Check initial credit balance
    const initialBalance = await checkCreditBalance(token);
    
    // Step 3: Get trips
    const trips = await getTrips(token);
    
    // Step 4: Find a PLANNED trip
    const plannedTrip = findPlannedTrip(trips);
    
    if (!plannedTrip) {
      console.log('\n⚠️  Cannot run test: No PLANNED trips available');
      console.log('💡 Create a PLANNED trip first, then run this test again');
      return;
    }
    
    // Step 5: Start the trip
    console.log('\n' + '─'.repeat(60));
    console.log('🎬 STARTING TRIP - WATCH BACKEND LOGS NOW!');
    console.log('─'.repeat(60));
    
    await startTrip(token, plannedTrip.id);
    
    // Step 6: Wait a moment for credit deduction to process
    console.log('\n⏳ Waiting 3 seconds for credit deduction to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 7: Check final credit balance
    const finalBalance = await checkCreditBalance(token);
    
    // Step 8: Compare balances
    if (initialBalance && finalBalance) {
      console.log('\n📊 BALANCE COMPARISON:');
      console.log('─'.repeat(60));
      const difference = initialBalance.currentBalance - finalBalance.currentBalance;
      console.log(`   Before: ${initialBalance.currentBalance} credits`);
      console.log(`   After:  ${finalBalance.currentBalance} credits`);
      console.log(`   Change: ${difference > 0 ? '-' : '+'}${Math.abs(difference)} credits`);
      
      if (difference > 0) {
        console.log('\n✅ SUCCESS: Credits were deducted!');
      } else if (difference < 0) {
        console.log('\n⚠️  UNEXPECTED: Credits increased instead of decreased');
      } else {
        console.log('\n❌ ISSUE: No credit change detected');
        console.log('   This means credit deduction did NOT work');
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('📋 NOW CHECK BACKEND LOGS FOR DETAILED INFORMATION:');
    console.log('═'.repeat(60));
    console.log('\nRun this command in another terminal:');
    console.log('docker-compose -f docker-compose.dev.yml logs backend --tail=100 | Select-String -Pattern "TripsService|credit|deduct" -CaseSensitive:$false');
    console.log('\nLook for these log patterns:');
    console.log('  🔄 Starting credit deduction process');
    console.log('  ✓ Idempotency check passed');
    console.log('  ✓ Trip loaded with relations');
    console.log('  ✓ Tenant admin found');
    console.log('  ✓ Active subscription found');
    console.log('  💰 Credit calculation');
    console.log('  ✅ Credit deduction successful');
    console.log('  ❌ Any error messages');
    console.log('\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest();
