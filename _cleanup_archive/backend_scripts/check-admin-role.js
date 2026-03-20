const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function checkUserRole() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin2@urutix.com',
      password: 'Admin@123'
    });
    
    console.log('✅ Login successful!');
    console.log('👤 User Role:', response.data.user.role);
    console.log('📧 Email:', response.data.user.email);
    console.log('🏢 Tenant:', response.data.user.tenantName);
    console.log('🆔 User ID:', response.data.user.id);
    console.log('\n📋 Full User Details:');
    console.log(JSON.stringify(response.data.user, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkUserRole();