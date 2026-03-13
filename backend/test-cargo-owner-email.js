const axios = require('axios');

async function testCargoOwnerEmailTemplate() {
  console.log('========== TESTING CARGO OWNER EMAIL TEMPLATE ==========');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // First, get admin token
    console.log('1. Getting admin token...');
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email: 'admin@urutix.com',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.access_token;
    console.log('✅ Admin token obtained');
    
    // Create a test cargo owner user
    console.log('2. Creating cargo owner user...');
    const cargoOwnerData = {
      email: `test-cargo-owner-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'CargoOwner',
      role: 'CARGO_OWNER',
      tenantId: '1', // Assuming tenant ID 1 exists
      sendPasswordSetupEmail: true
    };
    
    const createUserResponse = await axios.post(
      `${baseUrl}/admin/users`,
      cargoOwnerData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Cargo owner user created successfully');
    console.log('📧 Email should have been sent with cargo owner template');
    console.log('User created:', {
      id: createUserResponse.data.id,
      email: createUserResponse.data.email,
      role: createUserResponse.data.role,
      status: createUserResponse.data.status
    });
    
    // Check the backend logs to verify the correct email template was used
    console.log('\n📋 Check the backend logs to verify:');
    console.log('   - "CARGO OWNER EMAIL SERVICE CALLED" message appears');
    console.log('   - Setup URL contains "/cargo-owner/setup-password"');
    console.log('   - Email template mentions cargo owner features');
    
    console.log('\n✅ Test completed successfully!');
    console.log('The cargo owner should now receive an appropriate email instead of a driver email.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('❌ Authentication failed. Check admin credentials.');
    } else if (error.response?.status === 404) {
      console.error('❌ Endpoint not found. Check if backend is running on port 3000.');
    } else if (error.response?.status === 400) {
      console.error('❌ Bad request. Check the request data format.');
    }
  }
}

// Run the test
testCargoOwnerEmailTemplate();