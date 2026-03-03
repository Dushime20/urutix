const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTruckOwnerUsers() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking for TRUCK_OWNER users...\n');

    // Get all TRUCK_OWNER users
    const usersResult = await client.query(`
      SELECT id, email, role, "tenantId"
      FROM users
      WHERE role = 'TRUCK_OWNER'
      ORDER BY email
    `);

    if (usersResult.rows.length === 0) {
      console.log('❌ No TRUCK_OWNER users found in database!');
      console.log('\n📊 Let me check what roles exist:');
      
      const rolesResult = await client.query(`
        SELECT DISTINCT role, COUNT(*) as count
        FROM users
        GROUP BY role
        ORDER BY role
      `);
      
      console.log('\nRoles in database:');
      rolesResult.rows.forEach(row => {
        console.log(`   ${row.role}: ${row.count} users`);
      });
      
      return;
    }

    console.log(`✅ Found ${usersResult.rows.length} TRUCK_OWNER user(s):\n`);
    
    for (const user of usersResult.rows) {
      console.log(`👤 User: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Tenant ID: ${user.tenantId}`);
      console.log(`   User ID: ${user.id}`);
      
      // Check if this user has truck:view permission
      const permResult = await client.query(`
        SELECT p.name, p.resource, p.action
        FROM role_permissions rp
        JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role = 'TRUCK_OWNER' AND p.resource = 'truck' AND p.action = 'view'
      `);
      
      if (permResult.rows.length > 0) {
        console.log(`   ✅ Has truck:view permission`);
      } else {
        console.log(`   ❌ Missing truck:view permission`);
      }
      
      // Check how many trucks this user owns
      const trucksResult = await client.query(`
        SELECT COUNT(*) as count
        FROM trucks
        WHERE "ownerId" = $1 AND "tenantId" = $2
      `, [user.id, user.tenantId]);
      
      console.log(`   🚛 Owns ${trucksResult.rows[0].count} trucks`);
      
      // Check total trucks in tenant
      const tenantTrucksResult = await client.query(`
        SELECT COUNT(*) as count
        FROM trucks
        WHERE "tenantId" = $1
      `, [user.tenantId]);
      
      console.log(`   📊 Total trucks in tenant: ${tenantTrucksResult.rows[0].count}`);
      console.log('');
    }

    // Check if TRUCK_OWNER role has truck:view permission
    console.log('\n📊 Checking TRUCK_OWNER role permissions:');
    const rolePermResult = await client.query(`
      SELECT p.name, p.resource, p.action, p.description
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role = 'TRUCK_OWNER' AND p.resource = 'truck'
      ORDER BY p.action
    `);

    if (rolePermResult.rows.length === 0) {
      console.log('   ❌ TRUCK_OWNER role has NO truck permissions!');
    } else {
      console.log(`   ✅ TRUCK_OWNER role has ${rolePermResult.rows.length} truck permissions:`);
      rolePermResult.rows.forEach(perm => {
        console.log(`      - ${perm.name} (${perm.resource}:${perm.action})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTruckOwnerUsers();
