const axios = require('axios');

async function findTruckOwnersAllTenants() {
  try {
    console.log('🔍 Finding All Truck Owners Across Tenants...\n');

    // Login as super admin to get broader access
    console.log('1️⃣ Trying to login as super admin...');
    let token, userRole, currentTenantId;
    
    try {
      const superAdminLogin = await axios.post('http://localhost:3001/auth/login', {
        email: 'admin@urutix.com',
        password: 'admin123'
      });
      
      if (superAdminLogin.data.success) {
        token = superAdminLogin.data.data.accessToken;
        userRole = superAdminLogin.data.data.user.role;
        console.log('✅ Super admin login successful');
      }
    } catch (error) {
      console.log('⚠️  Super admin login failed, trying tenant admin...');
      
      // Fallback to tenant admin
      const tenantAdminLogin = await axios.post('http://localhost:3001/auth/login', {
        email: 'deborahrutagengwa.admin@urutix.com',
        password: 'password123'
      });
      
      token = tenantAdminLogin.data.data.accessToken;
      userRole = tenantAdminLogin.data.data.user.role;
      currentTenantId = tenantAdminLogin.data.data.user.tenantId;
      console.log('✅ Tenant admin login successful');
      console.log('🏢 Current tenant ID:', currentTenantId);
    }

    console.log('👤 Logged in as:', userRole);
    console.log('');

    // Step 2: Try to get all tenant balances if super admin
    if (userRole === 'SUPER_ADMIN') {
      console.log('2️⃣ Getting all tenant balances...');
      try {
        const allBalances = await axios.get('http://localhost:3001/credits/admin/balances', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📊 Found', allBalances.data.data?.length || 0, 'tenant accounts');
        
        if (allBalances.data.data) {
          allBalances.data.data.forEach((account, index) => {
            console.log(`${index + 1}. Tenant ${account.tenantId}: ${account.currentBalance} credits`);
          });
        }
      } catch (error) {
        console.log('❌ Error getting admin balances:', error.response?.data?.message);
      }
    }

    // Step 3: Check current tenant's truck owners
    console.log('\n3️⃣ Checking current tenant truck owners...');
    try {
      const currentTenantOwners = await axios.get('http://localhost:3001/credits/tenant/users/balances?role=TRUCK_OWNER', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📊 Current tenant truck owners:', currentTenantOwners.data.data?.length || 0);
      
      if (currentTenantOwners.data.data && currentTenantOwners.data.data.length > 0) {
        console.log('✅ Found truck owners in current tenant:');
        currentTenantOwners.data.data.forEach((owner, index) => {
          console.log(`${index + 1}. ${owner.user?.email} - ${owner.currentBalance} credits`);
        });
      } else {
        console.log('❌ No truck owners found in current tenant');
      }
    } catch (error) {
      console.log('❌ Error getting current tenant owners:', error.response?.data?.message);
    }

    console.log('\n💡 DIAGNOSIS COMPLETE');
    console.log('If no truck owners were found, the issue could be:');
    console.log('1. Truck owners exist but have different tenant IDs');
    console.log('2. Truck owners exist but don\'t have credit accounts');
    console.log('3. There\'s an issue with the API endpoint filtering');
    console.log('\nNext: Check the database directly or run a script to fix tenant associations');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

findTruckOwnersAllTenants();