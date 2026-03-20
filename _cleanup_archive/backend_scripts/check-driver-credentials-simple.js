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
    console.log('🚛 DRIVER CREDENTIALS REPORT');
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

    // 2. Check what driver-related tables exist
    console.log('\n📋 2. AVAILABLE DRIVER-RELATED TABLES:');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name ILIKE '%driver%'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No driver-related tables found');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} driver-related table(s):`);
      tablesResult.rows.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    }

    // 3. Check password patterns
    console.log('\n📋 3. PASSWORD ANALYSIS:');
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

    // 4. Check recent login activity
    console.log('\n📋 4. RECENT LOGIN ACTIVITY:');
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

    // 5. Check for test/demo drivers
    console.log('\n📋 5. TEST/DEMO DRIVERS:');
    const testDriversQuery = `
      SELECT 
        id,
        email,
        "createdAt"
      FROM users 
      WHERE role = 'DRIVER' 
        AND (
          email ILIKE '%test%' 
          OR email ILIKE '%demo%' 
          OR email ILIKE '%example%'
          OR email ILIKE '%@test.%'
        )
      ORDER BY "createdAt" DESC;
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

    // 6. Check user profiles table if it exists
    console.log('\n📋 6. USER PROFILES CHECK:');
    const profilesTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles'
      );
    `;
    
    const profilesTableResult = await client.query(profilesTableQuery);
    
    if (profilesTableResult.rows[0].exists) {
      console.log('✅ user_profiles table exists, checking driver profiles...');
      
      const userProfilesQuery = `
        SELECT 
          up.id as profile_id,
          up."userId",
          u.email,
          up."firstName",
          up."lastName",
          up.phone,
          up."createdAt"
        FROM user_profiles up
        LEFT JOIN users u ON up."userId" = u.id
        WHERE u.role = 'DRIVER'
        ORDER BY up."createdAt" DESC;
      `;
      
      const userProfilesResult = await client.query(userProfilesQuery);
      
      if (userProfilesResult.rows.length === 0) {
        console.log('❌ No driver profiles found in user_profiles table');
      } else {
        console.log(`✅ Found ${userProfilesResult.rows.length} driver profile(s):`);
        userProfilesResult.rows.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.firstName} ${profile.lastName} (${profile.email})`);
        });
      }
    } else {
      console.log('❌ user_profiles table does not exist');
    }

    // 7. Summary and recommendations
    console.log('\n📋 7. SUMMARY & RECOMMENDATIONS:');
    console.log('=' .repeat(60));
    
    const totalDrivers = driversResult.rows.length;
    const driversWithPasswords = driversResult.rows.filter(d => d.has_password).length;
    const verifiedDrivers = driversResult.rows.filter(d => d.email_verified).length;
    const driversWithLogins = driversResult.rows.filter(d => d.lastLoginAt).length;
    
    console.log(`📊 Statistics:`);
    console.log(`   - Total Drivers: ${totalDrivers}`);
    console.log(`   - With Passwords: ${driversWithPasswords}/${totalDrivers} (${Math.round(driversWithPasswords/totalDrivers*100) || 0}%)`);
    console.log(`   - Email Verified: ${verifiedDrivers}/${totalDrivers} (${Math.round(verifiedDrivers/totalDrivers*100) || 0}%)`);
    console.log(`   - Have Logged In: ${driversWithLogins}/${totalDrivers} (${Math.round(driversWithLogins/totalDrivers*100) || 0}%)`);

    console.log(`\n🔧 Recommendations:`);
    if (totalDrivers === 0) {
      console.log('   ⚠️ No drivers found - consider creating test driver accounts');
    } else {
      if (driversWithPasswords < totalDrivers) {
        console.log(`   ⚠️ ${totalDrivers - driversWithPasswords} driver(s) missing passwords - send password setup emails`);
      }
      if (verifiedDrivers < totalDrivers) {
        console.log(`   ⚠️ ${totalDrivers - verifiedDrivers} driver(s) unverified - send verification emails`);
      }
      if (driversWithLogins < totalDrivers) {
        console.log(`   ⚠️ ${totalDrivers - driversWithLogins} driver(s) never logged in - follow up with onboarding`);
      }
      if (driversWithPasswords === totalDrivers && verifiedDrivers === totalDrivers) {
        console.log('   ✅ All drivers have proper credentials and verified emails');
      }
    }

    console.log('\n🔑 Sample Login Credentials for Testing:');
    const activeDrivers = driversResult.rows.filter(d => d.has_password && d.status === 'ACTIVE');
    if (activeDrivers.length > 0) {
      console.log('   Use these emails with password "password123":');
      activeDrivers.slice(0, 3).forEach((driver, index) => {
        console.log(`   ${index + 1}. Email: ${driver.email}`);
      });
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