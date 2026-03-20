const axios = require('axios');

async function testAPI() {
  try {
    console.log('=== TESTING TRUCK OWNER API ENDPOINT ===');
    
    // First, try to login
    console.log('🔐 Attempting login...');
    
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'deborahrutagengwa.admin@urutix.com',
      password: 'password123'
    });
    
    if (loginResponse.data.accessToken) {
      console.log('✅ Login successful');
      
      const token = loginResponse.data.accessToken;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Test the truck owner balances endpoint
      console.log('\n📡 Testing /api/credits/tenant/users/balances?role=TRUCK_OWNER...');
      
      const balancesResponse = await axios.get(
        'http://localhost:3000/api/credits/tenant/users/balances?role=TRUCK_OWNER',
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
        
        if (truckOwners.length > 0) {
          console.log('\n👥 Truck Owners:');
          truckOwners.forEach((owner, index) => {
            console.log(`${index + 1}. ${owner.user?.profile?.firstName} ${owner.user?.profile?.lastName}`);
            console.log(`   Email: ${owner.user?.email}`);
            console.log(`   Balance: ${owner.currentBalance} credits`);
            console.log(`   Status: ${owner.user?.status}`);
            console.log(`   Company: ${owner.user?.profile?.companyName}`);
            console.log('');
          });
          
          console.log('🎉 SUCCESS: The API is working correctly!');
          console.log('🎯 The frontend should now display the truck owners.');
        } else {
          console.log('⚠️  API returns empty array');
        }
      } else {
        console.log('❌ Unexpected API response format');
      }
      
    } else {
      console.log('❌ Login failed - no access token received');
      console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.statusText);
      console.log('Response data:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n💡 Try these login credentials:');
        console.log('- Email: deborahrutagengwa.admin@urutix.com');
        console.log('- Password: password123 (or check the actual password)');
      }
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testAPI();