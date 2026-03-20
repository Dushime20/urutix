const axios = require('axios');

async function testMinimalUser() {
  console.log('🧪 Testing Minimal User Creation...\n');

  const baseURL = 'http://localhost:3000/api';
  const testTenantId = 'f31e73f2-2c65-4b6c-b6f1-f9d11550012d';

  try {
    // Login first
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@urutix.com',
      password: 'Admin@123'
    });
    const token = loginResponse.data.access_token;

    // Test with absolute minimum data
    const minimalUser = {
      firstName: 'Min',
      lastName: 'Test',
      email: 'minimal.test@example.com',
      role: 'TRUCK_OWNER',
      sendPasswordSetupEmail: false
    };

    console.log('Creating minimal user:', minimalUser);

    const response = await axios.post(
      `${baseURL}/users/tenant/${testTenantId}/user`,
      minimalUser,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000
      }
    );

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      // Try to get more details from headers
      if (error.response.headers) {
        console.error('Headers:', error.response.headers);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testMinimalUser();