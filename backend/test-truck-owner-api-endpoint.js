const axios = require('axios');

async function testTruckOwnerEndpoint() {
  try {
    console.log('=== TESTING TRUCK OWNER API ENDPOINT ===');
    
    // First, login to get a token
    console.log('🔐 Logging in as tenant admin...');
    
    const loginResponse = await axios.post('http://localhost:3000/auth/login', {
      email: 'deborahrutagengwa.admin@urutix.com',
      password: 'password123' // Default password from the context
    });
    
    if (loginResponse.data.access_token) {
      console.log('✅ Login successful');
      
      const token = loginResponse.data.access_token;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Test the truck owner balances endpoint
      console.log('\n📡 Testing /credits/tenant/users/balances?role=TRUCK_OWNER...');
      
      const balancesResponse = await axios.get(
        'http://localhost:3000/credits/tenant/users/balances?role=TRUCK_OWNER',
        { headers }
      );
      
      console.log('✅ API Response Status:', balancesResponse.status);
      console.log('✅ API Response Data:', JSON.stringify(balancesResponse.data, null, 2));
      
      if (balancesResponse.data.data && Array.isArray(balancesResponse.data.data)) {
        const truckOwners = balancesResponse.data.data;
        console.log('\n📊 Summary:');
        console.log('- Total Truck Owners:', truckOwners.length);
        console.log('- Active Owners:', truckOwners.filter(o => o.user?.status === 'ACTIVE').length);
        console.log('- Credits Distributed:', truckOwners.reduce((sum, o) => sum + (o.currentBalance || 0), 0));
        
        console.log('\n👥 Truck Owners:');
        truckOwners.forEach((owner, index) => {
          console.log(`${index + 1}. ${owner.user?.profile?.firstName} ${owner.user?.profile?.lastName}`);
          console.log(`   Email: ${owner.user?.email}`);
          console.log(`   Balance: ${owner.currentBalance} credits`);
          console.log(`   Status: ${owner.user?.status}`);
          console.log(`   Company: ${owner.user?.profile?.companyName}`);
          console.log('');
        });
        
        if (truckOwners.length > 0) {
          console.log('🎉 SUCCESS: The API is working correctly!');
          console.log('🎯 The frontend should now display the truck owners.');
          console.log('💡 If the frontend still shows 0 truck owners, try:');
          console.log('   1. Hard refresh the page (Ctrl+Shift+R)');
          console.log('   2. Clear browser cache');
          console.log('   3. Check browser console for errors');
        } else {
          console.log('⚠️  API returns empty array - there might be a backend issue');
        }
      } else {
        console.log('❌ Unexpected API response format');
      }
      
    } else {
      console.log('❌ Login failed - no access token received');
      console.log('Response:', loginResponse.data);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running');
      console.log('💡 Please start the backend server first:');
      console.log('   cd urutix/backend');
      console.log('   npm run start:dev');
    } else if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.statusText);
      console.log('Response data:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testTruckOwnerEndpoint();