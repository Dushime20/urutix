const axios = require('axios');

async function checkTenantTruckOwners() {
  try {
    console.log('🔍 Checking Tenant Truck Owners...\n');

    // Login as tenant admin
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
    console.log('👤 User:', user.email, '- Role:', user.role);
    console.log('🏢 Tenant ID:', user.tenantId);
    console.log('');

    // Test the endpoint that the frontend is using
    const balanceResponse = await axios.get('http://localhost:3001/credits/tenant/users/balances?role=TRUCK_OWNER', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 Truck Owner Balances Response:');
    console.log('Status:', balanceResponse.status);
    console.log('Success:', balanceResponse.data.success);
    console.log('Data length:', balanceResponse.data.data?.length || 0);

    if (balanceResponse.data.data && balanceResponse.data.data.length > 0) {
      console.log('\n👥 Found Truck Owners:');
      balanceResponse.data.data.forEach((owner, index) => {
        console.log(`${index + 1}. ${owner.user?.profile?.firstName} ${owner.user?.profile?.lastName}`);
        console.log(`   Email: ${owner.user?.email}`);
        console.log(`   Status: ${owner.user?.status}`);
        console.log(`   Credits: ${owner.currentBalance}`);
        console.log(`   Tenant ID: ${owner.tenantId}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No truck owners found for this tenant');
      console.log('This explains why the page shows 0 truck owners');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkTenantTruckOwners();