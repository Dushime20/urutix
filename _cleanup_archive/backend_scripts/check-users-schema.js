const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUsersSchema() {
  try {
    console.log('=== CHECKING USERS TABLE SCHEMA ===');
    
    // Check the actual schema of users table
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Users table columns:');
    schemaResult.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if there's a password-related column
    const passwordColumns = schemaResult.rows.filter(col => 
      col.column_name.toLowerCase().includes('password') || 
      col.column_name.toLowerCase().includes('hash')
    );
    
    console.log('\nPassword-related columns:');
    if (passwordColumns.length > 0) {
      passwordColumns.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('- No password columns found');
    }
    
    // Check a sample user record
    const sampleUser = await pool.query(`
      SELECT * FROM users 
      WHERE email = 'deborahrutagengwa.admin@urutix.com'
      LIMIT 1
    `);
    
    if (sampleUser.rows.length > 0) {
      console.log('\nSample user record columns:');
      Object.keys(sampleUser.rows[0]).forEach(key => {
        const value = sampleUser.rows[0][key];
        const displayValue = typeof value === 'string' && value.length > 50 ? 
          value.substring(0, 50) + '...' : value;
        console.log(`- ${key}: ${displayValue}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersSchema();