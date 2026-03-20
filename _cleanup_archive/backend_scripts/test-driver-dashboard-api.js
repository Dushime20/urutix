const axios = require('axios');

async function testDriverDashboardAPI() {
  console.log('🚛 TESTING DRIVER DASHBOARD API');
  console.log('=' .repeat(50));

  const baseURL = 'http://localhost:3001';
  
  try {
    // 1. Login as a driver first
    console.log('\n📋 1. LOGGING IN AS DRIVER:');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'urutidriver@gmail.com',
      password: 'password123'
    }, {
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (loginResponse.status !== 200) {
      console.log('❌ Login failed');
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Response: ${JSON.stringify(loginResponse.data)}`);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.accessToken; // Use accessToken instead of token
    const user = loginResponse.data.user;
    console.log(`   User: ${user.email} (${user.role})`);
    console.log(`   Token: ${token ? 'Received' : 'Missing'}`);

    // 2. Test driver API endpoints
    console.log('\n📋 2. TESTING DRIVER API ENDPOINTS:');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // First get the driver ID from the driver lookup
    let driverId = null;
    try {
      const driverLookupResponse = await axios.get(`${baseURL}/api/drivers?userId=${user.id}`, {
        headers,
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (driverLookupResponse.status === 200 && driverLookupResponse.data.drivers && driverLookupResponse.data.drivers.length > 0) {
        driverId = driverLookupResponse.data.drivers[0].id;
        console.log(`   Found driver ID: ${driverId}`);
      }
    } catch (error) {
      console.log(`   ❌ Could not get driver ID: ${error.message}`);
    }

    if (!driverId) {
      console.log('   ❌ Cannot test driver endpoints without driver ID');
      return;
    }

    // Test endpoints that the DriverDashboard uses
    const endpoints = [
      '/api/drivers',
      `/api/drivers/${driverId}/profile`,
      `/api/drivers/${driverId}/stats`,
      `/api/drivers/${driverId}/trips`,
      `/api/drivers/${driverId}/current-trip`,
      `/api/drivers/${driverId}/upcoming-trips`,
      `/api/drivers/${driverId}/notifications`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n   Testing: ${endpoint}`);
        const response = await axios.get(`${baseURL}${endpoint}`, {
          headers,
          timeout: 5000,
          validateStatus: () => true
        });
        
        console.log(`   Status: ${response.status}`);
        if (response.status === 200) {
          console.log('   ✅ Working');
          if (response.data && typeof response.data === 'object') {
            console.log(`   Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
          }
        } else {
          console.log('   ❌ Failed');
          console.log(`   Error: ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        console.log(`   ❌ Request error: ${error.message}`);
      }
    }

    // 3. Test specific driver lookup by user ID
    console.log('\n📋 3. TESTING DRIVER LOOKUP BY USER ID:');
    try {
      const driverLookupResponse = await axios.get(`${baseURL}/api/drivers?userId=${user.id}`, {
        headers,
        timeout: 5000,
        validateStatus: () => true
      });
      
      console.log(`   Status: ${driverLookupResponse.status}`);
      if (driverLookupResponse.status === 200) {
        console.log('   ✅ Driver lookup working');
        console.log(`   Found drivers: ${JSON.stringify(driverLookupResponse.data)}`);
      } else {
        console.log('   ❌ Driver lookup failed');
        console.log(`   Error: ${JSON.stringify(driverLookupResponse.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Driver lookup error: ${error.message}`);
    }

    // 4. Check if driver record exists for this user
    console.log('\n📋 4. CHECKING DRIVER RECORD:');
    try {
      const allDriversResponse = await axios.get(`${baseURL}/api/drivers`, {
        headers,
        timeout: 5000,
        validateStatus: () => true
      });
      
      if (allDriversResponse.status === 200) {
        const drivers = allDriversResponse.data;
        console.log(`   Total drivers found: ${Array.isArray(drivers) ? drivers.length : 'Not an array'}`);
        
        if (Array.isArray(drivers)) {
          const userDriver = drivers.find(d => d.userId === user.id || d.email === user.email);
          if (userDriver) {
            console.log('   ✅ Driver record found for user');
            console.log(`   Driver ID: ${userDriver.id}`);
            console.log(`   Driver Name: ${userDriver.firstName} ${userDriver.lastName}`);
          } else {
            console.log('   ❌ No driver record found for this user');
            console.log('   Available drivers:');
            drivers.slice(0, 3).forEach((driver, index) => {
              console.log(`     ${index + 1}. ${driver.email} (ID: ${driver.id})`);
            });
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Error checking drivers: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

testDriverDashboardAPI().catch(console.error);