const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_CREDENTIALS = {
  email: 'deborahrutagengwa.admin@urutix.com',
  password: 'password123'
};

async function debugNotificationPreferences() {
  try {
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    const token = loginResponse.data.accessToken;
    const user = loginResponse.data.user;
    console.log('✅ Login successful');
    console.log('User info:', {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    });
    
    // Test other endpoints that work
    console.log('\n📋 Testing working endpoint first...');
    try {
      const balanceResponse = await axios.get(`${BASE_URL}/credits/balance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Credits balance works:', balanceResponse.data.data.currentBalance);
    } catch (error) {
      console.log('❌ Credits balance failed:', error.response?.data?.message);
    }
    
    // Test notification preferences POST (which works)
    console.log('\n📋 Testing POST /notification-preferences (which works)...');
    try {
      const postResponse = await axios.post(`${BASE_URL}/notification-preferences`, {
        preferences: [
          {
            notificationType: 'LOW_BALANCE',
            enabledChannels: ['EMAIL', 'IN_APP'],
            isEnabled: true,
            settings: { frequency: 'IMMEDIATE' }
          }
        ]
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ POST works:', postResponse.data.success);
    } catch (error) {
      console.log('❌ POST failed:', error.response?.data?.message);
    }
    
    // Now test the problematic GET endpoint
    console.log('\n📋 Testing GET /notification-preferences (problematic)...');
    try {
      const getResponse = await axios.get(`${BASE_URL}/notification-preferences`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ GET works:', getResponse.data);
    } catch (error) {
      console.log('❌ GET failed:');
      console.log('Status:', error.response?.status);
      console.log('Data:', error.response?.data);
      
      // Let's try to get more details by checking if it's a specific error
      if (error.response?.status === 500) {
        console.log('\n🔍 This is a 500 error - likely a database or service issue');
        console.log('Let\'s check if the table has the right data...');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

debugNotificationPreferences();