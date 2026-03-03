const axios = require('axios');

async function testTrucksAPI() {
  try {
    console.log('🧪 Testing Trucks API...\n');

    // First, login to get a token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });

    const token = loginResponse.data.accessToken || loginResponse.data.access_token;
    const user = loginResponse.data.user;
    
    console.log('✅ Login successful');
    console.log('   User:', user.email);
    console.log('   Role:', user.role);
    console.log('   Tenant ID:', user.tenantId);
    console.log('   User ID:', user.id);
    console.log('   Token:', token ? 'Present' : 'Missing');
    console.log('');

    // Now fetch trucks
    console.log('2️⃣ Fetching trucks...');
    const trucksResponse = await axios.get('http://localhost:3000/api/fleet/trucks', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Trucks API response:');
    console.log('   Status:', trucksResponse.status);
    console.log('   Response data:', JSON.stringify(trucksResponse.data, null, 2));
    console.log('');

    if (trucksResponse.data.trucks) {
      console.log('📊 Trucks found:', trucksResponse.data.trucks.length);
      trucksResponse.data.trucks.forEach((truck, index) => {
        console.log(`   ${index + 1}. ${truck.plateNumber} (${truck.make} ${truck.model})`);
        console.log(`      Status: ${truck.status}`);
        console.log(`      Tenant: ${truck.tenantId}`);
        console.log(`      Owner: ${truck.ownerId}`);
      });
    } else {
      console.log('⚠️ No trucks array in response');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTrucksAPI();
