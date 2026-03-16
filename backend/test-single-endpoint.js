const axios = require('axios');

async function testSingleEndpoint() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'superadmin@urutix.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    
    // Test analytics overview
    console.log('\n📊 Testing Analytics Overview...');
    const response = await axios.get('http://localhost:3001/api/analytics/overview', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Success! Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testSingleEndpoint();