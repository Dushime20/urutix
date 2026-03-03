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

async function addAuditLogTable() {
  try {
    console.log('🔍 Checking database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database\n');
    
    // Check if table already exists
    const existsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'permission_audit_log'
      )
    `);
    
    if (existsResult.rows[0].exists) {
      console.log('✅ permission_audit_log table already exists');
      return;
    }
    
    console.log('📝 Creating permission_audit_log table...');
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'create-audit-log-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ permission_audit_log table created successfully');
    
    // Verify creation
    const verifyResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'permission_audit_log'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Table schema:');
    console.table(verifyResult.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

addAuditLogTable();
