/**
 * Check User Permissions
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkUserPermissions() {
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

    const email = 'cargo.owner@test.com';
    
    // Get user details
    console.log(`\n👤 User Details for ${email}:`);
    console.log('=====================================');
    
    const userResult = await client.query(`
      SELECT id, email, role, status, "tenantId"
      FROM users 
      WHERE email = $1
    `, [email]);

    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ User found:`);
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Status: ${user.status}`);
    console.log(`- Tenant: ${user.tenantId}`);

    // Check role permissions
    console.log(`\n🔐 Role Permissions for ${user.role}:`);
    console.log('=====================================');
    
    const rolePermissionsResult = await client.query(`
      SELECT p.name as permission_name, p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = $1
      ORDER BY p.name
    `, [user.role]);

    if (rolePermissionsResult.rows.length === 0) {
      console.log(`❌ No permissions found for role ${user.role}`);
    } else {
      console.log(`✅ Found ${rolePermissionsResult.rows.length} permissions:`);
      rolePermissionsResult.rows.forEach(perm => {
        console.log(`- ${perm.permission_name}: ${perm.description || 'No description'}`);
      });
    }

    // Check specifically for analytics permissions
    console.log(`\n📊 Analytics Permissions for ${user.role}:`);
    console.log('==========================================');
    
    const analyticsPermissionsResult = await client.query(`
      SELECT p.name as permission_name, p.description
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = $1 AND p.name LIKE 'analytics:%'
      ORDER BY p.name
    `, [user.role]);

    if (analyticsPermissionsResult.rows.length === 0) {
      console.log(`❌ No analytics permissions found for role ${user.role}`);
    } else {
      console.log(`✅ Found ${analyticsPermissionsResult.rows.length} analytics permissions:`);
      analyticsPermissionsResult.rows.forEach(perm => {
        console.log(`- ${perm.permission_name}: ${perm.description || 'No description'}`);
      });
    }

    // Check all available analytics permissions
    console.log(`\n📋 All Available Analytics Permissions:`);
    console.log('======================================');
    
    const allAnalyticsResult = await client.query(`
      SELECT name, description
      FROM permissions 
      WHERE name LIKE 'analytics:%'
      ORDER BY name
    `);

    if (allAnalyticsResult.rows.length === 0) {
      console.log('❌ No analytics permissions found in system');
    } else {
      console.log(`✅ Found ${allAnalyticsResult.rows.length} analytics permissions in system:`);
      allAnalyticsResult.rows.forEach(perm => {
        console.log(`- ${perm.name}: ${perm.description || 'No description'}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserPermissions();