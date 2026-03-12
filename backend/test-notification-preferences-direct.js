const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_CREDENTIALS = {
  email: 'deborahrutagengwa.admin@urutix.com',
  password: 'password123'
};

async function testNotificationPreferences() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');
    
    console.log('\n📋 Testing GET /notification-preferences...');
    try {
      const response = await axios.get(`${BASE_URL}/notification-preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Success!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log('❌ Error occurred:');
      console.log('Status:', error.response?.status);
      console.log('Status Text:', error.response?.statusText);
      console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
      
      if (error.response?.data?.message) {
        console.log('Error Message:', error.response.data.message);
      }
    }
    
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}

testNotificationPreferences();