const axios = require('axios');

async function debugUserCreation() {
  console.log('🔍 Debugging User Creation Endpoint...\n');

  const baseURL = 'http://localhost:3000/api';
  const testTenantId = 'f31e73f2-2c65-4b6c-b6f1-f9d11550012d';

  try {
    // First, test if the tenant exists
    console.log('1. Testing tenant existence...');
    const tenantResponse = await axios.get(`${baseURL}/tenants/${testTenantId}`);
    console.log('✅ Tenant exists:', tenantResponse.data?.name || 'Unknown');

    // Test with minimal data first
    console.log('\n2. Testing user creation with minimal data...');
    const minimalUser = {
      firstName: 'Debug',
      lastName: 'Test',
      email: 'debug.test@example.com',
      role: 'TRUCK_OWNER'
    };

    const response = await axios.post(
      `${baseURL}/users/tenant/${testTenantId}/user`,
      minimalUser,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('✅ User creation successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Debug failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Request timeout or network error');
      console.error('Request details:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\n🔍 Debugging suggestions:');
    console.error('1. Check if backend is running: curl http://localhost:3000/api/health');
    console.error('2. Check backend logs for detailed error messages');
    console.error('3. Verify database connection');
    console.error('4. Check if all required entities/tables exist');
  }
}

debugUserCreation();