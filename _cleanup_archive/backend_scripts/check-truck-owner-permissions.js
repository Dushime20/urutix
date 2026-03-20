#!/usr/bin/env node

const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: '123',
    database: 'urutix',
  });

  try {
    console.log('🔍 Checking TRUCK_OWNER permissions...\n');

    // Check if TRUCK_OWNER role exists
    const roleResult = await pool.query(`
      SELECT id, name, description FROM roles WHERE name = 'TRUCK_OWNER'
    `);

    if (roleResult.rows.length === 0) {
      console.log(`❌ TRUCK_OWNER role not found!`);
      await pool.end();
      process.exit(1);
    }

    const role = roleResult.rows[0];
    console.log(`✅ Found TRUCK_OWNER role:`);
    console.log(`   ID: ${role.id}`);
    console.log(`   Name: ${role.name}`);
    console.log(`   Description: ${role.description}\n`);

    // Check permissions for TRUCK_OWNER role
    const permissionsResult = await pool.query(`
      SELECT p.id, p.resource, p.action, p.description
      FROM role_permissions rp
      JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role = $1
      ORDER BY p.resource, p.action
    `, ['TRUCK_OWNER']);

    console.log(`📋 Found ${permissionsResult.rows.length} permissions for TRUCK_OWNER:\n`);
    
    if (permissionsResult.rows.length === 0) {
      console.log(`⚠️ No permissions assigned to TRUCK_OWNER role!`);
      console.log(`\n   This is the problem! The role has no permissions.`);
      console.log(`   Need to add truck:view permission.\n`);
    } else {
      permissionsResult.rows.forEach((perm, index) => {
        console.log(`${index + 1}. ${perm.resource}:${perm.action}`);
        console.log(`   Description: ${perm.description}`);
      });
    }

    // Check if truck:view permission exists
    console.log(`\n🔍 Checking if truck:view permission exists...\n`);
    const truckViewResult = await pool.query(`
      SELECT id, resource, action FROM permissions 
      WHERE resource = 'truck' AND action = 'view'
    `);

    if (truckViewResult.rows.length > 0) {
      console.log(`✅ truck:view permission exists`);
      console.log(`   ID: ${truckViewResult.rows[0].id}`);
    } else {
      console.log(`❌ truck:view permission does not exist!`);
    }

    // Check all available permissions
    console.log(`\n📋 All available permissions:\n`);
    const allPermsResult = await pool.query(`
      SELECT resource, action, COUNT(*) as count
      FROM permissions
      GROUP BY resource, action
      ORDER BY resource, action
    `);

    allPermsResult.rows.forEach((perm) => {
      console.log(`   ${perm.resource}:${perm.action}`);
    });

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
