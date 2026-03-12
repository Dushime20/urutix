const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTruckOwners() {
  try {
    console.log('=== CHECKING TRUCK OWNERS FOR TENANT ===');
    
    // Get tenant ID for the admin user
    const adminResult = await pool.query(`
      SELECT u."tenantId", t."contactEmail"
      FROM users u 
      JOIN tenants t ON u."tenantId" = t.id 
      WHERE u.email = 'deborahrutagengwa.admin@urutix.com'
    `);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const tenantId = adminResult.rows[0].tenantId;
    console.log('✅ Tenant ID:', tenantId);
    console.log('✅ Tenant Email:', adminResult.rows[0].contactEmail);
    
    // Check truck owners for this tenant
    const truckOwnersResult = await pool.query(`
      SELECT u.id, u.email, u."tenantId", u.role, u.status,
             up."firstName", up."lastName", up."companyName"
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE u."tenantId" = $1 AND u.role = 'TRUCK_OWNER'
      ORDER BY u."createdAt" DESC
    `, [tenantId]);
    
    console.log('\n=== TRUCK OWNERS IN TENANT ===');
    console.log('Found', truckOwnersResult.rows.length, 'truck owners');
    
    if (truckOwnersResult.rows.length === 0) {
      console.log('❌ No truck owners found for this tenant');
      
      // Check if truck owners exist in other tenants
      const allTruckOwners = await pool.query(`
        SELECT u.id, u.email, u."tenantId", 
               up."firstName", up."lastName"
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up."userId"
        WHERE u.role = 'TRUCK_OWNER'
        ORDER BY u."createdAt" DESC
      `);
      
      console.log('\n=== ALL TRUCK OWNERS IN SYSTEM ===');
      allTruckOwners.rows.forEach(owner => {
        console.log('- Email:', owner.email);
        console.log('  Name:', owner.firstName, owner.lastName);
        console.log('  Tenant ID:', owner.tenantId);
        console.log('  Matches current tenant:', owner.tenantId === tenantId ? '✅ YES' : '❌ NO');
        console.log('');
      });
      
      return;
    }
    
    // Display truck owners
    truckOwnersResult.rows.forEach(owner => {
      console.log('- ID:', owner.id);
      console.log('  Email:', owner.email);
      console.log('  Name:', owner.firstName, owner.lastName);
      console.log('  Company:', owner.companyName);
      console.log('  Status:', owner.status);
      console.log('');
    });
    
    // Check credit accounts for these truck owners
    console.log('=== CHECKING CREDIT ACCOUNTS ===');
    
    for (const owner of truckOwnersResult.rows) {
      const creditResult = await pool.query(`
        SELECT ca.id, ca."tenantId", ca."userId", ca."currentBalance",
               ca."purchasedCredits", ca."bonusCredits", ca."subscriptionCredits"
        FROM credit_accounts ca
        WHERE ca."tenantId" = $1 AND ca."userId" = $2
      `, [tenantId, owner.id]);
      
      console.log('Credit account for', owner.email + ':');
      if (creditResult.rows.length === 0) {
        console.log('  ❌ No credit account found - will be auto-created');
      } else {
        const account = creditResult.rows[0];
        console.log('  ✅ Account ID:', account.id);
        console.log('  ✅ Current Balance:', account.currentBalance);
        console.log('  ✅ Purchased Credits:', account.purchasedCredits);
        console.log('  ✅ Bonus Credits:', account.bonusCredits);
        console.log('  ✅ Subscription Credits:', account.subscriptionCredits);
      }
      console.log('');
    }
    
    // Test the API endpoint query that the frontend uses
    console.log('=== TESTING API ENDPOINT QUERY ===');
    const apiQuery = `
      SELECT u.id, u.email, u."tenantId", u.role, u.status, u."createdAt", u."lastLoginAt",
             up."firstName", up."lastName", up."companyName"
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE u."tenantId" = $1 AND u.role = 'TRUCK_OWNER'
      ORDER BY u."createdAt" DESC
    `;
    
    const apiResult = await pool.query(apiQuery, [tenantId]);
    console.log('API query would return', apiResult.rows.length, 'truck owners');
    
    if (apiResult.rows.length > 0) {
      console.log('✅ API should work correctly');
      console.log('Expected page display:');
      console.log('- Total Truck Owners:', apiResult.rows.length);
      console.log('- Active Owners:', apiResult.rows.filter(u => u.status === 'ACTIVE').length);
      console.log('- Credits Distributed: 0 (initially, until credit accounts are created)');
    } else {
      console.log('❌ API will return empty results');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTruckOwners();