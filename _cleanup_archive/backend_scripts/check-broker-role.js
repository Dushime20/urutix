require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function checkBrokerRole() {
  try {
    console.log('🔍 Checking BROKER role setup...\n');
    
    // Check if BROKER role has permissions
    const rolePermsResult = await pool.query(`
      SELECT rp.role, p.name as permission, p.resource, p.action
      FROM role_permissions rp
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = 'BROKER'
      ORDER BY p.resource, p.action
    `);
    
    if (rolePermsResult.rows.length === 0) {
      console.log('❌ BROKER role has NO permissions assigned\n');
    } else {
      console.log(`✅ BROKER role has ${rolePermsResult.rows.length} permissions:\n`);
      console.table(rolePermsResult.rows);
    }
    
    // Check if there are any BROKER users
    const brokerUsersResult = await pool.query(`
      SELECT id, email, role, "createdAt"
      FROM users
      WHERE role = 'BROKER'
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);
    
    console.log(`\n👥 BROKER users in database: ${brokerUsersResult.rows.length}`);
    if (brokerUsersResult.rows.length > 0) {
      console.table(brokerUsersResult.rows);
    }
    
    // Check all available roles with permissions
    const allRolesResult = await pool.query(`
      SELECT rp.role, COUNT(rp.permission_id) as permission_count
      FROM role_permissions rp
      GROUP BY rp.role
      ORDER BY rp.role
    `);
    
    console.log('\n📊 All roles with permission counts:');
    console.table(allRolesResult.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkBrokerRole();
