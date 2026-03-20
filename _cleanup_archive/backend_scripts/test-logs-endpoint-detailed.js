const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLogsEndpoint() {
  console.log('🧪 Testing Bulk Email Logs Endpoint (Detailed)\n');
  console.log('============================================================\n');

  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'superadmin@urutix.com',
      password: 'SuperAdmin@123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('   ✅ Login successful\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Test logs endpoint
    console.log('📋 Testing GET /api/admin/bulk-email/logs\n');
    const logsResponse = await axios.get(`${BASE_URL}/api/admin/bulk-email/logs`, { headers });
    
    console.log(`✅ Status: ${logsResponse.status}`);
    console.log(`✅ Response:`, JSON.stringify(logsResponse.data, null, 2));
    console.log('\n✅ Logs endpoint is working!\n');

  } catch (error) {
    console.error('❌ Test failed!\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data.error) {
        console.error('\n🔍 Detailed Error:', error.response.data.error);
        
        if (error.response.data.error.includes('No metadata')) {
          console.error('\n⚠️  ISSUE: Entity metadata not loaded');
          console.error('   This means the backend has NOT been restarted yet.\n');
          console.error('   SOLUTION:');
          console.error('   1. Find the terminal where backend is running');
          console.error('   2. Press Ctrl+C to stop it');
          console.error('   3. Run: npm run build');
          console.error('   4. Run: npm run start:prod');
          console.error('   5. Wait for "Nest application successfully started"');
          console.error('   6. Run this test again\n');
        } else if (error.response.data.error.includes('relation') || error.response.data.error.includes('table')) {
          console.error('\n⚠️  ISSUE: Database table issue');
          console.error('   Run: node check-bulk-email-logs.js');
          console.error('   to verify the table exists\n');
        } else {
          console.error('\n⚠️  ISSUE: Unknown error');
          console.error('   Check backend logs for more details\n');
        }
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend is not running!');
      console.error('   Start it with: npm run build && npm run start:prod\n');
    } else {
      console.error('\nError:', error.message);
    }
  }
}

testLogsEndpoint();
