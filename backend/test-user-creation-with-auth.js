const axios = require('axios');

async function testUserCreationWithAuth() {
  console.log('🔐 Testing User Creation with Authentication...\n');

  const baseURL = 'http://localhost:3000/api';
  const testTenantId = 'f31e73f2-2c65-4b6c-b6f1-f9d11550012d'; // Gasa tenant

  try {
    // Step 1: Login as admin to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@urutix.com',
      password: 'Admin@123'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login successful, got token');

    // Step 2: Create user with auth token
    console.log('\n2. Creating user with auth token...');
    const testUser = {
      firstName: 'Auth',
      lastName: 'Test',
      email: 'auth.test@example.com',
      role: 'TRUCK_OWNER',
      phone: '+1234567890'
    };

    const response = await axios.post(
      `${baseURL}/users/tenant/${testTenantId}/user`,
      testUser,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ User creation successful!');
    console.log('📧 Response:', JSON.stringify(response.data, null, 2));
    
    // Validate response
    if (response.data.success) {
      console.log('\n✅ Success: User created successfully');
    }
    
    if (response.data.message && response.data.message.includes('email')) {
      console.log('✅ Success: Email notification mentioned');
    }
    
    if (response.data.data && response.data.data.status === 'PENDING_VERIFICATION') {
      console.log('✅ Success: User status is PENDING_VERIFICATION');
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Check backend logs for email sending details');
    console.log('   2. If SMTP is configured, check email inbox');
    console.log('   3. User should receive password setup email');

  } catch (error) {
    console.error('❌ Test failed!');
    
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('💡 Authentication failed - check admin credentials');
      } else if (error.response.status === 409) {
        console.error('💡 User might already exist - try different email');
      } else if (error.response.status === 500) {
        console.error('💡 Server error - check backend logs');
      }
    } else if (error.request) {
      console.error('📡 Network error - backend not responding');
    } else {
      console.error('⚠️ Error:', error.message);
    }
  }
}

testUserCreationWithAuth();