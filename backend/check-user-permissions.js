const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUserPermissions() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking user permissions...\n');

    // Get the user you're logged in as
    // Try to get from command line argument, otherwise prompt
    const userEmail = process.argv[2] || 'admin@test.com'; // Pass email as argument: node check-user-permissions.js user@email.com
    
    const userResult = await client.query(`
      SELECT id, email, role, "tenantId"
      FROM users
      WHERE email = $1
    `, [userEmail]);

    if (userResult.rows.length === 0) {
      console.log(`❌ User ${userEmail} not found`);
      return;
    }

    const user = userResult.rows[0];
    console.log('👤 User Information:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Tenant ID: ${user.tenantId}`);
    console.log(`   User ID: ${user.id}`);

    // Check if the role has truck:view permission
    console.log('\n📊 Checking permissions for role:', user.role);
    const permissionsResult = await client.query(`
      SELECT p.id, p.name, p.resource, p.action, p.description
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role = $1 AND p.resource = 'truck'
      ORDER BY p.action
    `, [user.role]);

    if (permissionsResult.rows.length === 0) {
      console.log(`   ❌ Role ${user.role} has NO truck permissions!`);
      console.log(`   This is why you're getting the 403 error.`);
    } else {
      console.log(`   ✅ Role ${user.role} has ${permissionsResult.rows.length} truck permissions:`);
      permissionsResult.rows.forEach(perm => {
        console.log(`      - ${perm.name} (${perm.resource}:${perm.action})`);
      });
    }

    // Check specifically for truck:view
    const truckViewResult = await client.query(`
      SELECT p.id, p.name, p.resource, p.action
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role = $1 AND p.resource = 'truck' AND p.action = 'view'
    `, [user.role]);

    console.log('\n🔍 Checking specifically for truck:view permission:');
    if (truckViewResult.rows.length === 0) {
      console.log(`   ❌ Role ${user.role} does NOT have truck:view permission`);
      console.log(`   Adding it now...`);
      
      // Get the truck:view permission ID
      const permResult = await client.query(`
        SELECT id FROM permissions WHERE resource = 'truck' AND action = 'view'
      `);
      
      if (permResult.rows.length > 0) {
        const permId = permResult.rows[0].id;
        
        // Add to role
        await client.query(`
          INSERT INTO role_permissions (role, permission_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [user.role, permId]);
        
        console.log(`   ✅ Added truck:view permission to ${user.role}`);
      } else {
        console.log(`   ❌ truck:view permission doesn't exist in database!`);
      }
    } else {
      console.log(`   ✅ Role ${user.role} HAS truck:view permission`);
    }

    // List all roles and their truck:view status
    console.log('\n📊 All roles and their truck:view permission status:');
    const allRolesResult = await client.query(`
      SELECT DISTINCT r.name as role_name
      FROM roles r
      ORDER BY r.name
    `);

    for (const role of allRolesResult.rows) {
      const hasPermResult = await client.query(`
        SELECT COUNT(*) as count
        FROM role_permissions rp
        JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role = $1 AND p.resource = 'truck' AND p.action = 'view'
      `, [role.role_name]);
      
      const hasPerm = hasPermResult.rows[0].count > 0;
      console.log(`   ${hasPerm ? '✅' : '❌'} ${role.role_name}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserPermissions();
