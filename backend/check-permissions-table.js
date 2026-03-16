/**
 * Check Permissions Table Structure
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkPermissionsTable() {
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

    // Check permissions table schema
    console.log('\n📋 Permissions Table Schema:');
    console.log('============================');
    
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'permissions' 
      ORDER BY ordinal_position
    `);

    if (schemaResult.rows.length === 0) {
      console.log('❌ Permissions table not found');
      return;
    }

    schemaResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Check sample permissions
    console.log('\n📋 Sample Permissions:');
    console.log('======================');
    
    const permissionsResult = await client.query(`
      SELECT id, name, resource, action, description, category
      FROM permissions 
      WHERE name LIKE 'analytics:%'
      ORDER BY name
      LIMIT 10
    `);

    if (permissionsResult.rows.length === 0) {
      console.log('❌ No analytics permissions found');
    } else {
      console.log(`✅ Found ${permissionsResult.rows.length} analytics permissions:`);
      permissionsResult.rows.forEach(perm => {
        console.log(`- Name: ${perm.name}`);
        console.log(`  Resource: ${perm.resource || 'NULL'}`);
        console.log(`  Action: ${perm.action || 'NULL'}`);
        console.log(`  Description: ${perm.description || 'NULL'}`);
        console.log(`  Category: ${perm.category || 'NULL'}`);
        console.log('');
      });
    }

    // Check role_permissions table
    console.log('\n🔐 Role Permissions for CARGO_OWNER:');
    console.log('====================================');
    
    const rolePermissionsResult = await client.query(`
      SELECT rp.role, p.name, p.resource, p.action
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = 'CARGO_OWNER' AND p.name LIKE 'analytics:%'
      ORDER BY p.name
    `);

    if (rolePermissionsResult.rows.length === 0) {
      console.log('❌ No analytics permissions found for CARGO_OWNER');
    } else {
      console.log(`✅ Found ${rolePermissionsResult.rows.length} analytics permissions for CARGO_OWNER:`);
      rolePermissionsResult.rows.forEach(perm => {
        console.log(`- ${perm.name} (resource: ${perm.resource || 'NULL'}, action: ${perm.action || 'NULL'})`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkPermissionsTable();