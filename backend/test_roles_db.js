const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_NAME || 'urutix'
  });

  await client.connect();
  try {
    const resRoles = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'roles'");
    console.log('Roles:', resRoles.rows);
    const resRP = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'role_permissions'");
    console.log('Role Permissions:', resRP.rows);
    
    // Test the exact query from PermissionService.getAllRoles
    const testQuery = `
      SELECT r.id, r.name, r.description, r.is_system as "isSystem", r.created_at as "createdAt", r.updated_at as "updatedAt"
      FROM roles r
      ORDER BY r.is_system DESC, r.name ASC
    `;
    try {
        await client.query(testQuery);
        console.log('Test role query worked');
    } catch(err) {
        console.error('Test role query error:', err.message);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

check();
