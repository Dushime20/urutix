#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Test credentials
const TRUCK_OWNER_EMAIL = 'truck.owner@test.com';
const TRUCK_OWNER_PASSWORD = 'test123';

async function main() {
  try {
    console.log('🚀 Testing Trucks 403 Fix Verification\n');

    // Step 1: Login as truck owner
    console.log('📝 Step 1: Logging in as truck owner...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: TRUCK_OWNER_EMAIL,
      password: TRUCK_OWNER_PASSWORD,
    });

    const { accessToken, user } = loginResponse.data;
    console.log(`✅ Login successful!`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant ID: ${user.tenantId}\n`);

    // Step 2: Fetch trucks
    console.log('📝 Step 2: Fetching trucks...');
    const trucksResponse = await axios.get(`${API_BASE}/fleet/trucks?limit=100`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const trucks = trucksResponse.data;
    console.log(`✅ Trucks fetched successfully!`);
    console.log(`   Response type: ${typeof trucks}`);
    console.log(`   Response: ${JSON.stringify(trucks, null, 2)}`);
    console.log(`   Total trucks: ${Array.isArray(trucks) ? trucks.length : 'N/A'}`);
    
    if (Array.isArray(trucks)) {
      console.log(`\n📋 First 5 trucks:`);
      trucks.slice(0, 5).forEach((truck, index) => {
        console.log(`   ${index + 1}. ${truck.plateNumber} (${truck.make} ${truck.model}) - Status: ${truck.status}`);
      });
    } else {
      console.log(`   ⚠️ Response is not an array!`);
    }

    console.log(`\n✅ TEST PASSED: Trucks endpoint is working correctly!`);
    process.exit(0);

  } catch (error) {
    console.error(`\n❌ TEST FAILED:`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.message}`);
      console.error(`   Error: ${error.response.data?.error || ''}`);
      if (error.response.data?.statusCode === 403) {
        console.error(`\n   🔴 Still getting 403 Forbidden error!`);
        console.error(`   This means the backend is still running old code.`);
        console.error(`   Please ensure the backend was properly restarted.`);
      }
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

main();
