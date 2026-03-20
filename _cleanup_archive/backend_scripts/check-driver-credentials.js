const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkDriverCredentials() {
  const client = await pool.connect();
  
  try {
    console.log('🚛 CHECKING DRIVER CREDENTIALS IN DATABASE');
    console.log('=' .repeat(60));

    // 1. Check all users with DRIVER role
    console.log('\n📋 1. DRIVER ROLE USERS:');
    const driversQuery = `
      SELECT 
        id,
        email,
        role,
        "passwordHash" IS NOT NULL as has_password,
        LENGTH("passwordHash") as password_length,
        status,
        "emailVerifiedAt" IS NOT NULL as email_verified,
        "createdAt",
        "updatedAt",
        "lastLoginAt"
      FROM users 
      WHERE role = 'DRIVER'
      ORDER BY "createdAt" DESC;
    `;
    
    const driversResult = await client.query(driversQuery);
    
    if (driversResult.rows.length === 0) {
      console.log('❌ No users found with DRIVER role');
    } else {
      console.log(`✅ Found ${driversResult.rows.length} driver(s):`);
      driversResult.rows.forEach((driver, index) => {
        console.log(`\n   Driver ${index + 1}:`);
        console.log(`   - ID: ${driver.id}`);
        console.log(`   - Email: ${driver.email}`);
        console.log(`   - Has Password: ${driver.has_password ? '✅ Yes' : '❌ No'}`);
        console.log(`   - Password Length: ${driver.password_length || 'N/A'}`);
        console.log(`   - Status: ${driver.status}`);
        console.log(`   - Email Verified: ${driver.email_verified ? '✅ Yes' : '❌ No'}`);
        console.log(`   - Created: ${driver.createdAt}`);
        console.log(`   - Last Login: ${driver.lastLoginAt || 'Never'}`);
      });
    }

    // 2. Check driver profiles
    console.log('\n📋 2. DRIVER PROFILES:');
    const profilesQuery = `
      SELECT 
        dp.id as profile_id,
        dp."userId",
        u.email,
        dp."firstName",
        dp."lastName",
        dp.phone,
        dp."licenseNumber",
        dp."licenseExpiry",
        dp."experienceYears",
        dp.status,
        dp."createdAt"
      FROM driver_profiles dp
      LEFT JOIN users u ON dp."userId" = u.id
      ORDER BY dp."createdAt" DESC;
    `;
    
    const profilesResult = await client.query(profilesQuery);
    
    if (profilesResult.rows.length === 0) {
      console.log('❌ No driver profiles found');
    } else {
      console.log(`✅ Found ${profilesResult.rows.length} driver profile(s):`);
      profilesResult.rows.forEach((profile, index) => {
        console.log(`\n   Profile ${index + 1}:`);
        console.log(`   - Profile ID: ${profile.profile_id}`);
        console.log(`   - User ID: ${profile.userId}`);
        console.log(`   - Email: ${profile.email || 'No user linked'}`);
        console.log(`   - Name: ${profile.firstName} ${profile.lastName}`);
        console.log(`   - Phone: ${profile.phone || 'Not set'}`);
        console.log(`   - License: ${profile.licenseNumber || 'Not set'}`);
        console.log(`   - License Expiry: ${profile.licenseExpiry || 'Not set'}`);
        console.log(`   - Experience: ${profile.experienceYears || 'Not set'} years`);
        console.log(`   - Status: ${profile.status || 'Not set'}`);
        console.log(`   - Created: ${profile.createdAt}`);
      });
    }

    // 3. Check for drivers without profiles
    console.log('\n📋 3. DRIVERS WITHOUT PROFILES:');
    const driversWithoutProfilesQuery = `
      SELECT 
        u.id,
        u.email,
        u."createdAt"
      FROM users u
      LEFT JOIN driver_profiles dp ON u.id = dp."userId"
      WHERE u.role = 'DRIVER' AND dp.id IS NULL
      ORDER BY u."createdAt" DESC;
    `;
    
    const driversWithoutProfilesResult = await client.query(driversWithoutProfilesQuery);
    
    if (driversWithoutProfilesResult.rows.length === 0) {
      console.log('✅ All drivers have profiles');
    } else {
      console.log(`⚠️ Found ${driversWithoutProfilesResult.rows.length} driver(s) without profiles:`);
      driversWithoutProfilesResult.rows.forEach((driver, index) => {
        console.log(`   ${index + 1}. ID: ${driver.id}, Email: ${driver.email}, Created: ${driver.createdAt}`);
      });
    }

    // 4. Check for profiles without users
    console.log('\n📋 4. PROFILES WITHOUT USERS:');
    const profilesWithoutUsersQuery = `
      SELECT 
        dp.id,
        dp."userId",
        dp."firstName",
        dp."lastName",
        dp."createdAt"
      FROM driver_profiles dp
      LEFT JOIN users u ON dp."userId" = u.id
      WHERE u.id IS NULL
      ORDER BY dp."createdAt" DESC;
    `;
    
    const profilesWithoutUsersResult = await client.query(profilesWithoutUsersQuery);
    
    if (profilesWithoutUsersResult.rows.length === 0) {
      console.log('✅ All profiles have valid users');
    } else {
      console.log(`⚠️ Found ${profilesWithoutUsersResult.rows.length} profile(s) without valid users:`);
      profilesWithoutUsersResult.rows.forEach((profile, index) => {
        console.log(`   ${index + 1}. Profile ID: ${profile.id}, User ID: ${profile.userId}, Name: ${profile.firstName} ${profile.lastName}`);
      });
    }

    // 5. Check password patterns
    console.log('\n📋 5. PASSWORD ANALYSIS:');
    const passwordAnalysisQuery = `
      SELECT 
        COUNT(*) as total_drivers,
        COUNT(CASE WHEN "passwordHash" IS NOT NULL THEN 1 END) as with_password,
        COUNT(CASE WHEN "passwordHash" IS NULL THEN 1 END) as without_password,
        AVG(LENGTH("passwordHash")) as avg_password_length,
        MIN(LENGTH("passwordHash")) as min_password_length,
        MAX(LENGTH("passwordHash")) as max_password_length
      FROM users 
      WHERE role = 'DRIVER';
    `;
    
    const passwordAnalysisResult = await client.query(passwordAnalysisQuery);
    const analysis = passwordAnalysisResult.rows[0];
    
    console.log(`   - Total Drivers: ${analysis.total_drivers}`);
    console.log(`   - With Password: ${analysis.with_password}`);
    console.log(`   - Without Password: ${analysis.without_password}`);
    console.log(`   - Average Password Length: ${Math.round(analysis.avg_password_length || 0)}`);
    console.log(`   - Min Password Length: ${analysis.min_password_length || 'N/A'}`);
    console.log(`   - Max Password Length: ${analysis.max_password_length || 'N/A'}`);

    // 6. Check recent login activity
    console.log('\n📋 6. RECENT LOGIN ACTIVITY:');
    const recentLoginsQuery = `
      SELECT 
        email,
        "lastLoginAt",
        "createdAt",
        CASE 
          WHEN "lastLoginAt" IS NULL THEN 'Never logged in'
          WHEN "lastLoginAt" > NOW() - INTERVAL '7 days' THEN 'Active (last 7 days)'
          WHEN "lastLoginAt" > NOW() - INTERVAL '30 days' THEN 'Recent (last 30 days)'
          ELSE 'Inactive (30+ days ago)'
        END as activity_status
      FROM users 
      WHERE role = 'DRIVER'
      ORDER BY "lastLoginAt" DESC NULLS LAST;
    `;
    
    const recentLoginsResult = await client.query(recentLoginsQuery);
    
    if (recentLoginsResult.rows.length > 0) {
      console.log('   Login Activity Summary:');
      const activityCounts = {};
      recentLoginsResult.rows.forEach(row => {
        activityCounts[row.activity_status] = (activityCounts[row.activity_status] || 0) + 1;
      });
      
      Object.entries(activityCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} driver(s)`);
      });
      
      console.log('\n   Recent Logins:');
      recentLoginsResult.rows.slice(0, 5).forEach((driver, index) => {
        console.log(`   ${index + 1}. ${driver.email} - ${driver.lastLoginAt || 'Never'} (${driver.activity_status})`);
      });
    }

    // 7. Check for test/demo drivers
    console.log('\n📋 7. TEST/DEMO DRIVERS:');
    const testDriversQuery = `
      SELECT 
        id,
        email,
        created_at
      FROM users 
      WHERE role = 'DRIVER' 
        AND (
          email ILIKE '%test%' 
          OR email ILIKE '%demo%' 
          OR email ILIKE '%example%'
          OR email ILIKE '%@test.%'
        )
      ORDER BY created_at DESC;
    `;
    
    const testDriversResult = await client.query(testDriversQuery);
    
    if (testDriversResult.rows.length === 0) {
      console.log('✅ No test/demo drivers found');
    } else {
      console.log(`⚠️ Found ${testDriversResult.rows.length} test/demo driver(s):`);
      testDriversResult.rows.forEach((driver, index) => {
        console.log(`   ${index + 1}. ${driver.email} (ID: ${driver.id})`);
      });
    }

    // 8. Summary and recommendations
    console.log('\n📋 8. SUMMARY & RECOMMENDATIONS:');
    console.log('=' .repeat(60));
    
    const totalDrivers = driversResult.rows.length;
    const driversWithPasswords = driversResult.rows.filter(d => d.has_password).length;
    const activeDrivers = driversResult.rows.filter(d => d.is_active).length;
    const verifiedDrivers = driversResult.rows.filter(d => d.email_verified).length;
    
    console.log(`📊 Statistics:`);
    console.log(`   - Total Drivers: ${totalDrivers}`);
    console.log(`   - With Passwords: ${driversWithPasswords}/${totalDrivers} (${Math.round(driversWithPasswords/totalDrivers*100) || 0}%)`);
    console.log(`   - Active: ${activeDrivers}/${totalDrivers} (${Math.round(activeDrivers/totalDrivers*100) || 0}%)`);
    console.log(`   - Email Verified: ${verifiedDrivers}/${totalDrivers} (${Math.round(verifiedDrivers/totalDrivers*100) || 0}%)`);
    console.log(`   - With Profiles: ${profilesResult.rows.length}/${totalDrivers} (${Math.round(profilesResult.rows.length/totalDrivers*100) || 0}%)`);

    console.log(`\n🔧 Recommendations:`);
    if (totalDrivers === 0) {
      console.log('   ⚠️ No drivers found - consider creating test driver accounts');
    } else {
      if (driversWithPasswords < totalDrivers) {
        console.log(`   ⚠️ ${totalDrivers - driversWithPasswords} driver(s) missing passwords - send password setup emails`);
      }
      if (activeDrivers < totalDrivers) {
        console.log(`   ⚠️ ${totalDrivers - activeDrivers} driver(s) inactive - review account status`);
      }
      if (verifiedDrivers < totalDrivers) {
        console.log(`   ⚠️ ${totalDrivers - verifiedDrivers} driver(s) unverified - send verification emails`);
      }
      if (profilesResult.rows.length < totalDrivers) {
        console.log(`   ⚠️ ${totalDrivers - profilesResult.rows.length} driver(s) missing profiles - create driver profiles`);
      }
      if (driversWithPasswords === totalDrivers && activeDrivers === totalDrivers) {
        console.log('   ✅ All drivers have proper credentials and are active');
      }
    }

  } catch (error) {
    console.error('❌ Error checking driver credentials:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkDriverCredentials().catch(console.error);