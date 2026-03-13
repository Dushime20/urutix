const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function debugLoginAPI() {
  try {
    console.log('🔍 Debugging Login API...\n');
    
    // Test if the API is responding
    console.log('1. Testing API health...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ API is responding');
    } catch (error) {
      console.log('❌ API health check failed:', error.message);
    }
    
    // Test login endpoint
    console.log('\n2. Testing login endpoint...');
    
    const loginData = {
      email: 'superadmin@urutix.com',
      password: 'Admin@123'
    };
    
    console.log('Login payload:', loginData);
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Login successful!');
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Login failed');
      console.log('Status:', error.response?.status);
      console.log('Status text:', error.response?.statusText);
      console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
      console.log('Error message:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 Backend server might not be running!');
        console.log('   Start it with: npm run start:dev');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugLoginAPI();