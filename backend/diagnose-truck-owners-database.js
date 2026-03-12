const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'urutix_db',
  user: 'postgres',
  password: 'password',
});

async function diagnoseTruckOwnersDatabase() {
  try {
    console.log('🔍 Diagnosing Truck Owners in Database...\n');

    // 1. Get the tenant admin's tenant ID
    console.log('1️⃣ Finding tenant admin and their tenant ID...');
    const tenantAdminQuery = await pool.query(`
      SELECT u.id, u.email, u."tenantId", t."contactEmail" as tenant_email
      FROM users u
      JOIN tenants t ON u."tenantId" = t.id
      WHERE u.email = 'deborahrutagengwa.admin@urutix.com'
    `);

    if (tenantAdminQuery.rows.length === 0) {
      console.log('❌ Tenant admin not found');
      return;
    }

    const tenantAdmin = tenantAdminQuery.rows[0];
    console.log('✅ Found tenant admin:');
    console.log(`   Email: ${tenantAdmin.email}`);
    console.log(`   Tenant ID: ${tenantAdmin.tenantId}`);
    console.log(`   Tenant Email: ${tenantAdmin.tenant_email}`);
    console.log('');

    // 2. Check all truck owners in the system
    console.log('2️⃣ Checking all truck owners in the system...');
    const allTruckOwners = await pool.query(`
      SELECT u.id, u.email, u."tenantId", u.status, u."createdAt",
             t."contactEmail" as tenant_email,
             up."firstName", up."lastName", up."companyName"
      FROM users u
      LEFT JOIN tenants t ON u."tenantId" = t.id
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE u.role = 'TRUCK_OWNER'
      ORDER BY u."createdAt" DESC
    `);

    console.log(`📊 Found ${allTruckOwners.rows.length} truck owners total:`);
    allTruckOwners.rows.forEach((owner, index) => {
      console.log(`${index + 1}. ${owner.firstName || 'No Name'} ${owner.lastName || ''}`);
      console.log(`   Email: ${owner.email}`);
      console.log(`   Tenant ID: ${owner.tenantId}`);
      console.log(`   Tenant Email: ${owner.tenant_email || 'No Tenant'}`);
      console.log(`   Status: ${owner.status}`);
      console.log(`   Company: ${owner.companyName || 'N/A'}`);
      console.log('');
    });

    // 3. Check truck owners specifically for this tenant
    console.log('3️⃣ Checking truck owners for current tenant...');
    const tenantTruckOwners = await pool.query(`
      SELECT u.id, u.email, u."tenantId", u.status, u."createdAt",
             up."firstName", up."lastName", up."companyName"
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE u.role = 'TRUCK_OWNER' AND u."tenantId" = $1
      ORDER BY u."createdAt" DESC
    `, [tenantAdmin.tenantId]);

    console.log(`📊 Found ${tenantTruckOwners.rows.length} truck owners for this tenant:`);
    if (tenantTruckOwners.rows.length > 0) {
      tenantTruckOwners.rows.forEach((owner, index) => {
        console.log(`${index + 1}. ${owner.firstName || 'No Name'} ${owner.lastName || ''}`);
        console.log(`   Email: ${owner.email}`);
        console.log(`   Status: ${owner.status}`);
        console.log(`   Company: ${owner.companyName || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No truck owners found for this tenant');
    }

    // 4. Check credit accounts for truck owners
    console.log('4️⃣ Checking credit accounts...');
    const creditAccounts = await pool.query(`
      SELECT ca.id, ca."tenantId", ca."userId", ca."currentBalance",
             u.email, u.role
      FROM credit_accounts ca
      JOIN users u ON ca."userId" = u.id
      WHERE u.role = 'TRUCK_OWNER'
      ORDER BY ca."createdAt" DESC
    `);

    console.log(`📊 Found ${creditAccounts.rows.length} credit accounts for truck owners:`);
    creditAccounts.rows.forEach((account, index) => {
      console.log(`${index + 1}. ${account.email}: ${account.currentBalance} credits`);
      console.log(`   Tenant ID: ${account.tenantId}`);
      console.log('');
    });

    // 5. Diagnosis and recommendations
    console.log('💡 DIAGNOSIS:');
    if (allTruckOwners.rows.length === 0) {
      console.log('❌ No truck owners exist in the system at all');
      console.log('   → You need to create truck owners first');
    } else if (tenantTruckOwners.rows.length === 0) {
      console.log('⚠️  Truck owners exist but none belong to this tenant');
      console.log('   → Truck owners have wrong tenant IDs');
      console.log('   → Need to update their tenantId to:', tenantAdmin.tenantId);
    } else {
      console.log('✅ Truck owners exist for this tenant');
      console.log('   → The issue might be with credit accounts or API endpoint');
    }

  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.log('\n💡 If you get a connection error:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check database credentials in the script');
    console.log('3. Verify database name and connection details');
  } finally {
    await pool.end();
  }
}

diagnoseTruckOwnersDatabase();