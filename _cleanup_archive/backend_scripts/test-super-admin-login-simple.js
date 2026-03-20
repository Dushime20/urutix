const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testSuperAdminLogin() {
  try {
    console.log('🔐 Testing Super Admin Login...\n');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@urutix.com',
      password: 'Admin@123'
    });
    
    if (response.data.accessToken) {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('');
      console.log('🔑 Verified Credentials:');
      console.log('   📧 Email: superadmin@urutix.com');
      console.log('   🔑 Password: Admin@123');
      console.log('   👤 Role:', response.data.user.role);
      console.log('   🏢 Tenant:', response.data.user.tenantName || 'System');
      console.log('   🆔 User ID:', response.data.user.id);
      console.log('');
      console.log('🎫 Access Token:', response.data.accessToken.substring(0, 30) + '...');
      console.log('');
      console.log('🌐 You can now login at: http://localhost:3001/login');
      console.log('');
      console.log('🎯 Super Admin Features Available:');
      console.log('   • System Health Dashboard');
      console.log('   • Tenant Management');
      console.log('   • Security Center');
      console.log('   • User Management');
      console.log('   • Activity Logs');
      console.log('   • Credit System Management');
      console.log('   • Subscription System');
      console.log('   • All Admin Features');
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
  }
}

testSuperAdminLogin();