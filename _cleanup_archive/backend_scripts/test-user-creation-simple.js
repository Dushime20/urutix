const axios = require('axios');

// Simple test for user creation with email setup
async function testUserCreation() {
  console.log('🧪 Testing User Creation with Email Setup...\n');

  const baseURL = 'http://localhost:3000/api';
  
  // Use Gasa tenant (active)
  const testTenantId = 'f31e73f2-2c65-4b6c-b6f1-f9d11550012d';
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user.email@example.com',
    role: 'TRUCK_OWNER',
    phone: '+1234567890'
  };

  try {
    console.log('📝 Creating user:');
    console.log(`   Name: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Tenant ID: ${testTenantId}\n`);

    const response = await axios.post(
      `${baseURL}/users/tenant/${testTenantId}/user`,
      testUser,
      {
        headers: {
          'Content-Type': 'application/json',
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
    console.log('📋 What should happen next:');
    console.log('   1. Check backend logs for email sending details');
    console.log('   2. If SMTP is configured, check email inbox');
    console.log('   3. User should receive password setup email');

  } catch (error) {
    console.error('❌ Test failed!');
    
    if (error.response) {
      console.error('📄 Status:', error.response.status);
      console.error('📄 Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 409) {
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

// Run the test
testUserCreation();