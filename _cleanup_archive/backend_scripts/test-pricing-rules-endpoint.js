const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testPricingRulesEndpoint() {
  try {
    console.log('🔐 Logging in as super admin...');
    
    // Login as super admin
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'superadmin@urutix.com',
      password: 'SuperAdmin@123'
    });

    const token = loginResponse.data.accessToken || loginResponse.data.access_token || loginResponse.data.token;
    console.log('✅ Login successful');
    if (token) {
      console.log('Token:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️  No token in response:', loginResponse.data);
      return;
    }

    // Test GET pricing rules
    console.log('\n📋 Testing GET /api/subscriptions/pricing-rules...');
    const rulesResponse = await axios.get(`${API_URL}/subscriptions/pricing-rules`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ GET request successful');
    console.log('Status:', rulesResponse.status);
    console.log('Number of rules:', rulesResponse.data.data?.length || 0);
    
    if (rulesResponse.data.data && rulesResponse.data.data.length > 0) {
      console.log('\n📊 Sample pricing rule:');
      console.log(JSON.stringify(rulesResponse.data.data[0], null, 2));
    } else {
      console.log('⚠️  No pricing rules found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('URL:', error.config?.url);
    }
  }
}

testPricingRulesEndpoint();
