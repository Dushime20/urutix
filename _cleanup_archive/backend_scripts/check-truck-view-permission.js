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
    console.log('🔍 Checking truck:view permission...\n');

    // Check for truck:view permission
    const result = await pool.query(`
      SELECT id, name, resource, action FROM permissions 
      WHERE resource = 'truck' AND action = 'view'
    `);

    if (result.rows.length > 0) {
      const perm = result.rows[0];
      console.log(`✅ Found truck:view permission:`);
      console.log(`   ID: ${perm.id}`);
      console.log(`   Name: ${perm.name}`);
      console.log(`   Resource: ${perm.resource}`);
      console.log(`   Action: ${perm.action}`);
    } else {
      console.log(`❌ truck:view permission not found!`);
    }

    // Check what the PermissionService query would return
    console.log(`\n🔍 Testing PermissionService query for TRUCK_OWNER role:\n`);
    
    const queryResult = await pool.query(`
      SELECT p.name 
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role = 'TRUCK_OWNER'
      ORDER BY p.name
    `);

    console.log(`Found ${queryResult.rows.length} permissions:\n`);
    queryResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
    });

    // Check if 'truck:view' is in the list
    const hasPermission = queryResult.rows.some(row => row.name === 'truck:view');
    console.log(`\n🔍 Does TRUCK_OWNER have 'truck:view' permission? ${hasPermission ? '✅ YES' : '❌ NO'}`);

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
