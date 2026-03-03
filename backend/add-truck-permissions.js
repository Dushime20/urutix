const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addTruckPermissions() {
  const client = await pool.connect();
  try {
    console.log('🔧 Adding truck permissions to roles...\n');

    // First, check if truck permissions exist
    const permissionsCheck = await client.query(`
      SELECT id, name, resource, action
      FROM permissions
      WHERE resource = 'truck'
      ORDER BY action
    `);

    console.log('📊 Existing truck permissions:');
    if (permissionsCheck.rows.length === 0) {
      console.log('   ⚠️ No truck permissions found! Creating them...');
      
      // Create truck permissions
      const truckPermissions = [
        { name: 'View Trucks', resource: 'truck', action: 'view', description: 'View truck information' },
        { name: 'Create Trucks', resource: 'truck', action: 'create', description: 'Create new trucks' },
        { name: 'Update Trucks', resource: 'truck', action: 'update', description: 'Update truck information' },
        { name: 'Delete Trucks', resource: 'truck', action: 'delete', description: 'Delete trucks' },
        { name: 'Manage Trucks', resource: 'truck', action: 'manage', description: 'Full truck management' },
      ];

      for (const perm of truckPermissions) {
        await client.query(`
          INSERT INTO permissions (name, resource, action, description, category)
          VALUES ($1, $2, $3, $4, 'Fleet Management')
          ON CONFLICT (resource, action) DO NOTHING
        `, [perm.name, perm.resource, perm.action, perm.description]);
        console.log(`   ✅ Created permission: ${perm.name} (${perm.resource}:${perm.action})`);
      }
    } else {
      permissionsCheck.rows.forEach(perm => {
        console.log(`   ${perm.name} (${perm.resource}:${perm.action})`);
      });
    }

    // Get all truck permissions
    const truckPerms = await client.query(`
      SELECT id, name, resource, action
      FROM permissions
      WHERE resource = 'truck'
    `);

    console.log('\n📊 Roles in system:');
    const rolesResult = await client.query(`
      SELECT id, name, description
      FROM roles
      ORDER BY name
    `);
    rolesResult.rows.forEach(role => {
      console.log(`   ${role.name}: ${role.id}`);
    });

    // Add truck permissions to ADMIN, TRUCK_OWNER, and SUPER_ADMIN roles
    const rolesToUpdate = ['ADMIN', 'TRUCK_OWNER', 'SUPER_ADMIN'];
    
    console.log('\n🔧 Adding truck permissions to roles...');
    for (const roleName of rolesToUpdate) {
      const roleResult = await client.query(`
        SELECT id FROM roles WHERE name = $1
      `, [roleName]);

      if (roleResult.rows.length === 0) {
        console.log(`   ⚠️ Role ${roleName} not found, skipping...`);
        continue;
      }

      const roleId = roleResult.rows[0].id;
      console.log(`\n   Adding permissions to ${roleName} (${roleId}):`);

      for (const perm of truckPerms.rows) {
        try {
          await client.query(`
            INSERT INTO role_permissions ("roleId", "permissionId")
            VALUES ($1, $2)
            ON CONFLICT ("roleId", "permissionId") DO NOTHING
          `, [roleId, perm.id]);
          console.log(`      ✅ ${perm.name} (${perm.resource}:${perm.action})`);
        } catch (err) {
          console.log(`      ⚠️ ${perm.name} - already exists or error`);
        }
      }
    }

    // Verify permissions were added
    console.log('\n📊 Verification - Roles with truck:view permission:');
    const verifyResult = await client.query(`
      SELECT r.name as role_name, p.name as permission_name, p.resource, p.action
      FROM role_permissions rp
      JOIN roles r ON r.id = rp."roleId"
      JOIN permissions p ON p.id = rp."permissionId"
      WHERE p.resource = 'truck' AND p.action = 'view'
      ORDER BY r.name
    `);

    if (verifyResult.rows.length === 0) {
      console.log('   ❌ No roles have truck:view permission!');
    } else {
      verifyResult.rows.forEach(row => {
        console.log(`   ✅ ${row.role_name} has ${row.permission_name}`);
      });
    }

    console.log('\n✅ Truck permissions setup complete!');
    console.log('\n⚠️ IMPORTANT: Restart your backend server for changes to take effect!');

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

addTruckPermissions();
