const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const ADMIN_ACCOUNTS = [
  'superadmin@urutix.com',
  'admin@urutix.com', 
  'admin@test.com',
  'admin2@urutix.com'
];

async function testAllAdminLogins() {
  console.log('🔐 Testing All Admin Account Logins...\n');
  
  for (const email of ADMIN_ACCOUNTS) {
    console.log(`📧 Testing: ${email}`);
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: email,
        password: 'Admin@123'
      });
      
      if (response.data.accessToken) {
        console.log('✅ SUCCESS!');
        console.log('   Role:', response.data.user.role);
        console.log('   Tenant:', response.data.user.tenantName || 'N/A');
        console.log('   Token:', response.data.accessToken.substring(0, 20) + '...');
        console.log('');
        
        // This one works, let's use it
        console.log('🎯 WORKING CREDENTIALS FOUND:');
        console.log(`   📧 Email: ${email}`);
        console.log('   🔑 Password: Admin@123');
        console.log('   🌐 Login URL: http://localhost:3001/login');
        break;
      }
      
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.message || error.message);
    }
    
    console.log('');
  }
}

testAllAdminLogins();