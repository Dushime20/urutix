const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Super admin credentials to test
const SUPER_ADMIN_CREDENTIALS = [
  {
    email: 'superadmin@urutix.com',
    role: 'SUPER_ADMIN',
    tenant: 'System'
  },
  {
    email: 'admin@urutix.com', 
    role: 'SUPER_ADMIN',
    tenant: 'Gasa'
  },
  {
    email: 'admin@test.com',
    role: 'ADMIN', 
    tenant: 'Gasa'
  }
];

// Common passwords to try
const COMMON_PASSWORDS = [
  'Admin@123',
  'admin123', 
  'password',
  'Admin123!',
  'test123',
  'password123',
  'admin',
  'superadmin'
];

async function testSuperAdminLogin() {
  console.log('🔐 Testing Super Admin Login Credentials...\n');
  
  for (const admin of SUPER_ADMIN_CREDENTIALS) {
    console.log(`📧 Testing: ${admin.email} (${admin.role})`);
    
    let loginSuccessful = false;
    
    for (const password of COMMON_PASSWORDS) {
      try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
          email: admin.email,
          password: password
        });
        
        if (response.data.accessToken) {
          console.log(`✅ SUCCESS! Login credentials found:`);
          console.log(`   📧 Email: ${admin.email}`);
          console.log(`   🔑 Password: ${password}`);
          console.log(`   👤 Role: ${response.data.user.role}`);
          console.log(`   🏢 Tenant: ${response.data.user.tenantName || 'N/A'}`);
          console.log(`   🆔 User ID: ${response.data.user.id}`);
          console.log(`   🎫 Token: ${response.data.accessToken.substring(0, 20)}...`);
          console.log('');
          loginSuccessful = true;
          break;
        }
      } catch (error) {
        // Continue trying other passwords
        continue;
      }
    }
    
    if (!loginSuccessful) {
      console.log(`❌ Could not find working password for ${admin.email}`);
      console.log('   Try the password reset flow or manual database update');
      console.log('');
    }
  }
  
  console.log('🔍 Login test complete!');
  console.log('\n💡 If no passwords worked, you may need to:');
  console.log('   1. Use the forgot password feature');
  console.log('   2. Reset password via database (development only)');
  console.log('   3. Check if there are other common passwords');
}

testSuperAdminLogin().catch(console.error);