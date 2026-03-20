const axios = require('axios');

async function testFleetAPI() {
  try {
    console.log('🧪 Testing Fleet API after relation fixes...');
    
    // Test without authentication first to see if we get 401 instead of 500
    const response = await axios.get('http://localhost:3000/api/fleet/trucks', {
      timeout: 10000,
      validateStatus: function (status) {
        // Accept any status code to see what we get
        return true;
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', response.headers);
    
    if (response.status === 500) {
      console.error('❌ Still getting 500 Internal Server Error');
      console.error('❌ Response data:', response.data);
    } else if (response.status === 401) {
      console.log('✅ Good! Getting 401 Unauthorized (expected without auth token)');
      console.log('✅ This means the database relation issue is fixed');
    } else {
      console.log('📊 Unexpected status:', response.status);
      console.log('📊 Response data:', response.data);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running on port 3000');
      console.error('❌ Please start the backend server first');
    } else if (error.response) {
      console.error('❌ HTTP Error:', error.response.status);
      console.error('❌ Error data:', error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

testFleetAPI();