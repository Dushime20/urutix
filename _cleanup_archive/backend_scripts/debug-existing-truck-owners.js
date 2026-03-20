const axios = require('axios');

async function debugExistingTruckOwners() {
  try {
    console.log('🔍 Debugging Existing Truck Owners Issue...\n');

    // Step 1: Login as tenant admin to get tenant info
    console.log('1️⃣ Logging in as tenant admin...');
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      email: 'deborahrutagengwa.admin@urutix.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    const token = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;

    console.log('✅ Login successful');
    console.log('👤 Tenant Admin:', user.email);
    console.log('🏢 Tenant ID:', user.tenantId);
    console.log('');

    // Step 2: Test the exact endpoint the frontend is calling
    console.log('2️⃣ Testing truck owners endpoint...');
    try {
      const response = await axios.get('http://localhost:3001/credits/tenant/users/balances?role=TRUCK_OWNER', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('📊 API Response:');
      console.log('Status:', response.status);
      console.log('Success:', response.data.success);
      console.log('Data count:', response.data.data?.length || 0);

      if (response.data.data && response.data.data.length > 0) {
        console.log('\n✅ Found truck owners:');
        response.data.data.forEach((owner, index) => {
          console.log(`${index + 1}. ${owner.user?.profile?.firstName || 'No Name'} ${owner.user?.profile?.lastName || ''}`);
          console.log(`   Email: ${owner.user?.email || 'No Email'}`);
          console.log(`   Tenant ID: ${owner.tenantId}`);
          console.log(`   Credits: ${owner.currentBalance}`);
          console.log('');
        });
      } else {
        console.log('❌ No truck owners returned from API');
        console.log('This confirms the issue - let\'s investigate further...\n');
      }
    } catch (apiError) {
      console.log('❌ API Error:', apiError.response?.data || apiError.message);
    }

    // Step 3: Check if there are any truck owners in the system at all
    console.log('3️⃣ Let\'s check if truck owners exist in other tenants...');
    
    // Try to get all tenant balances (if we have super admin access)
    try {
      const allBalancesResponse = await axios.get('http://localhost:3001/credits/admin/balances', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📊 All tenant balances found:', allBalancesResponse.data.data?.length || 0);
    } catch (error) {
      console.log('ℹ️  Cannot access admin balances (expected for tenant admin)');
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('1. Check if truck owners exist but are in different tenants');
    console.log('2. Verify if truck owners have the correct tenant ID');
    console.log('3. Check if credit accounts need to be created for existing truck owners');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugExistingTruckOwners();