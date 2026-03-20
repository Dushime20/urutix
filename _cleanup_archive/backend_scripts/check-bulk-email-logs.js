require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123',
});

async function checkBulkEmailLogs() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Bulk Email Logs Setup\n');
    console.log('============================================================\n');
    
    // Check if bulk_email_logs table exists
    console.log('1. Checking if bulk_email_logs table exists...');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'bulk_email_logs'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ bulk_email_logs table does NOT exist\n');
      console.log('📝 Table schema needed:\n');
      console.log(`CREATE TABLE bulk_email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  subject VARCHAR(500) NOT NULL,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);\n`);
      return;
    }
    
    console.log('✅ bulk_email_logs table exists\n');
    
    // Check table structure
    console.log('2. Checking table structure...\n');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bulk_email_logs'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'NO' ? 'not null' : 'nullable'})`);
    });
    
    // Count logs
    console.log('\n3. Counting email logs...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM bulk_email_logs');
    console.log(`   Total logs: ${countResult.rows[0].count}\n`);
    
    if (countResult.rows[0].count > 0) {
      console.log('4. Recent logs:');
      const logs = await client.query(`
        SELECT id, subject, recipients_count, status, created_at
        FROM bulk_email_logs
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      logs.rows.forEach((log, index) => {
        console.log(`\n   ${index + 1}. ${log.subject}`);
        console.log(`      ID: ${log.id}`);
        console.log(`      Recipients: ${log.recipients_count}`);
        console.log(`      Status: ${log.status}`);
        console.log(`      Created: ${log.created_at}`);
      });
    }
    
    console.log('\n============================================================');
    console.log('✅ Check complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkBulkEmailLogs();
