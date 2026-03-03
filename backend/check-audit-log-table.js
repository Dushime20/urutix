require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAuditLogTable() {
  try {
    console.log('🔍 Checking for permission_audit_log table...\n');
    
    // Check if table exists
    const existsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'permission_audit_log'
      )
    `);
    
    const exists = existsResult.rows[0].exists;
    console.log('permission_audit_log table exists:', exists);
    
    if (exists) {
      // Get table schema
      const schemaResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'permission_audit_log'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Table schema:');
      console.table(schemaResult.rows);
      
      // Get row count
      const countResult = await pool.query('SELECT COUNT(*) FROM permission_audit_log');
      console.log('\n📊 Row count:', countResult.rows[0].count);
    } else {
      console.log('\n❌ Table does not exist. Need to run migration.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkAuditLogTable();
