require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running Email Templates Migration...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '008_email_templates.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ Email templates table created successfully!\n');
    
    // Verify table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'email_templates'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: email_templates table exists\n');
      
      // Show table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'email_templates'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Table Structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
      });
      
      console.log('\n✨ Migration completed successfully!');
      console.log('\n📝 Next step: Run seed script to populate templates');
      console.log('   Command: node seed-email-templates.js\n');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
