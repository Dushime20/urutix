const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test credentials - using tenant admin
const testCredentials = {
  email: 'admin2@urutix.com',
  password: 'Admin@123'
};

async function testTenantCommunication() {
  try {
    console.log('🔐 Logging in as tenant admin...');
    
    // Login to get token
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, testCredentials);
    const token = loginRes.data.token;
    
    if (!token) {
      throw new Error('No token received from login');
    }
    
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test 1: Get available partners
    console.log('\n📋 Testing GET /tenant-dashboard/communicate/partners...');
    try {
      const partnersRes = await axios.get(`${BASE_URL}/tenant-dashboard/communicate/partners`, { headers });
      console.log('✅ Partners endpoint successful');
      console.log('📊 Partners data:', JSON.stringify(partnersRes.data, null, 2));
    } catch (error) {
      console.log('❌ Partners endpoint failed:', error.response?.data || error.message);
    }

    // Test 2: Get communication logs
    console.log('\n📋 Testing GET /tenant-dashboard/communicate/logs...');
    try {
      const logsRes = await axios.get(`${BASE_URL}/tenant-dashboard/communicate/logs`, { headers });
      console.log('✅ Logs endpoint successful');
      console.log('📊 Logs count:', logsRes.data.data?.length || 0);
    } catch (error) {
      console.log('❌ Logs endpoint failed:', error.response?.data || error.message);
    }

    // Test 3: Get templates
    console.log('\n📋 Testing GET /tenant-dashboard/communicate/templates...');
    try {
      const templatesRes = await axios.get(`${BASE_URL}/tenant-dashboard/communicate/templates`, { headers });
      console.log('✅ Templates endpoint successful');
      console.log('📊 Templates count:', templatesRes.data.data?.length || 0);
    } catch (error) {
      console.log('❌ Templates endpoint failed:', error.response?.data || error.message);
    }

    // Test 4: Send test communication (if partners exist)
    console.log('\n📋 Testing POST /tenant-dashboard/communicate/send...');
    try {
      const testMessage = {
        channels: ['in_app'],
        subject: 'Test Communication from Tenant Admin',
        message: 'This is a test message to verify the communication system is working.',
        filters: {
          roles: ['TRUCK_OWNER'] // Test with truck owners if they exist
        }
      };

      const sendRes = await axios.post(`${BASE_URL}/tenant-dashboard/communicate/send`, testMessage, { headers });
      console.log('✅ Send endpoint successful');
      console.log('📊 Send result:', JSON.stringify(sendRes.data, null, 2));
    } catch (error) {
      console.log('❌ Send endpoint failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testTenantCommunication();