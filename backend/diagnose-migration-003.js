/**
 * Diagnose Migration 003 Issue
 */

const { Client } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
};

async function diagnose() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Check if tables exist
    const tables = ['permissions', 'role_permissions', 'user_permissions', 'permission_audit_log'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      console.log(`Table "${table}": ${result.rows[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
      
      if (result.rows[0].exists) {
        // Check columns
        const columns = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        console.log(`  Columns: ${columns.rows.map(c => c.column_name).join(', ')}`);
      }
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

diagnose();
