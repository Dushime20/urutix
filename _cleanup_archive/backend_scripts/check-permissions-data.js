const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkPermissionsData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking permissions and roles data...\n');

    // Check if tables exist
    console.log('📋 Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('roles', 'permissions', 'role_permissions')
      ORDER BY table_name;
    `);
    console.log('Tables found:', tablesResult.rows.map(r => r.table_name));
    console.log('');

    // Check roles
    console.log('👥 Checking roles...');
    const rolesResult = await client.query('SELECT * FROM roles ORDER BY name');
    console.log(`Found ${rolesResult.rows.length} roles:`);
    rolesResult.rows.forEach(role => {
      console.log(`  - ${role.name} (${role.id}) - System: ${role.is_system}`);
    });
    console.log('');

    // Check permissions
    console.log('🔐 Checking permissions...');
    const permissionsResult = await client.query('SELECT * FROM permissions ORDER BY name LIMIT 20');
    console.log(`Found ${permissionsResult.rows.length} permissions (showing first 20):`);
    permissionsResult.rows.forEach(perm => {
      console.log(`  - ${perm.name} (${perm.id})`);
    });
    
    const totalPermsResult = await client.query('SELECT COUNT(*) FROM permissions');
    console.log(`Total permissions in database: ${totalPermsResult.rows[0].count}`);
    console.log('');

    // Check role_permissions
    console.log('🔗 Checking role_permissions...');
    const rolePermsResult = await client.query(`
      SELECT role, COUNT(*) as permission_count
      FROM role_permissions
      GROUP BY role
      ORDER BY role;
    `);
    console.log(`Role permission assignments:`);
    rolePermsResult.rows.forEach(rp => {
      console.log(`  - ${rp.role}: ${rp.permission_count} permissions`);
    });
    console.log('');

    // Check if permissions table is empty
    if (permissionsResult.rows.length === 0) {
      console.log('⚠️  WARNING: Permissions table is EMPTY!');
      console.log('   You need to seed permissions first.');
      console.log('   Run: node backend/seed-permissions.js');
      console.log('');
    }

    // Check if roles table is empty
    if (rolesResult.rows.length === 0) {
      console.log('⚠️  WARNING: Roles table is EMPTY!');
      console.log('   You need to seed roles first.');
      console.log('   Run: node backend/seed-roles.js');
      console.log('');
    }

    // Check API endpoint response
    console.log('🌐 Testing API endpoint structure...');
    console.log('   The frontend expects: /api/admin/permissions/roles/matrix');
    console.log('   Response should have: { roles: [...], permissions: [...] }');
    console.log('');

    // Show sample query for matrix endpoint
    console.log('📊 Sample query for permission matrix:');
    const matrixQuery = `
      SELECT 
        r.id as role_id,
        r.name as role_name,
        r.description as role_description,
        r.is_system,
        json_agg(
          json_build_object(
            'id', p.id,
            'name', p.name,
            'resource', p.resource,
            'action', p.action,
            'description', p.description,
            'category', p.category
          )
        ) FILTER (WHERE p.id IS NOT NULL) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.name = rp.role
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY r.id, r.name, r.description, r.is_system
      ORDER BY r.name;
    `;
    
    const matrixResult = await client.query(matrixQuery);
    console.log(`Matrix query returned ${matrixResult.rows.length} roles`);
    if (matrixResult.rows.length > 0) {
      console.log('Sample role:', JSON.stringify(matrixResult.rows[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPermissionsData();
