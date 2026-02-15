const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function checkBackendStatus() {
  console.log('🔍 Checking if Backend Was Restarted\n');
  console.log('============================================================\n');

  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'superadmin@urutix.com',
      password: 'SuperAdmin@123'
    });
    
    const token = loginResponse.data.accessToken;
    const headers = { 'Authorization': `Bearer ${token}` };

    // Test templates endpoint
    console.log('Testing templates endpoint...');
    try {
      const templatesResponse = await axios.get(`${BASE_URL}/api/admin/bulk-email/templates`, { headers });
      console.log('✅ Templates endpoint: WORKING');
      console.log(`   Found ${templatesResponse.data.data.length} templates\n`);
    } catch (error) {
      if (error.response?.data?.error?.includes('No metadata')) {
        console.log('❌ Templates endpoint: FAILED');
        console.log('   Error: No metadata for EmailTemplate\n');
      } else {
        console.log('❌ Templates endpoint: FAILED');
        console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
      }
    }

    // Test logs endpoint
    console.log('Testing logs endpoint...');
    try {
      const logsResponse = await axios.get(`${BASE_URL}/api/admin/bulk-email/logs`, { headers });
      console.log('✅ Logs endpoint: WORKING');
      console.log(`   Found ${logsResponse.data.data.length} logs\n`);
    } catch (error) {
      if (error.response?.data?.error?.includes('No metadata')) {
        console.log('❌ Logs endpoint: FAILED');
        console.log('   Error: No metadata for BulkEmailLog\n');
      } else {
        console.log('❌ Logs endpoint: FAILED');
        console.log(`   Error: ${error.response?.data?.error || error.message}\n`);
      }
    }

    console.log('============================================================');
    console.log('\n📊 DIAGNOSIS:\n');
    
    // Check if both failed with metadata error
    const templatesTest = await axios.get(`${BASE_URL}/api/admin/bulk-email/templates`, { headers }).catch(e => e);
    const logsTest = await axios.get(`${BASE_URL}/api/admin/bulk-email/logs`, { headers }).catch(e => e);
    
    const templatesHasMetadataError = templatesTest.response?.data?.error?.includes('No metadata');
    const logsHasMetadataError = logsTest.response?.data?.error?.includes('No metadata');
    
    if (templatesHasMetadataError || logsHasMetadataError) {
      console.log('❌ BACKEND HAS NOT BEEN RESTARTED YET\n');
      console.log('The backend is running but with OLD code.');
      console.log('TypeORM does not know about the new entities.\n');
      console.log('YOU MUST RESTART THE BACKEND:\n');
      console.log('1. Find the terminal where backend is running');
      console.log('2. Press Ctrl+C to stop it');
      console.log('3. Run: npm run build');
      console.log('4. Run: npm run start:prod');
      console.log('5. Wait for "Nest application successfully started"');
      console.log('6. Run this script again to verify\n');
    } else {
      console.log('✅ BACKEND WAS RESTARTED SUCCESSFULLY\n');
      console.log('All endpoints are working correctly.');
      console.log('You can now use the Bulk Email feature.\n');
    }

  } catch (error) {
    console.error('❌ Failed to check backend status');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend is not running at all!');
      console.error('   Start it with: npm run build && npm run start:prod\n');
    }
  }
}

checkBackendStatus();
