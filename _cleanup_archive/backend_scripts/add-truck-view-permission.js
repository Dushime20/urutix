const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addTruckViewPermission() {
  const client = await pool.connect();
  try {
    console.log('🔧 Adding truck:view permission...\n');

    // Create truck:view permission
    // First check if it exists
    const checkResult = await client.query(`
      SELECT id, name, resource, action
      FROM permissions
      WHERE resource = 'truck' AND action = 'view'
    `);

    let permissionId;
    if (checkResult.rows.length > 0) {
      console.log('✅ Permission already exists:');
      console.log(`   ${checkResult.rows[0].name} (${checkResult.rows[0].resource}:${checkResult.rows[0].action})`);
      console.log(`   ID: ${checkResult.rows[0].id}`);
      permissionId = checkResult.rows[0].id;
    } else {
      const insertResult = await client.query(`
        INSERT INTO permissions (name, resource, action, description, category)
        VALUES ('View Trucks', 'truck', 'view', 'View truck information', 'Fleet Management')
        RETURNING id, name, resource, action
      `);

      console.log('✅ Permission created:');
      console.log(`   ${insertResult.rows[0].name} (${insertResult.rows[0].resource}:${insertResult.rows[0].action})`);
      console.log(`   ID: ${insertResult.rows[0].id}`);
      permissionId = insertResult.rows[0].id;
    }

    // Add to ADMIN, TRUCK_OWNER, and SUPER_ADMIN roles
    const rolesToUpdate = ['ADMIN', 'TRUCK_OWNER', 'SUPER_ADMIN'];
    
    console.log('\n🔧 Adding truck:view permission to roles...');
    for (const roleName of rolesToUpdate) {
      const roleResult = await client.query(`
        SELECT id FROM roles WHERE name = $1
      `, [roleName]);

      if (roleResult.rows.length === 0) {
        console.log(`   ⚠️ Role ${roleName} not found, skipping...`);
        continue;
      }

      const roleId = roleResult.rows[0].id;

      try {
        // Check if already exists
        const checkRolePermission = await client.query(`
          SELECT * FROM role_permissions
          WHERE role = $1 AND permission_id = $2
        `, [roleName, permissionId]);

        if (checkRolePermission.rows.length > 0) {
          console.log(`   ✅ ${roleName} already has permission`);
        } else {
          await client.query(`
            INSERT INTO role_permissions (role, permission_id)
            VALUES ($1, $2)
          `, [roleName, permissionId]);
          console.log(`   ✅ Added to ${roleName}`);
        }
      } catch (err) {
        console.log(`   ⚠️ ${roleName} - ${err.message}`);
      }
    }

    // Verify
    console.log('\n📊 Verification - Roles with truck:view permission:');
    const verifyResult = await client.query(`
      SELECT rp.role as role_name, p.name as permission_name, p.resource, p.action
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE p.resource = 'truck' AND p.action = 'view'
      ORDER BY rp.role
    `);

    if (verifyResult.rows.length === 0) {
      console.log('   ❌ No roles have truck:view permission!');
    } else {
      verifyResult.rows.forEach(row => {
        console.log(`   ✅ ${row.role_name} has ${row.permission_name}`);
      });
    }

    console.log('\n✅ Setup complete!');
    console.log('\n⚠️ IMPORTANT: You may need to log out and log back in for permissions to take effect!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

addTruckViewPermission();
