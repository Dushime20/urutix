/**
 * Test Permission Helper
 */

const { Client } = require('pg');
require('dotenv').config();

async function testPermissionHelper() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const roleName = 'CARGO_OWNER';
    
    // Test the exact query that PermissionHelper uses
    console.log(`\n🔍 Testing PermissionHelper query for ${roleName}:`);
    console.log('================================================');
    
    const result = await client.query(
      `SELECT p.resource || ':' || p.action as permission
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role = $1
       ORDER BY p.resource, p.action`,
      [roleName]
    );
    
    console.log(`✅ Found ${result.rows.length} permissions:`);
    result.rows.forEach(row => {
      console.log(`- ${row.permission}`);
    });

    // Check specifically for analytics permissions
    const analyticsPermissions = result.rows
      .map(r => r.permission)
      .filter(p => p.startsWith('analytics:'));
    
    console.log(`\n📊 Analytics permissions for ${roleName}:`);
    console.log('=========================================');
    console.log(`Found ${analyticsPermissions.length} analytics permissions:`);
    analyticsPermissions.forEach(perm => {
      console.log(`- ${perm}`);
    });

    // Test specific permission checks
    const testPermissions = ['analytics:view', 'analytics:insights'];
    console.log(`\n🧪 Testing specific permissions:`);
    console.log('===============================');
    
    const allPermissions = result.rows.map(r => r.permission);
    testPermissions.forEach(testPerm => {
      const hasPermission = allPermissions.includes(testPerm);
      console.log(`${testPerm}: ${hasPermission ? '✅ HAS' : '❌ MISSING'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

testPermissionHelper();