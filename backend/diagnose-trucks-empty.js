/**
 * Diagnose Empty Trucks Array
 * 
 * This script checks why trucks are not being returned for a user
 * even though they exist in the database.
 * 
 * Usage: node diagnose-trucks-empty.js <user-email>
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function diagnose(userEmail) {
  console.log('\n🔍 Diagnosing Empty Trucks Array...\n');
  console.log(`User Email: ${userEmail}\n`);

  try {
    // Step 1: Get user info
    console.log('📋 Step 1: Getting user information...');
    const userResult = await pool.query(`
      SELECT id, email, role, "tenantId"
      FROM users
      WHERE email = $1
    `, [userEmail]);

    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${userEmail}\n`);
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant ID: ${user.tenantId}`);
    console.log(`   Tenant ID type: ${typeof user.tenantId}`);
    console.log(`   Tenant ID length: ${user.tenantId?.length || 0}\n`);

    // Step 2: Check all trucks in database
    console.log('📋 Step 2: Checking all trucks in database...');
    const allTrucksResult = await pool.query(`
      SELECT id, "plateNumber", "tenantId", "ownerId", "isActive"
      FROM trucks
      ORDER BY "createdAt" DESC
    `);

    console.log(`✅ Total trucks in database: ${allTrucksResult.rows.length}\n`);

    if (allTrucksResult.rows.length > 0) {
      console.log('   Sample trucks:');
      allTrucksResult.rows.slice(0, 5).forEach((truck, index) => {
        console.log(`   ${index + 1}. ${truck.plateNumber}`);
        console.log(`      ID: ${truck.id}`);
        console.log(`      Tenant ID: ${truck.tenantId}`);
        console.log(`      Owner ID: ${truck.ownerId}`);
        console.log(`      Is Active: ${truck.isActive}`);
      });
      console.log('');
    }

    // Step 3: Check trucks for this tenant
    console.log('📋 Step 3: Checking trucks for this tenant...');
    const tenantTrucksResult = await pool.query(`
      SELECT id, "plateNumber", "tenantId", "ownerId", "isActive"
      FROM trucks
      WHERE "tenantId" = $1
      ORDER BY "createdAt" DESC
    `, [user.tenantId]);

    console.log(`✅ Trucks for tenant ${user.tenantId}: ${tenantTrucksResult.rows.length}\n`);

    if (tenantTrucksResult.rows.length > 0) {
      console.log('   Tenant trucks:');
      tenantTrucksResult.rows.forEach((truck, index) => {
        console.log(`   ${index + 1}. ${truck.plateNumber}`);
        console.log(`      ID: ${truck.id}`);
        console.log(`      Tenant ID: ${truck.tenantId}`);
        console.log(`      Owner ID: ${truck.ownerId}`);
        console.log(`      Is Active: ${truck.isActive}`);
      });
      console.log('');
    }

    // Step 4: Check active trucks for this tenant
    console.log('📋 Step 4: Checking ACTIVE trucks for this tenant...');
    const activeTrucksResult = await pool.query(`
      SELECT id, "plateNumber", "tenantId", "ownerId", "isActive"
      FROM trucks
      WHERE "tenantId" = $1
        AND "isActive" = true
      ORDER BY "createdAt" DESC
    `, [user.tenantId]);

    console.log(`✅ Active trucks for tenant: ${activeTrucksResult.rows.length}\n`);

    if (activeTrucksResult.rows.length > 0) {
      console.log('   Active trucks:');
      activeTrucksResult.rows.forEach((truck, index) => {
        console.log(`   ${index + 1}. ${truck.plateNumber}`);
        console.log(`      ID: ${truck.id}`);
        console.log(`      Tenant ID: ${truck.tenantId}`);
        console.log(`      Owner ID: ${truck.ownerId}`);
      });
      console.log('');
    }

    // Step 5: Check trucks owned by this user
    console.log('📋 Step 5: Checking trucks owned by this user...');
    const userTrucksResult = await pool.query(`
      SELECT id, "plateNumber", "tenantId", "ownerId", "isActive"
      FROM trucks
      WHERE "ownerId" = $1
      ORDER BY "createdAt" DESC
    `, [user.id]);

    console.log(`✅ Trucks owned by user: ${userTrucksResult.rows.length}\n`);

    if (userTrucksResult.rows.length > 0) {
      console.log('   User-owned trucks:');
      userTrucksResult.rows.forEach((truck, index) => {
        console.log(`   ${index + 1}. ${truck.plateNumber}`);
        console.log(`      ID: ${truck.id}`);
        console.log(`      Tenant ID: ${truck.tenantId}`);
        console.log(`      Owner ID: ${truck.ownerId}`);
        console.log(`      Is Active: ${truck.isActive}`);
      });
      console.log('');
    }

    // Step 6: Check for tenant ID mismatches
    console.log('📋 Step 6: Checking for tenant ID mismatches...');
    
    const mismatchedTrucks = allTrucksResult.rows.filter(truck => {
      return truck.ownerId === user.id && truck.tenantId !== user.tenantId;
    });

    if (mismatchedTrucks.length > 0) {
      console.log(`⚠️  Found ${mismatchedTrucks.length} trucks with tenant ID mismatch:`);
      mismatchedTrucks.forEach((truck, index) => {
        console.log(`   ${index + 1}. ${truck.plateNumber}`);
        console.log(`      Truck Tenant ID: ${truck.tenantId}`);
        console.log(`      User Tenant ID: ${user.tenantId}`);
        console.log(`      MISMATCH!`);
      });
      console.log('');
    } else {
      console.log('✅ No tenant ID mismatches found\n');
    }

    // Step 7: Summary and recommendations
    console.log('=' .repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`User: ${user.email} (${user.role})`);
    console.log(`User Tenant ID: ${user.tenantId}`);
    console.log(`Total trucks in DB: ${allTrucksResult.rows.length}`);
    console.log(`Trucks for user's tenant: ${tenantTrucksResult.rows.length}`);
    console.log(`Active trucks for tenant: ${activeTrucksResult.rows.length}`);
    console.log(`Trucks owned by user: ${userTrucksResult.rows.length}`);
    console.log('');

    // Diagnosis
    if (activeTrucksResult.rows.length === 0 && tenantTrucksResult.rows.length > 0) {
      console.log('🔍 DIAGNOSIS: Trucks exist but are INACTIVE');
      console.log('');
      console.log('💡 SOLUTION: Activate the trucks:');
      console.log('   UPDATE trucks');
      console.log(`   SET "isActive" = true`);
      console.log(`   WHERE "tenantId" = '${user.tenantId}';`);
      console.log('');
    } else if (tenantTrucksResult.rows.length === 0 && userTrucksResult.rows.length > 0) {
      console.log('🔍 DIAGNOSIS: Trucks exist but have WRONG TENANT ID');
      console.log('');
      console.log('💡 SOLUTION: Fix the tenant ID:');
      console.log('   UPDATE trucks');
      console.log(`   SET "tenantId" = '${user.tenantId}'`);
      console.log(`   WHERE "ownerId" = '${user.id}';`);
      console.log('');
    } else if (allTrucksResult.rows.length === 0) {
      console.log('🔍 DIAGNOSIS: NO TRUCKS in database');
      console.log('');
      console.log('💡 SOLUTION: Create some trucks for testing');
      console.log('');
    } else if (activeTrucksResult.rows.length > 0) {
      console.log('✅ DIAGNOSIS: Trucks exist and should be visible!');
      console.log('');
      console.log('💡 POSSIBLE ISSUES:');
      console.log('   1. Backend not restarted after code changes');
      console.log('   2. User not logged out and back in (old JWT token)');
      console.log('   3. Frontend cache not cleared');
      console.log('   4. Tenant ID in JWT token different from database');
      console.log('');
      console.log('💡 SOLUTION:');
      console.log('   1. Restart backend');
      console.log('   2. Clear browser cache');
      console.log('   3. Log out and log back in');
      console.log('   4. Check backend console logs for tenant ID');
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Get user email from command line
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('\n❌ Please provide a user email');
  console.log('\nUsage: node diagnose-trucks-empty.js <user-email>');
  console.log('\nExample: node diagnose-trucks-empty.js truck.owner@test.com\n');
  process.exit(1);
}

diagnose(userEmail);
