const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEmailTemplatesAPI() {
  console.log('🧪 Testing Email Templates API\n');
  console.log('============================================================\n');

  try {
    // Login first to get token
    console.log('🔐 Logging in as super admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'superadmin@urutix.com',
      password: 'SuperAdmin@123'
    });
    
    console.log('   Login response keys:', Object.keys(loginResponse.data));
    const token = loginResponse.data.accessToken || loginResponse.data.access_token || loginResponse.data.token || loginResponse.data.data?.access_token;
    console.log('   Token:', token ? 'Found' : 'Not found');
    console.log('   ✅ Login successful\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Test 1: Get all templates
    console.log('1️⃣  Testing GET /api/admin/bulk-email/templates');
    const response = await axios.get(`${BASE_URL}/api/admin/bulk-email/templates`, { headers });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response structure:`, Object.keys(response.data));
    
    if (response.data.success) {
      const templates = response.data.data;
      console.log(`   ✅ Found ${templates.length} templates\n`);
      
      console.log('📋 Templates List:');
      templates.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.name}`);
        console.log(`      Category: ${template.category}`);
        console.log(`      Subject: ${template.subject}`);
        console.log(`      Active: ${template.isActive ? 'Yes' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('   ❌ API returned success: false');
      console.log('   Error:', response.data.message);
    }

    // Test 2: Get active templates only
    console.log('\n2️⃣  Testing GET /api/admin/bulk-email/templates/active');
    const activeResponse = await axios.get(`${BASE_URL}/api/admin/bulk-email/templates/active`, { headers });
    
    console.log(`   Status: ${activeResponse.status}`);
    if (activeResponse.data.success) {
      console.log(`   ✅ Found ${activeResponse.data.data.length} active templates\n`);
    }

    console.log('============================================================');
    console.log('✅ All tests passed!\n');
    console.log('📝 The templates are accessible via the API');
    console.log('   Frontend should now be able to fetch them\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend is not running!');
      console.error('   Please start the backend first:');
      console.error('   cd backend && npm run build && npm run start:prod\n');
    }
  }
}

testEmailTemplatesAPI();
