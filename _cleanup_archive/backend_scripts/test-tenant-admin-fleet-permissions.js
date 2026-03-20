const axios = require('axios');

async function testTenantAdminFleetPermissions() {
  try {
    console.log('🧪 Testing Tenant Admin Fleet Permissions...');
    
    // Test 1: Try to create a truck without auth (should get 401)
    console.log('\n1. Testing truck creation without auth...');
    const noAuthResponse = await axios.post('http://localhost:3000/api/fleet/trucks', {
      plateNumber: 'TEST-123',
      vin: '1HGBH41JXMN109186',
      make: 'Toyota',
      model: 'Hiace',
      year: 2023,
      truckType: 'VAN'
    }, {
      timeout: 10000,
      validateStatus: function (status) {
        return true; // Accept any status
      }
    });
    
    console.log('   Status:', noAuthResponse.status);
    if (noAuthResponse.status === 401) {
      console.log('   ✅ Correctly returns 401 Unauthorized without token');
    } else {
      console.log('   ❌ Expected 401, got:', noAuthResponse.status);
    }
    
    // Test 2: Try to login as tenant admin
    console.log('\n2. Testing tenant admin login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@tenant1.com', // Adjust to actual tenant admin email
      password: 'password123'     // Adjust to actual password
    }, {
      timeout: 10000,
      validateStatus: function (status) {
        return true;
      }
    });
    
    console.log('   Login Status:', loginResponse.status);
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('   ✅ Tenant admin login successful');
      
      // Test 3: Try to create truck with tenant admin token
      console.log('\n3. Testing truck creation with tenant admin token...');
      const createTruckResponse = await axios.post('http://localhost:3000/api/fleet/trucks', {
        plateNumber: 'ADMIN-001',
        vin: '1HGBH41JXMN109187',
        make: 'Toyota',
        model: 'Hiace',
        year: 2023,
        truckType: 'VAN',
        capacityWeight: 1000,
        capacityVolume: 10
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: function (status) {
          return true;
        }
      });
      
      console.log('   Create Truck Status:', createTruckResponse.status);
      
      if (createTruckResponse.status === 201) {
        console.log('   ✅ Tenant admin can create trucks!');
        console.log('   ✅ Truck created:', createTruckResponse.data.truck?.plateNumber);
      } else if (createTruckResponse.status === 403) {
        console.log('   ❌ Still getting 403 Forbidden - permissions not working');
        console.log('   ❌ Response:', createTruckResponse.data);
      } else {
        console.log('   📊 Status:', createTruckResponse.status);
        console.log('   📊 Response:', createTruckResponse.data);
      }
      
      // Test 4: Try to get trucks list
      console.log('\n4. Testing trucks list with tenant admin token...');
      const getTrucksResponse = await axios.get('http://localhost:3000/api/fleet/trucks', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000,
        validateStatus: function (status) {
          return true;
        }
      });
      
      console.log('   Get Trucks Status:', getTrucksResponse.status);
      
      if (getTrucksResponse.status === 200) {
        console.log('   ✅ Tenant admin can view trucks!');
        console.log('   📊 Number of trucks:', getTrucksResponse.data.trucks?.length || 0);
      } else {
        console.log('   📊 Status:', getTrucksResponse.status);
        console.log('   📊 Response:', getTrucksResponse.data);
      }
      
    } else {
      console.log('   ⚠️ Tenant admin login failed');
      console.log('   📊 Response:', loginResponse.data);
      console.log('   ℹ️ You may need to adjust the email/password or create a tenant admin user');
    }
    
    console.log('\n🎯 Summary:');
    console.log('   - Fleet permissions have been updated to include TENANT_ADMIN');
    console.log('   - Tenant admins should now be able to create, edit, and delete trucks');
    console.log('   - The @Roles decorator is now active (no longer commented out)');
    console.log('   - If login fails, check tenant admin credentials in the database');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend server is not running on port 3000');
      console.error('❌ Please start the backend server first');
    } else if (error.response) {
      console.error('❌ HTTP Error:', error.response.status);
      console.error('❌ Error data:', error.response.data);
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

testTenantAdminFleetPermissions();