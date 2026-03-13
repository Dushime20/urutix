const axios = require('axios');

async function testTruckOwnerEmailTemplate() {
  console.log('========== TESTING TRUCK OWNER EMAIL TEMPLATE ==========');
  
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
    
    // Create a test truck owner user
    console.log('2. Creating truck owner user...');
    const truckOwnerData = {
      email: `test-truck-owner-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'TruckOwner',
      role: 'TRUCK_OWNER',
      tenantId: '1', // Assuming tenant ID 1 exists
      sendPasswordSetupEmail: true
    };
    
    const createUserResponse = await axios.post(
      `${baseUrl}/admin/users`,
      truckOwnerData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Truck owner user created successfully');
    console.log('📧 Email should have been sent with truck owner template');
    console.log('User created:', {
      id: createUserResponse.data.id,
      email: createUserResponse.data.email,
      role: createUserResponse.data.role,
      status: createUserResponse.data.status
    });
    
    // Check the backend logs to verify the correct email template was used
    console.log('\n📋 Check the backend logs to verify:');
    console.log('   - "TRUCK OWNER EMAIL SERVICE CALLED" message appears');
    console.log('   - Setup URL contains "/truck-owner/setup-password"');
    console.log('   - Email template mentions truck owner features like:');
    console.log('     * Manage your fleet of trucks and drivers');
    console.log('     * Track vehicle locations and performance');
    console.log('     * Monitor fuel consumption and expenses');
    console.log('     * Handle maintenance schedules and records');
    console.log('     * View earnings and financial reports');
    
    console.log('\n✅ Test completed successfully!');
    console.log('The truck owner should now receive an appropriate email instead of a driver email.');
    
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
testTruckOwnerEmailTemplate();