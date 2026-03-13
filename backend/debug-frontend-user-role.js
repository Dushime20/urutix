const axios = require('axios');

async function debugFrontendUserRole() {
  console.log('🔍 Debugging Frontend User Role Issue...\n');

  try {
    // Test with the user that's likely logged in on frontend (admin2@urutix.com)
    console.log('1. Testing with admin2@urutix.com (likely frontend user)...');
    const loginResponse1 = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin2@urutix.com',
      password: 'Admin@123'
    });

    console.log('✅ Login successful for admin2@urutix.com');
    console.log('User role:', loginResponse1.data.user.role);
    console.log('User details:', JSON.stringify(loginResponse1.data.user, null, 2));

    // Try to access the bulk-email tenants endpoint
    console.log('\n2. Testing bulk-email tenants endpoint with admin2 token...');
    try {
      const tenantsResponse = await axios.get('http://localhost:3000/api/admin/bulk-email/tenants', {
        headers: {
          'Authorization': `Bearer ${loginResponse1.data.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Success! Response:', tenantsResponse.data);
    } catch (error) {
      console.log('❌ Failed with admin2@urutix.com');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }

    // Now test with actual SUPER_ADMIN
    console.log('\n3. Testing with admin@urutix.com (SUPER_ADMIN)...');
    const loginResponse2 = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@urutix.com',
      password: 'Admin@123'
    });

    console.log('✅ Login successful for admin@urutix.com');
    console.log('User role:', loginResponse2.data.user.role);

    const tenantsResponse2 = await axios.get('http://localhost:3000/api/admin/bulk-email/tenants', {
      headers: {
        'Authorization': `Bearer ${loginResponse2.data.accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Success with SUPER_ADMIN! Found', tenantsResponse2.data.data.length, 'tenants');

    console.log('\n🔧 SOLUTION:');
    console.log('The frontend user (admin2@urutix.com) has role "ADMIN" but the bulk-email endpoint requires "SUPER_ADMIN".');
    console.log('Options:');
    console.log('1. Change the endpoint to allow both ADMIN and SUPER_ADMIN roles');
    console.log('2. Login with admin@urutix.com instead');
    console.log('3. Upgrade admin2@urutix.com to SUPER_ADMIN role');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugFrontendUserRole();