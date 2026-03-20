const axios = require('axios');

async function testBulkEmailTenants() {
  console.log('🧪 Testing Bulk Email Tenants Endpoint...\n');

  try {
    // First, login as super admin
    console.log('1. Logging in as super admin...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@urutix.com',
      password: 'Admin@123'
    });

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (!loginResponse.data.accessToken) {
      throw new Error(`Login failed: No access token received`);
    }

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');

    // Test the bulk-email tenants endpoint
    console.log('\n2. Testing /admin/bulk-email/tenants endpoint...');
    const tenantsResponse = await axios.get('http://localhost:3000/api/admin/bulk-email/tenants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API Response Status:', tenantsResponse.status);
    console.log('✅ API Response Data:', JSON.stringify(tenantsResponse.data, null, 2));

    if (tenantsResponse.data.success) {
      const tenants = tenantsResponse.data.data || [];
      console.log(`\n📊 Found ${tenants.length} tenants:`);
      tenants.forEach((tenant, index) => {
        console.log(`   ${index + 1}. ${tenant.name} (${tenant.status}) - ${tenant.subdomain || 'no subdomain'}`);
      });
    } else {
      console.log('❌ API returned success: false');
      console.log('Error message:', tenantsResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBulkEmailTenants();