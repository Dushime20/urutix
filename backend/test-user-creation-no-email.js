const axios = require('axios');

async function testUserCreationNoEmail() {
  console.log('🧪 Testing User Creation without Email...\n');

  const baseURL = 'http://localhost:3000/api';
  const testTenantId = 'f31e73f2-2c65-4b6c-b6f1-f9d11550012d'; // Gasa tenant

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@urutix.com',
      password: 'Admin@123'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');

    // Step 2: Create user with email disabled
    console.log('\n2. Creating user with email disabled...');
    const testUser = {
      firstName: 'NoEmail',
      lastName: 'Test',
      email: 'noemail.test@example.com',
      role: 'TRUCK_OWNER',
      phone: '+1234567890',
      sendPasswordSetupEmail: false // Disable email sending
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

    console.log('\n🎉 Test completed successfully!');
    console.log('📋 This confirms user creation works when email is disabled');

  } catch (error) {
    console.error('❌ Test failed!');
    
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('⚠️ Error:', error.message);
    }
  }
}

testUserCreationNoEmail();