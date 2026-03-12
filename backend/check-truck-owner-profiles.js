const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTruckOwnerProfiles() {
  try {
    console.log('=== CHECKING TRUCK OWNER PROFILES ===');
    
    // Check truck owners with profiles
    const withProfilesResult = await pool.query(`
      SELECT u.email, p."firstName", p."lastName", p."companyName"
      FROM users u
      JOIN user_profiles p ON u.id = p."userId"
      WHERE u.role = 'TRUCK_OWNER' 
      AND u."tenantId" = 'b7d244e3-9a1a-4686-a22f-3fe18468500e'
      ORDER BY u."createdAt"
    `);
    
    console.log(`\n📊 Truck owners WITH profiles: ${withProfilesResult.rows.length}`);
    withProfilesResult.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.firstName} ${row.lastName} (${row.companyName}) - ${row.email}`);
    });
    
    // Check truck owners without profiles
    const withoutProfilesResult = await pool.query(`
      SELECT u.id, u.email, u.role, u.status
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p."userId"
      WHERE u.role = 'TRUCK_OWNER' 
      AND u."tenantId" = 'b7d244e3-9a1a-4686-a22f-3fe18468500e'
      AND p."userId" IS NULL
      ORDER BY u."createdAt"
    `);
    
    console.log(`\n📊 Truck owners WITHOUT profiles: ${withoutProfilesResult.rows.length}`);
    withoutProfilesResult.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.email} (${row.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking truck owner profiles:', error.message);
  } finally {
    await pool.end();
  }
}

checkTruckOwnerProfiles();