const axios = require('axios');

async function testDirectRepository() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'superadmin@urutix.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    console.log('User ID:', loginResponse.data.user.id);
    console.log('Tenant ID:', loginResponse.data.user.tenantId);
    
    // Test a simpler endpoint first - let's try the insights endpoint which might have less complex logic
    console.log('\n🧠 Testing Analytics Insights (simpler endpoint)...');
    const response = await axios.get('http://localhost:3001/api/analytics/insights', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: 1,
        limit: 5
      }
    });
    
    console.log('✅ Success! Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    
    // If it's a 500 error, let's see if we can get more details
    if (error.response?.status === 500) {
      console.log('\n🔍 This is a 500 error - check backend logs for details');
    }
  }
}

testDirectRepository();