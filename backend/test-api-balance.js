const axios = require('axios');

async function testApiBalance() {
  try {
    console.log('🔍 Testing API endpoints...\n');

    // Test credit balance endpoint
    console.log('1. Testing /api/credits/balance');
    const balanceResponse = await axios.get('http://localhost:3005/api/credits/balance', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to add the actual token
      }
    });
    
    console.log('Response:', JSON.stringify(balanceResponse.data, null, 2));
    console.log('');

    // Test marketplace stats endpoint
    console.log('2. Testing /api/credits/marketplace/stats');
    const statsResponse = await axios.get('http://localhost:3005/api/credits/marketplace/stats', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // You'll need to add the actual token
      }
    });
    
    console.log('Response:', JSON.stringify(statsResponse.data, null, 2));
    console.log('');

    console.log('✅ API tests completed');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testApiBalance();
