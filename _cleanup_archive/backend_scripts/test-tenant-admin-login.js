const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testTenantAdmin() {
  console.log('🔐 Testing Tenant Admin Login...\n');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'deborahrutagengwa.admin@urutix.com',
      password: 'password123'
    });
    
    if (response.data.accessToken) {
      console.log('✅ TENANT ADMIN LOGIN SUCCESS!');
      console.log('   📧 Email: deborahrutagengwa.admin@urutix.com');
      console.log('   👤 Role:', response.data.user.role);
      console.log('   🏢 Tenant:', response.data.user.tenantName || 'N/A');
      console.log('   🔑 Token:', response.data.accessToken.substring(0, 20) + '...');
      console.log('   🌐 Login URL: http://localhost:5174/login');
    }
    
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

testTenantAdmin();