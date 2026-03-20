const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testDriverDashboard() {
  console.log('🧪 Testing Driver Dashboard Fix...\n');

  try {
    // First, try to login to get a token
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@urutix.com',
      password: 'admin123'
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test driver endpoints
    console.log('\n2. Testing driver endpoints...');
    
    try {
      const driversResponse = await axios.get(`${BASE_URL}/fleet/drivers`, { headers });
      console.log('✅ GET /fleet/drivers - Success');
      console.log(`   Found ${driversResponse.data.drivers?.length || 0} drivers`);
      
      // If we have drivers, test individual driver endpoints
      if (driversResponse.data.drivers && driversResponse.data.drivers.length > 0) {
        const driverId = driversResponse.data.drivers[0].id;
        console.log(`   Testing with driver ID: ${driverId}`);
        
        try {
          const driverResponse = await axios.get(`${BASE_URL}/fleet/drivers/${driverId}`, { headers });
          console.log('✅ GET /fleet/drivers/:id - Success');
        } catch (error) {
          console.log('❌ GET /fleet/drivers/:id - Failed:', error.response?.status);
        }
        
        try {
          const statsResponse = await axios.get(`${BASE_URL}/fleet/drivers/${driverId}/stats`, { headers });
          console.log('✅ GET /fleet/drivers/:id/stats - Success');
          console.log('   Stats:', JSON.stringify(statsResponse.data.stats, null, 2));
        } catch (error) {
          console.log('❌ GET /fleet/drivers/:id/stats - Failed:', error.response?.status);
        }
      } else {
        console.log('⚠️  No drivers found to test individual endpoints');
      }
      
    } catch (error) {
      console.log('❌ GET /fleet/drivers - Failed:', error.response?.status);
    }

    console.log('\n✅ Driver Dashboard API test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDriverDashboard();