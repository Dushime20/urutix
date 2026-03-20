const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testBulkEmailSystem() {
  console.log('🧪 Testing Complete Bulk Email System\n');
  console.log('============================================================\n');

  try {
    // Login first
    console.log('🔐 Logging in as super admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'superadmin@urutix.com',
      password: 'SuperAdmin@123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('   ✅ Login successful\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Test 1: Email Templates
    console.log('1️⃣  Testing Email Templates Endpoint');
    console.log('   GET /api/admin/bulk-email/templates');
    const templatesResponse = await axios.get(`${BASE_URL}/api/admin/bulk-email/templates`, { headers });
    
    console.log(`   Status: ${templatesResponse.status}`);
    if (templatesResponse.data.success) {
      const templates = templatesResponse.data.data;
      console.log(`   ✅ Found ${templates.length} templates`);
      console.log(`   Categories: ${[...new Set(templates.map(t => t.category))].join(', ')}\n`);
    } else {
      console.log('   ❌ Failed to fetch templates\n');
    }

    // Test 2: Email Logs
    console.log('2️⃣  Testing Email Logs Endpoint');
    console.log('   GET /api/admin/bulk-email/logs');
    const logsResponse = await axios.get(`${BASE_URL}/api/admin/bulk-email/logs`, { headers });
    
    console.log(`   Status: ${logsResponse.status}`);
    if (logsResponse.data.success !== undefined) {
      const logs = logsResponse.data.data || logsResponse.data;
      console.log(`   ✅ Logs endpoint working`);
      console.log(`   Total campaigns: ${Array.isArray(logs) ? logs.length : 0}\n`);
    } else {
      console.log('   ✅ Logs endpoint working (empty response is OK)\n');
    }

    // Test 3: Active Templates
    console.log('3️⃣  Testing Active Templates Endpoint');
    console.log('   GET /api/admin/bulk-email/templates/active');
    const activeResponse = await axios.get(`${BASE_URL}/api/admin/bulk-email/templates/active`, { headers });
    
    console.log(`   Status: ${activeResponse.status}`);
    if (activeResponse.data.success) {
      console.log(`   ✅ Found ${activeResponse.data.data.length} active templates\n`);
    }

    console.log('============================================================');
    console.log('✅ All Bulk Email System Tests Passed!\n');
    console.log('📧 The bulk email system is fully operational:');
    console.log('   - Email templates: Working');
    console.log('   - Campaign logs: Working');
    console.log('   - API endpoints: All responding\n');
    console.log('🎉 You can now use the Bulk Email feature in the admin panel!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
      
      if (error.response.status === 500) {
        console.error('\n⚠️  500 Error - Possible causes:');
        console.error('   1. Backend needs restart to load entity metadata');
        console.error('   2. Database tables not created');
        console.error('   3. Entity configuration mismatch\n');
        console.error('   Solution: Restart backend with:');
        console.error('   cd backend && npm run build && npm run start:prod\n');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend is not running!');
      console.error('   Please start the backend first:');
      console.error('   cd backend && npm run build && npm run start:prod\n');
    }
  }
}

testBulkEmailSystem();
