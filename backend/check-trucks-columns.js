const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

(async () => {
  try {
    console.log('\n📋 Checking trucks table structure...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'trucks'
      ORDER BY ordinal_position
    `);
    
    console.log('Trucks table columns:');
    result.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      console.log(`  ✓ ${row.column_name}: ${row.data_type} ${nullable}`);
    });
    
    console.log('\n');
    
    // Check if deletedAt column exists
    const hasDeletedAt = result.rows.some(row => row.column_name === 'deletedAt');
    if (!hasDeletedAt) {
      console.log('❌ CRITICAL: deletedAt column does NOT exist!');
      console.log('   This is causing the query to fail!\n');
    } else {
      console.log('✅ deletedAt column exists\n');
    }
    
    // Check if isActive column exists
    const hasIsActive = result.rows.some(row => row.column_name === 'isActive');
    if (!hasIsActive) {
      console.log('❌ CRITICAL: isActive column does NOT exist!');
      console.log('   This is causing the query to fail!\n');
    } else {
      console.log('✅ isActive column exists\n');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();
