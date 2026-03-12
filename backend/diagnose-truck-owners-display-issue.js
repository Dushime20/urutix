const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'urutix_db',
  user: 'postgres',
  password: 'password',
});

async function diagnoseTruckOwnersIssue() {
  try {
    console.log('🔍 Diagnosing Truck Owners Display Issue...\n');

    // 1. Check all users with TRUCK_OWNER role
    console.log('1️⃣ Checking all TRUCK_OWNER users:');
    const truckOwners = await pool.query(`
      SELECT id, email, role, "tenantId", status, "createdAt"
      FROM users 
      WHERE role = 'TRUCK_OWNER'
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`Found ${truckOwners.rows.length} truck owners:`);
    truckOwners.rows.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, Tenant: ${user.tenantId}, Status: ${user.status})`);
    });

    // 2. Check credit accounts for truck owners
    console.log('\n2️⃣ Checking credit accounts for truck owners:');
    const creditAccounts = await pool.query(`
      SELECT ca.id, ca."tenantId", ca."userId", ca."currentBalance", u.email, u.role
      FROM credit_accounts ca
      JOIN users u ON ca."userId" = u.id
      WHERE u.role = 'TRUCK_OWNER'
      ORDER BY ca."createdAt" DESC
    `);
    
    console.log(`Found ${creditAccounts.rows.length} credit accounts for truck owners:`);
    creditAccounts.rows.forEach(account => {
      console.log(`  - ${account.email}: ${account.currentBalance} credits (Tenant: ${account.tenantId})`);
    });

    // 3. Check specific tenant's truck owners
    console.log('\n3️⃣ Checking truck owners for specific tenant:');
    const tenantId = '018f4e8c-4d8b-7a9e-8f2b-3c5d6e7f8a9b'; // Replace with actual tenant ID
    
    const tenantTruckOwners = await pool.query(`
      SELECT u.id, u.email, u.role, u."tenantId", u.status, 
             ca."currentBalance", ca."purchasedCredits", ca."bonusCredits"
      FROM users u
      LEFT JOIN credit_accounts ca ON u.id = ca."userId"
      WHERE u.role = 'TRUCK_OWNER' AND u."tenantId" = $1
      ORDER BY u."createdAt" DESC
    `, [tenantId]);
    
    console.log(`Found ${tenantTruckOwners.rows.length} truck owners for tenant ${tenantId}:`);
    tenantTruckOwners.rows.forEach(user => {
      console.log(`  - ${user.email}: ${user.currentBalance || 0} credits`);
    });

    // 4. Check all tenants to see which ones have truck owners
    console.log('\n4️⃣ Checking truck owners per tenant:');
    const tenantStats = await pool.query(`
      SELECT u."tenantId", t."contactEmail" as tenant_email, COUNT(u.id) as truck_owner_count
      FROM users u
      LEFT JOIN tenants t ON u."tenantId" = t.id
      WHERE u.role = 'TRUCK_OWNER'
      GROUP BY u."tenantId", t."contactEmail"
      ORDER BY truck_owner_count DESC
    `);
    
    console.log('Truck owners per tenant:');
    tenantStats.rows.forEach(stat => {
      console.log(`  - Tenant ${stat.tenant_email}: ${stat.truck_owner_count} truck owners`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

diagnoseTruckOwnersIssue();