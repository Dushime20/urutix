const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testUserKycEndpoints() {
  console.log('🧪 Testing User KYC Endpoints...\n');

  try {
    // Test 1: Check if backend is running
    console.log('1️⃣ Testing backend connectivity...');
    try {
      const response = await axios.get(`${BASE_URL}`);
      console.log('❌ Unexpected success on root endpoint');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Backend is running (404 on root is expected)');
      } else {
        console.log('❌ Backend connectivity issue:', error.message);
        return;
      }
    }

    // Test 2: Test KYC requirements endpoint (should work without auth)
    console.log('\n2️⃣ Testing KYC requirements endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/api/user-kyc/requirements/TRUCK_OWNER`);
      console.log('✅ KYC requirements endpoint working');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ KYC requirements endpoint failed:', error.response?.status, error.response?.data?.message);
    }

    // Test 3: Test other role requirements
    console.log('\n3️⃣ Testing other role requirements...');
    const roles = ['CARGO_OWNER', 'BROKER', 'DRIVER', 'AGENT', 'LENDER'];
    
    for (const role of roles) {
      try {
        const response = await axios.get(`${BASE_URL}/api/user-kyc/requirements/${role}`);
        console.log(`✅ ${role} requirements: ${response.data.success ? 'Success' : 'Failed'}`);
      } catch (error) {
        console.log(`❌ ${role} requirements failed:`, error.response?.status);
      }
    }

    // Test 4: Test protected endpoints (should return 401)
    console.log('\n4️⃣ Testing protected endpoints (should return 401)...');
    try {
      const response = await axios.get(`${BASE_URL}/api/user-kyc/my-kyc`);
      console.log('❌ Protected endpoint should require auth');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Protected endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error on protected endpoint:', error.response?.status);
      }
    }

    // Test 5: Check if routes are registered
    console.log('\n5️⃣ Testing route registration...');
    try {
      const response = await axios.get(`${BASE_URL}/api/user-kyc`);
      console.log('Route response:', response.status);
    } catch (error) {
      console.log('Route error:', error.response?.status, error.response?.data?.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testUserKycEndpoints();