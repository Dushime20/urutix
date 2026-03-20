const axios = require('axios');

async function testFleetTrucksAPI() {
  try {
    console.log('🚛 Testing Fleet Trucks API...');
    
    // Test without authentication first to see the error
    const response = await axios.get('http://localhost:3000/api/fleet/trucks', {
      timeout: 10000,
      validateStatus: function (status) {
        return status < 600; // Accept any status code less than 600
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', response.headers);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 500) {
      console.log('❌ 500 Internal Server Error detected');
      console.log('❌ This is likely due to database relation issues');
    }
    
  } catch (error) {
    console.error('❌ Error testing Fleet Trucks API:', error.message);
    if (error.response) {
      console.error('❌ Response Status:', error.response.status);
      console.error('❌ Response Data:', error.response.data);
    }
  }
}

testFleetTrucksAPI();