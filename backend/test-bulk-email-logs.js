const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testBulkEmailLogs() {
  try {
    console.log('Testing bulk email logs endpoint...\n');

    // First, login as super admin
    console.log('1. Logging in as super admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@urutix.com',
      password: 'Admin@123456',
    });

    const token = loginResponse.data.access_token;
    console.log('✓ Login successful\n');

    // Test getting bulk email logs
    console.log('2. Fetching bulk email logs...');
    const logsResponse = await axios.get(`${BASE_URL}/admin/bulk-email/logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✓ Logs fetched successfully');
    console.log(`Found ${logsResponse.data.data.length} logs\n`);
    
    if (logsResponse.data.data.length > 0) {
      console.log('Sample log:');
      console.log(JSON.stringify(logsResponse.data.data[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testBulkEmailLogs();
