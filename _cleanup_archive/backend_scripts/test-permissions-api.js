const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testPermissionsAPI() {
  console.log('🧪 Testing Admin Permissions API Endpoints...\n');
  
  try {
    // First login to get token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin2@urutix.com',
      password: 'Admin@123'
    });
    
    const token = loginResponse.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Authentication: SUCCESS');
    console.log('   👤 User:', loginResponse.data.user.email);
    console.log('   👑 Role:', loginResponse.data.user.role);
    console.log('');
    
    // Test 1: List all permissions
    try {
      const permissionsResponse = await axios.get(`${BASE_URL}/admin/permissions/list`, { headers });
      console.log('✅ GET /admin/permissions/list: SUCCESS');
      console.log('   📋 Permissions found:', permissionsResponse.data.length);
      if (permissionsResponse.data.length > 0) {
        console.log('   📝 Sample permission:', permissionsResponse.data[0]);
      }
    } catch (error) {
      console.log('❌ GET /admin/permissions/list: FAILED');
      console.log('   Error:', error.response?.data?.message || error.message);
    }
    
    console.log('');
    
    // Test 2: Get all roles
    try {
      const rolesResponse = await axios.get(`${BASE_URL}/admin/permissions/roles`, { headers });
      console.log('✅ GET /admin/permissions/roles: SUCCESS');
      console.log('   👥 Roles found:', rolesResponse.data?.data?.length || 0);
      if (rolesResponse.data?.data?.length > 0) {
        console.log('   📝 Sample role:', rolesResponse.data.data[0]);
      }
    } catch (error) {
      console.log('❌ GET /admin/permissions/roles: FAILED');
      console.log('   Error:', error.response?.data?.message || error.message);
    }
    
    console.log('');
    
    // Test 3: Get permission matrix
    try {
      const matrixResponse = await axios.get(`${BASE_URL}/admin/permissions/roles/matrix`, { headers });
      console.log('✅ GET /admin/permissions/roles/matrix: SUCCESS');
      console.log('   🔢 Matrix roles:', matrixResponse.data?.roles?.length || 0);
      console.log('   🔢 Matrix permissions:', matrixResponse.data?.permissions?.length || 0);
      console.log('   🔢 Matrix data:', matrixResponse.data?.matrix?.length || 0);
    } catch (error) {
      console.log('❌ GET /admin/permissions/roles/matrix: FAILED');
      console.log('   Error:', error.response?.data?.message || error.message);
    }
    
    console.log('');
    
    // Test 4: Check if permissions are seeded
    try {
      const permissionsResponse = await axios.get(`${BASE_URL}/admin/permissions/list`, { headers });
      const permissions = permissionsResponse.data;
      
      if (permissions.length === 0) {
        console.log('⚠️  No permissions found in database');
        console.log('   💡 Suggestion: Run permission seeding script');
      } else {
        console.log('✅ Permissions are seeded in database');
        
        // Group by category
        const categories = {};
        permissions.forEach(p => {
          if (!categories[p.category]) categories[p.category] = 0;
          categories[p.category]++;
        });
        
        console.log('   📊 Permission categories:');
        Object.entries(categories).forEach(([category, count]) => {
          console.log(`      - ${category}: ${count} permissions`);
        });
      }
    } catch (error) {
      console.log('❌ Permission seeding check: FAILED');
    }
    
    console.log('\n🎉 Permissions API Test Complete!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testPermissionsAPI();