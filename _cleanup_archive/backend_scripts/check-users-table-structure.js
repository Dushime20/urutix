const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkUsersTableStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CHECKING USERS TABLE STRUCTURE');
    console.log('=' .repeat(50));

    // Check if users table exists and get its structure
    const tableInfoQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const result = await client.query(tableInfoQuery);
    
    if (result.rows.length === 0) {
      console.log('❌ Users table not found');
      return;
    }

    console.log('✅ Users table structure:');
    result.rows.forEach((column, index) => {
      console.log(`   ${index + 1}. ${column.column_name} (${column.data_type}) - ${column.is_nullable === 'YES' ? 'Nullable' : 'Not Null'}`);
    });

    // Check for driver-related columns
    const driverColumns = result.rows.filter(col => 
      col.column_name.toLowerCase().includes('password') ||
      col.column_name.toLowerCase().includes('role') ||
      col.column_name.toLowerCase().includes('driver')
    );

    console.log('\n🚛 Driver-related columns:');
    if (driverColumns.length === 0) {
      console.log('❌ No driver-related columns found');
    } else {
      driverColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }

    // Check if there are any users at all
    console.log('\n👥 User count check:');
    const countQuery = 'SELECT COUNT(*) as total FROM users';
    const countResult = await client.query(countQuery);
    console.log(`   Total users: ${countResult.rows[0].total}`);

    // Check for role column values
    if (result.rows.some(col => col.column_name === 'role')) {
      console.log('\n📋 Role distribution:');
      const roleQuery = `
        SELECT 
          role,
          COUNT(*) as count
        FROM users 
        GROUP BY role
        ORDER BY count DESC;
      `;
      const roleResult = await client.query(roleQuery);
      roleResult.rows.forEach(row => {
        console.log(`   - ${row.role}: ${row.count} user(s)`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsersTableStructure().catch(console.error);