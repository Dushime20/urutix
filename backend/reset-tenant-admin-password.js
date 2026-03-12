const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function resetTenantAdminPassword() {
  try {
    console.log('=== RESETTING TENANT ADMIN PASSWORD ===');
    
    const email = 'deborahrutagengwa.admin@urutix.com';
    const newPassword = 'password123';
    
    // Check if user exists
    const userResult = await pool.query(`
      SELECT u.id, u.email, u.role, u.status,
             up."firstName", up."lastName"
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE u.email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found:', email);
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Found user:');
    console.log('  Email:', user.email);
    console.log('  Name:', user.firstName, user.lastName);
    console.log('  Role:', user.role);
    console.log('  Status:', user.status);
    
    // Hash the new password
    console.log('\n🔐 Generating password hash...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password
    console.log('💾 Updating password in database...');
    const updateResult = await pool.query(`
      UPDATE users 
      SET "passwordHash" = $1, "updatedAt" = NOW()
      WHERE email = $2
    `, [hashedPassword, email]);
    
    if (updateResult.rowCount > 0) {
      console.log('\n✅ PASSWORD RESET SUCCESSFUL!');
      console.log('');
      console.log('Login Details:');
      console.log('  Email:', email);
      console.log('  Password:', newPassword);
      console.log('  Role:', user.role);
      console.log('');
      console.log('🔗 Login at: http://localhost:5173');
    } else {
      console.log('❌ Failed to update password');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetTenantAdminPassword();