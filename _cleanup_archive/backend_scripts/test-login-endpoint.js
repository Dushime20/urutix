const axios = require('axios');

async function testLoginEndpoint() {
  console.log('🔍 TESTING LOGIN ENDPOINT DIRECTLY');
  console.log('=' .repeat(50));

  const baseURL = 'http://localhost:3001';
  
  try {
    // 1. Test health endpoint first
    console.log('\n📋 1. HEALTH CHECK:');
    try {
      const healthResponse = await axios.get(`${baseURL}/health`, { timeout: 5000 });
      console.log('✅ Health endpoint working');
      console.log(`   Response: ${JSON.stringify(healthResponse.data)}`);
    } catch (error) {
      console.log('❌ Health endpoint failed');
      console.log(`   Error: ${error.message}`);
    }

    // 2. Test API root
    console.log('\n📋 2. API ROOT CHECK:');
    try {
      const apiResponse = await axios.get(`${baseURL}/api`, { 
        timeout: 5000,
        validateStatus: () => true 
      });
      console.log('✅ API root accessible');
      console.log(`   Status: ${apiResponse.status}`);
      console.log(`   Response: ${JSON.stringify(apiResponse.data)}`);
    } catch (error) {
      console.log('❌ API root failed');
      console.log(`   Error: ${error.message}`);
    }

    // 3. Test auth endpoint structure
    console.log('\n📋 3. AUTH ENDPOINT STRUCTURE:');
    const authEndpoints = [
      '/api/auth',
      '/api/auth/login',
      '/auth/login'
    ];

    for (const endpoint of authEndpoints) {
      try {
        console.log(`\n   Testing: ${endpoint}`);
        const response = await axios.post(`${baseURL}${endpoint}`, {
          email: 'test@example.com',
          password: 'testpassword'
        }, {
          timeout: 5000,
          validateStatus: () => true
        });
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(response.data)}`);
        
        if (response.status !== 404) {
          console.log('   ✅ Endpoint exists!');
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // 4. Test with real credentials
    console.log('\n📋 4. TESTING WITH REAL CREDENTIALS:');
    const credentials = [
      { email: 'admin@urutix.com', password: 'admin123' },
      { email: 'super@admin.com', password: 'superadmin123' },
      { email: 'urutidriver@gmail.com', password: 'password123' }
    ];

    for (const cred of credentials) {
      try {
        console.log(`\n   Testing login: ${cred.email}`);
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, cred, {
          timeout: 10000,
          validateStatus: () => true,
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173'
          }
        });
        
        console.log(`   Status: ${loginResponse.status}`);
        if (loginResponse.status === 200) {
          console.log('   ✅ Login successful!');
          console.log(`   Has token: ${loginResponse.data.token ? 'Yes' : 'No'}`);
          console.log(`   User: ${JSON.stringify(loginResponse.data.user || {})}`);
        } else {
          console.log('   ❌ Login failed');
          console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
        }
      } catch (error) {
        console.log(`   ❌ Request error: ${error.message}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Data: ${JSON.stringify(error.response.data)}`);
        }
      }
    }

    // 5. Check server logs or routes
    console.log('\n📋 5. SERVER ROUTE CHECK:');
    try {
      const routesResponse = await axios.get(`${baseURL}/api`, {
        timeout: 5000,
        validateStatus: () => true
      });
      console.log(`   API Status: ${routesResponse.status}`);
    } catch (error) {
      console.log(`   API Error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

testLoginEndpoint().catch(console.error);