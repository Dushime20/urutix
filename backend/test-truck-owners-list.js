const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testTruckOwnersList() {
  console.log('🧪 Testing Truck Owners List Endpoint\n');

  try {
    // Step 1: Login as tenant admin
    console.log('1️⃣ Logging in as tenant admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@tenant1.com',
      password: 'Admin123!@#'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login successful\n');

    // Step 2: Fetch truck owners
    console.log('2️⃣ Fetching truck owners...');
    const ownersResponse = await axios.get(
      `${BASE_URL}/credits/tenant/users/balances?role=TRUCK_OWNER`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const owners = ownersResponse.data.data;
    console.log(`✅ Found ${owners.length} truck owners\n`);

    // Step 3: Display truck owners
    console.log('📋 Truck Owners List:');
    console.log('='.repeat(80));
    
    owners.forEach((owner, index) => {
      const user = owner.user;
      const profile = user?.profile;
      
      console.log(`\n${index + 1}. ${profile?.firstName || 'N/A'} ${profile?.lastName || 'N/A'}`);
      console.log(`   Company: ${profile?.companyName || 'N/A'}`);
      console.log(`   Email: ${user?.email || 'N/A'}`);
      console.log(`   Phone: ${user?.phone || 'N/A'}`);
      console.log(`   Status: ${user?.status || 'N/A'}`);
      console.log(`   Credits: ${owner.currentBalance || 0}`);
      console.log(`   Joined: ${user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`);
      console.log(`   Last Login: ${user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}`);
      console.log(`   User ID: ${user?.id || 'N/A'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   Total Truck Owners: ${owners.length}`);
    console.log(`   Active: ${owners.filter(o => o.user?.status === 'ACTIVE').length}`);
    console.log(`   Total Credits: ${owners.reduce((sum, o) => sum + o.currentBalance, 0)}`);

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure the tenant admin credentials are correct');
    }
  }
}

testTruckOwnersList();
