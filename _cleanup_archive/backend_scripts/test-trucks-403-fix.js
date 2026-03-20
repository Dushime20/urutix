/**
 * Test Trucks 403 Fix
 * 
 * This script tests if the trucks 403 error has been fixed by:
 * 1. Checking if permissions exist in database
 * 2. Checking if JWT strategy sets userId
 * 3. Simulating a login and checking token structure
 * 
 * Usage: node test-trucks-403-fix.js
 */

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testFix() {
  console.log('\n🔍 Testing Trucks 403 Fix...\n');

  try {
    // Test 1: Check if truck:view permission exists
    console.log('📋 Test 1: Checking if truck:view permission exists...');
    const permissionResult = await pool.query(`
      SELECT id, resource, action, description
      FROM permissions
      WHERE resource = 'truck' AND action = 'view'
    `);

    if (permissionResult.rows.length === 0) {
      console.log('❌ FAIL: truck:view permission not found in database');
      console.log('   Run: node add-truck-view-permission.js\n');
      return false;
    }

    const permission = permissionResult.rows[0];
    console.log(`✅ PASS: truck:view permission exists (ID: ${permission.id})`);

    // Test 2: Check if TRUCK_OWNER role has the permission
    console.log('\n📋 Test 2: Checking if TRUCK_OWNER role has truck:view permission...');
    const rolePermissionResult = await pool.query(`
      SELECT rp.role, p.resource, p.action
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role = 'TRUCK_OWNER' AND p.resource = 'truck' AND p.action = 'view'
    `);

    if (rolePermissionResult.rows.length === 0) {
      console.log('❌ FAIL: TRUCK_OWNER role does not have truck:view permission');
      console.log('   Run: node add-truck-view-permission.js\n');
      return false;
    }

    console.log('✅ PASS: TRUCK_OWNER role has truck:view permission');

    // Test 3: Check if any truck owners exist
    console.log('\n📋 Test 3: Checking if truck owner users exist...');
    const truckOwnerResult = await pool.query(`
      SELECT id, email, role, "tenantId"
      FROM users
      WHERE role = 'TRUCK_OWNER'
      LIMIT 5
    `);

    if (truckOwnerResult.rows.length === 0) {
      console.log('⚠️  WARNING: No truck owner users found in database');
      console.log('   You may need to create a truck owner account\n');
    } else {
      console.log(`✅ PASS: Found ${truckOwnerResult.rows.length} truck owner(s):`);
      truckOwnerResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
      });
    }

    // Test 4: Check if trucks exist
    console.log('\n📋 Test 4: Checking if trucks exist in database...');
    const trucksResult = await pool.query(`
      SELECT COUNT(*) as count FROM trucks
    `);

    const truckCount = parseInt(trucksResult.rows[0].count);
    if (truckCount === 0) {
      console.log('⚠️  WARNING: No trucks found in database');
      console.log('   You may need to create some trucks to test\n');
    } else {
      console.log(`✅ PASS: Found ${truckCount} truck(s) in database`);
    }

    // Test 5: Simulate JWT token structure
    console.log('\n📋 Test 5: Simulating JWT token structure...');
    
    // Get permissions for TRUCK_OWNER role
    const permissionsResult = await pool.query(`
      SELECT p.resource, p.action
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role = 'TRUCK_OWNER'
    `);

    const permissions = permissionsResult.rows.map(p => `${p.resource}:${p.action}`);
    
    console.log(`   Found ${permissions.length} permissions for TRUCK_OWNER role`);
    
    if (permissions.includes('truck:view')) {
      console.log('   ✅ truck:view is in permissions list');
    } else {
      console.log('   ❌ truck:view is NOT in permissions list');
      return false;
    }

    // Simulate JWT payload
    const mockPayload = {
      sub: 'mock-user-id',
      email: 'truck.owner@test.com',
      role: 'TRUCK_OWNER',
      tenantId: 'mock-tenant-id',
      permissions: permissions,
    };

    console.log('\n   Mock JWT Payload:');
    console.log('   {');
    console.log(`     sub: "${mockPayload.sub}",`);
    console.log(`     email: "${mockPayload.email}",`);
    console.log(`     role: "${mockPayload.role}",`);
    console.log(`     tenantId: "${mockPayload.tenantId}",`);
    console.log(`     permissions: [${permissions.length} permissions including "truck:view"]`);
    console.log('   }');

    // Test 6: Check JWT strategy file
    console.log('\n📋 Test 6: Checking JWT strategy implementation...');
    const fs = require('fs');
    const jwtStrategyPath = './src/modules/auth/jwt.strategy.ts';
    
    if (!fs.existsSync(jwtStrategyPath)) {
      console.log('⚠️  WARNING: Cannot find jwt.strategy.ts file');
    } else {
      const jwtStrategyContent = fs.readFileSync(jwtStrategyPath, 'utf8');
      
      const hasUserId = jwtStrategyContent.includes('userId: payload.sub');
      const hasPermissions = jwtStrategyContent.includes('permissions: payload.permissions');
      
      if (hasUserId && hasPermissions) {
        console.log('✅ PASS: JWT strategy sets both userId and permissions');
      } else {
        if (!hasUserId) {
          console.log('❌ FAIL: JWT strategy does not set userId');
        }
        if (!hasPermissions) {
          console.log('❌ FAIL: JWT strategy does not set permissions');
        }
        console.log('   The jwt.strategy.ts file needs to be updated\n');
        return false;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📋 Next Steps:');
    console.log('   1. Rebuild backend: npm run build');
    console.log('   2. Restart backend: npm run start:dev');
    console.log('   3. Clear browser cache and log out');
    console.log('   4. Log back in with truck owner account');
    console.log('   5. Navigate to Fleet Management → Trucks');
    console.log('   6. ✅ Trucks should display without 403 error!\n');

    return true;

  } catch (error) {
    console.error('\n❌ Error running tests:', error.message);
    console.error('Stack:', error.stack);
    return false;
  } finally {
    await pool.end();
  }
}

// Run tests
testFix().then(success => {
  process.exit(success ? 0 : 1);
});
