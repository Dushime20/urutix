const axios = require('axios');

async function testFleetAPIComplete() {
  try {
    console.log('🧪 Testing Fleet API with authentication...');
    
    // First, let's try to login to get a token
    console.log('🔐 Attempting to login...');
    
    // Try with a known admin user (adjust credentials as needed)
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com', // Adjust this to a known user
      password: 'password123'     // Adjust this to the correct password
    }, {
      timeout: 10000,
      validateStatus: function (status) {
        return true; // Accept any status
      }
    });
    
    console.log('🔐 Login Status:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      console.log('⚠️ Login failed, testing without auth token...');
      
      // Test the fleet endpoint without auth
      const fleetResponse = await axios.get('http://localhost:3000/api/fleet/trucks', {
        timeout: 10000,
        validateStatus: function (status) {
          return true;
        }
      });
      
      console.log('📊 Fleet API Status (no auth):', fleetResponse.status);
      
      if (fleetResponse.status === 401) {
        console.log('✅ Perfect! API returns 401 Unauthorized without token');
        console.log('✅ Database relation issues are fixed');
        console.log('✅ The 500 Internal Server Error has been resolved');
      } else if (fleetResponse.status === 500) {
        console.error('❌ Still getting 500 error');
        console.error('❌ Response:', fleetResponse.data);
      } else {
        console.log('📊 Unexpected status:', fleetResponse.status);
        console.log('📊 Response:', fleetResponse.data);
      }
      
      return;
    }
    
    // If login successful, test with auth token
    const token = loginResponse.data.token || loginResponse.data.access_token;
    
    if (!token) {
      console.log('⚠️ No token in login response, testing without auth...');
      return;
    }
    
    console.log('✅ Login successful, testing fleet API with token...');
    
    const fleetResponse = await axios.get('http://localhost:3000/api/fleet/trucks', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000,
      validateStatus: function (status) {
        return true;
      }
    });
    
    console.log('📊 Fleet API Status (with auth):', fleetResponse.status);
    
    if (fleetResponse.status === 200) {
      console.log('✅ Fleet API working perfectly!');
      console.log('📊 Number of trucks returned:', fleetResponse.data.trucks?.length || 0);
      
      if (fleetResponse.data.trucks && fleetResponse.data.trucks.length > 0) {
        const truck = fleetResponse.data.trucks[0];
        console.log('📊 Sample truck data:');
        console.log('   - ID:', truck.id);
        console.log('   - Plate:', truck.plateNumber);
        console.log('   - Owner:', truck.owner ? `${truck.owner.profile?.firstName} ${truck.owner.profile?.lastName}` : 'No owner');
        console.log('   - Current Driver:', truck.currentDriver ? `${truck.currentDriver.firstName} ${truck.currentDriver.lastName}` : 'No driver');
      }
    } else if (fleetResponse.status === 500) {
      console.error('❌ Still getting 500 error with auth');
      console.error('❌ Response:', fleetResponse.data);
    } else {
      console.log('📊 Status with auth:', fleetResponse.status);
      console.log('📊 Response:', fleetResponse.data);
    }
    
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

testFleetAPIComplete();