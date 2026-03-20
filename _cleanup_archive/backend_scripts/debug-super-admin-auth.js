const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: '123',
  database: 'urutix'
});

async function debugSuperAdminAuth() {
  try {
    await client.connect();
    console.log('🔍 Debugging Super Admin Authentication...\n');
    
    // Check the users table structure
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%password%'
      ORDER BY column_name;
    `);
    
    console.log('Password-related columns in users table:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Check the super admin user details
    const user = await client.query(`
      SELECT id, email, role, status, "passwordHash", "createdAt"
      FROM users 
      WHERE email = 'superadmin@urutix.com'
      LIMIT 1;
    `);
    
    if (user.rows.length > 0) {
      const userData = user.rows[0];
      console.log('\n📧 Super Admin User Details:');
      console.log('  ID:', userData.id);
      console.log('  Email:', userData.email);
      console.log('  Role:', userData.role);
      console.log('  Status:', userData.status);
      console.log('  Password Hash:', userData.passwordHash ? userData.passwordHash.substring(0, 20) + '...' : 'NULL');
      console.log('  Created:', userData.createdAt);
      
      // Test password verification
      if (userData.passwordHash) {
        const testPassword = 'Admin@123';
        const isValid = await bcrypt.compare(testPassword, userData.passwordHash);
        console.log(`\n🔑 Password Test (${testPassword}):`, isValid ? '✅ VALID' : '❌ INVALID');
        
        if (!isValid) {
          // Try generating a new hash and updating
          console.log('\n🔧 Generating new password hash...');
          const newHash = await bcrypt.hash(testPassword, 12); // Try lower rounds
          
          await client.query(`
            UPDATE users 
            SET "passwordHash" = $1
            WHERE email = 'superadmin@urutix.com'
          `, [newHash]);
          
          console.log('✅ Updated password hash with bcrypt rounds: 12');
          
          // Test again
          const isValidNow = await bcrypt.compare(testPassword, newHash);
          console.log(`🔑 New Password Test:`, isValidNow ? '✅ VALID' : '❌ INVALID');
        }
      } else {
        console.log('\n❌ No password hash found!');
      }
    } else {
      console.log('\n❌ Super admin user not found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

debugSuperAdminAuth();