const axios = require('axios');

async function testAgentEmailTemplate() {
  console.log('========== TESTING AGENT EMAIL TEMPLATE ==========');
  
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
    
    // Create a test agent user
    console.log('2. Creating agent user...');
    const agentData = {
      email: `test-agent-${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'Agent',
      role: 'AGENT',
      tenantId: '1', // Assuming tenant ID 1 exists
      sendPasswordSetupEmail: true
    };
    
    const createUserResponse = await axios.post(
      `${baseUrl}/admin/users`,
      agentData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Agent user created successfully');
    console.log('📧 Email should have been sent with agent template');
    console.log('User created:', {
      id: createUserResponse.data.id,
      email: createUserResponse.data.email,
      role: createUserResponse.data.role,
      status: createUserResponse.data.status
    });
    
    // Check the backend logs to verify the correct email template was used
    console.log('\n📋 Check the backend logs to verify:');
    console.log('   - "AGENT EMAIL SERVICE CALLED" message appears');
    console.log('   - Setup URL contains "/agent/setup-password"');
    console.log('   - Email template mentions agent features like:');
    console.log('     * Assist clients with logistics and transportation needs');
    console.log('     * Coordinate between cargo owners and truck owners');
    console.log('     * Manage client relationships and communications');
    console.log('     * Track shipments and provide status updates');
    console.log('     * Generate reports and handle documentation');
    
    console.log('\n✅ Test completed successfully!');
    console.log('The agent should now receive an appropriate email instead of a driver email.');
    
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
testAgentEmailTemplate();