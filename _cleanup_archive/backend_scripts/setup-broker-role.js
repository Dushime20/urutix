require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function setupBrokerRole() {
  try {
    console.log('🔍 Setting up BROKER role permissions...\n');
    
    // Check current state
    const beforeResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM role_permissions
      WHERE role = 'BROKER'
    `);
    
    console.log(`📊 Current BROKER permissions: ${beforeResult.rows[0].count}\n`);
    
    // Read and execute the SQL file
    console.log('📝 Adding BROKER permissions...');
    const sqlPath = path.join(__dirname, 'add-broker-permissions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ BROKER permissions added successfully\n');
    
    // Check final state
    const afterResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM role_permissions
      WHERE role = 'BROKER'
    `);
    
    console.log(`📊 Final BROKER permissions: ${afterResult.rows[0].count}\n`);
    
    // Show all BROKER permissions
    const permsResult = await pool.query(`
      SELECT p.name, p.resource, p.action, p.description
      FROM role_permissions rp
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = 'BROKER'
      ORDER BY p.resource, p.action
    `);
    
    console.log('📋 BROKER Role Permissions:');
    console.table(permsResult.rows);
    
    // Show summary by resource
    const summaryResult = await pool.query(`
      SELECT p.resource, COUNT(*) as permission_count
      FROM role_permissions rp
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role = 'BROKER'
      GROUP BY p.resource
      ORDER BY permission_count DESC
    `);
    
    console.log('\n📊 Permissions by Resource:');
    console.table(summaryResult.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

setupBrokerRole();
