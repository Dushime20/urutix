const axios = require('axios');

async function fixTruckOwnerTenantAssignment() {
  try {
    console.log('🔧 Fixing Truck Owner Tenant Assignment...\n');

    // Get tenant admin info first
    const loginResponse = await axios.post('http://localhost:3001/auth/login', {
      email: 'deborahrutagengwa.admin@urutix.com',
      password: 'password123'
    });

    const targetTenantId = loginResponse.data.data.user.tenantId;
    const tenantAdminEmail = loginResponse.data.data.user.email;

    console.log('🎯 Target Tenant ID:', targetTenantId);
    console.log('👤 Tenant Admin:', tenantAdminEmail);
    console.log('');

    // This script would need database access to fix tenant assignments
    // For now, let's provide instructions
    
    console.log('📋 TO FIX TRUCK OWNER TENANT ASSIGNMENT:');
    console.log('');
    console.log('If you have truck owners that should belong to this tenant but are showing');
    console.log('in a different tenant, you can fix it by updating their tenantId in the database.');
    console.log('');
    console.log('SQL Command to run:');
    console.log('```sql');
    console.log(`UPDATE users SET "tenantId" = '${targetTenantId}'`);
    console.log(`WHERE role = 'TRUCK_OWNER' AND email IN (`);
    console.log(`  'truck.owner1@example.com',`);
    console.log(`  'truck.owner2@example.com'`);
    console.log(`  -- Add the emails of truck owners that should belong to this tenant`);
    console.log(`);`);
    console.log('```');
    console.log('');
    console.log('OR, if you want to move ALL truck owners to this tenant:');
    console.log('```sql');
    console.log(`UPDATE users SET "tenantId" = '${targetTenantId}' WHERE role = 'TRUCK_OWNER';`);
    console.log('```');
    console.log('');
    console.log('After running the SQL, refresh the Truck Owners & Credits page.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fixTruckOwnerTenantAssignment();