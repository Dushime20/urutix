const axios = require('axios');

// Test script for user creation with email setup
async function testUserCreationWithEmail() {
  console.log('🧪 Testing User Creation with Email Setup...\n');

  const baseURL = 'http://localhost:3000/api';
  
  // Test data
  const testTenantId = 'f31e73f2-2c65-4b6c-b6f1-f9d11550012d'; // Gasa tenant (active)
  const testUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe.test@example.com',
    role: 'TRUCK_OWNER',
    phone: '+1234567890'
  };

  try {
    console.log('📝 Creating user with the following data:');
    console.log(JSON.stringify(testUser, null, 2));
    console.log(`📍 Tenant ID: ${testTenantId}\n`);

    // Test user creation
    const response = await axios.post(
      `${baseURL}/users/tenant/${testTenantId}/user`,
      testUser,
      {
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': 'Bearer your-jwt-token'
        }
      }
    );

    console.log('✅ User creation successful!');
    console.log('📧 Response:', JSON.stringify(response.data, null, 2));
    
    // Check response structure
    if (response.data.success) {
      console.log('\n✅ Success flag: true');
    }
    
    if (response.data.message.includes('email')) {
      console.log('✅ Email notification mentioned in response');
    }
    
    if (response.data.data.status === 'PENDING_VERIFICATION') {
      console.log('✅ User status correctly set to PENDING_VERIFICATION');
    }

    console.log('\n📧 Expected email details:');
    console.log(`   To: ${testUser.email}`);
    console.log(`   Subject: Set up your UrutiX Driver Account Password`);
    console.log(`   Content: Welcome message with password setup link`);
    console.log(`   Link format: http://localhost:3001/driver/setup-password?token=...`);
    
    console.log('\n🎉 Test completed successfully!');
    console.log('📋 Next steps:');
    console.log('   1. Check email inbox for setup email');
    console.log('   2. Click the setup link in the email');
    console.log('   3. Set password on the setup page');
    console.log('   4. Verify login works with new password');

  } catch (error) {
    console.error('❌ Test failed!');
    
    if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📄 Response data:', JSON.stringify(error.response.data, null, 2));
      
      // Common error scenarios
      if (error.response.status === 404) {
        console.error('💡 Tip: Check if the tenant ID exists');
      } else if (error.response.status === 409) {
        console.error('💡 Tip: User might already exist with this email');
      } else if (error.response.status === 500) {
        console.error('💡 Tip: Check server logs for detailed error');
      }
    } else if (error.request) {
      console.error('📡 Network error - server not responding');
      console.error('💡 Tip: Make sure backend server is running on port 3000');
    } else {
      console.error('⚠️ Error:', error.message);
    }
  }
}

// Test email configuration
async function testEmailConfiguration() {
  console.log('\n📧 Testing Email Configuration...\n');
  
  const requiredEnvVars = [
    'SMTP_HOST',
    'SMTP_PORT', 
    'SMTP_USER',
    'SMTP_PASS',
    'FRONTEND_URL'
  ];

  console.log('🔍 Checking required environment variables:');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: SET`);
    } else {
      console.log(`❌ ${varName}: NOT SET`);
    }
  });

  console.log('\n📋 Email configuration checklist:');
  console.log('   □ SMTP_HOST (e.g., smtp.gmail.com)');
  console.log('   □ SMTP_PORT (587 for STARTTLS, 465 for SSL)');
  console.log('   □ SMTP_USER (your email address)');
  console.log('   □ SMTP_PASS (app password, not regular password)');
  console.log('   □ FRONTEND_URL (where users will set passwords)');
  console.log('   □ SMTP_FROM (optional, sender address)');
}

// Run tests
async function runTests() {
  console.log('🚀 User Creation Email Setup Test Suite\n');
  console.log('=' .repeat(50));
  
  // Test email configuration first
  await testEmailConfiguration();
  
  console.log('\n' + '=' .repeat(50));
  
  // Test user creation
  await testUserCreationWithEmail();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Test suite completed');
}

// Usage instructions
if (require.main === module) {
  console.log('📖 Usage Instructions:');
  console.log('1. Update testTenantId with a valid tenant ID');
  console.log('2. Update testUser.email with a real email address');
  console.log('3. Make sure backend server is running');
  console.log('4. Run: node test-user-creation-email.js\n');
  
  runTests();
}

module.exports = {
  testUserCreationWithEmail,
  testEmailConfiguration
};