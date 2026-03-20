const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTruckOwnerProfiles() {
  try {
    console.log('=== CREATING TRUCK OWNER PROFILES ===');
    
    // Get all truck owners without profiles
    const usersResult = await pool.query(`
      SELECT u.id, u.email, u.role, u.status, u."tenantId"
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p."userId"
      WHERE u.role = 'TRUCK_OWNER' 
      AND u."tenantId" = 'b7d244e3-9a1a-4686-a22f-3fe18468500e'
      AND p."userId" IS NULL
      ORDER BY u."createdAt"
    `);
    
    console.log(`Found ${usersResult.rows.length} truck owners without profiles`);
    
    if (usersResult.rows.length === 0) {
      console.log('✅ All truck owners already have profiles');
      return;
    }
    
    // Create profiles for each user
    for (const user of usersResult.rows) {
      console.log(`\n🔧 Creating profile for: ${user.email}`);
      
      // Generate a name based on email
      const emailParts = user.email.split('@')[0];
      let firstName, lastName, companyName;
      
      if (user.email === 'urutitruck@gmail.com') {
        firstName = 'Uruti';
        lastName = 'Truck';
        companyName = 'Uruti Trucking Co.';
      } else if (user.email === 'truckowner3@gmail.com') {
        firstName = 'Truck';
        lastName = 'Owner3';
        companyName = 'Owner3 Transport';
      } else if (user.email.includes('risk.partner1')) {
        firstName = 'Risk';
        lastName = 'Partner1';
        companyName = 'Risk Partner 1 Ltd';
      } else if (user.email.includes('risk.partner2')) {
        firstName = 'Risk';
        lastName = 'Partner2';
        companyName = 'Risk Partner 2 Ltd';
      } else if (user.email.includes('risk.partner3')) {
        firstName = 'Risk';
        lastName = 'Partner3';
        companyName = 'Risk Partner 3 Ltd';
      } else if (user.email.includes('healthy.partner')) {
        firstName = 'Healthy';
        lastName = 'Partner';
        companyName = 'Healthy Partner Corp';
      } else {
        // Default naming
        const parts = emailParts.split('.');
        firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Truck';
        lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Owner';
        companyName = `${firstName} ${lastName} Transport`;
      }
      
      // Insert the profile
      const profileResult = await pool.query(`
        INSERT INTO user_profiles (
          id, "userId", "firstName", "lastName", "companyName", 
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 
          NOW(), NOW()
        ) RETURNING id
      `, [user.id, firstName, lastName, companyName]);
      
      console.log(`✅ Created profile: ${firstName} ${lastName} (${companyName})`);
    }
    
    console.log('\n✅ All truck owner profiles created successfully!');
    
    // Verify the results
    const verifyResult = await pool.query(`
      SELECT u.email, p."firstName", p."lastName", p."companyName"
      FROM users u
      JOIN user_profiles p ON u.id = p."userId"
      WHERE u.role = 'TRUCK_OWNER' 
      AND u."tenantId" = 'b7d244e3-9a1a-4686-a22f-3fe18468500e'
      ORDER BY u."createdAt"
    `);
    
    console.log('\n📊 Verification - Truck owners with profiles:');
    verifyResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.firstname} ${row.lastname} (${row.companyname}) - ${row.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating truck owner profiles:', error.message);
  } finally {
    await pool.end();
  }
}

createTruckOwnerProfiles();