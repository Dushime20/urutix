const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function createTestDriver() {
  console.log('🚛 Creating Test Driver...\n');

  try {
    // Login as superadmin
    console.log('1. Logging in as superadmin...');
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

    // Create a test driver
    console.log('\n2. Creating test driver...');
    const driverData = {
      firstName: 'John',
      lastName: 'Driver',
      email: 'john.driver@test.com',
      phone: '+1234567890',
      licenseNumber: 'DL123456789',
      licenseClass: 'CDL-A',
      licenseIssueDate: '2020-01-01T00:00:00.000Z',
      licenseExpiry: '2025-12-31T00:00:00.000Z',
      licenseState: 'CA',
      licenseCountry: 'USA',
      dateOfBirth: '1985-01-15T00:00:00.000Z',
      address: '123 Main St, City, State 12345',
      emergencyContactName: 'Jane Driver',
      emergencyContactPhone: '+1234567891',
      hireDate: '2024-01-01T00:00:00.000Z',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      experience: 5
    };

    try {
      const createResponse = await axios.post(`${BASE_URL}/fleet/drivers`, driverData, { headers });
      console.log('✅ Driver created successfully');
      console.log('   Driver ID:', createResponse.data.driver.id);
      
      const driverId = createResponse.data.driver.id;
      
      // Test the driver endpoints
      console.log('\n3. Testing driver endpoints...');
      
      // Get driver profile
      try {
        const profileResponse = await axios.get(`${BASE_URL}/fleet/drivers/${driverId}`, { headers });
        console.log('✅ GET /fleet/drivers/:id - Success');
        console.log('   Driver name:', profileResponse.data.driver.firstName, profileResponse.data.driver.lastName);
      } catch (error) {
        console.log('❌ GET /fleet/drivers/:id - Failed:', error.response?.status);
      }
      
      // Get driver stats
      try {
        const statsResponse = await axios.get(`${BASE_URL}/fleet/drivers/${driverId}/stats`, { headers });
        console.log('✅ GET /fleet/drivers/:id/stats - Success');
        console.log('   Stats sample:', {
          totalTrips: statsResponse.data.stats.totalTrips,
          totalEarnings: statsResponse.data.stats.totalEarnings,
          safetyScore: statsResponse.data.stats.safetyScore
        });
      } catch (error) {
        console.log('❌ GET /fleet/drivers/:id/stats - Failed:', error.response?.status);
      }
      
      console.log('\n✅ Test driver created and endpoints verified!');
      console.log(`🔗 You can now test the driver dashboard at: http://localhost:3000/dashboard/driver`);
      console.log(`📧 Test driver email: ${driverData.email}`);
      
    } catch (error) {
      console.log('❌ Failed to create driver:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

createTestDriver();