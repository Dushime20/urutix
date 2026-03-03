const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// CONFIGURATION - Edit these values
const EMAIL_TO_RESET = 'admin@urutix.com';  // Change this to your email
const NEW_PASSWORD = 'Admin@2026!';          // Change this to your desired password

async function quickPasswordReset() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('='.repeat(60));
    console.log('QUICK PASSWORD RESET');
    console.log('='.repeat(60));
    console.log();

    // Find user
    console.log(`Looking for user: ${EMAIL_TO_RESET}...`);
    const userResult = await pool.query(
      `SELECT id, email, role, status FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [EMAIL_TO_RESET]
    );

    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${EMAIL_TO_RESET}`);
      console.log();
      console.log('Available super admin users:');
      
      const allAdmins = await pool.query(`
        SELECT email, role, status 
        FROM users 
        WHERE role IN ('SUPER_ADMIN', 'ADMIN') 
          AND deleted_at IS NULL
        ORDER BY role, email
      `);
      
      allAdmins.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
      
      await pool.end();
      return;
    }

    const user = userResult.rows[0];
    console.log(`✓ Found: ${user.email} (${user.role})`);
    console.log();

    // Validate password
    if (NEW_PASSWORD.length < 8) {
      console.log('❌ Password must be at least 8 characters long!');
      await pool.end();
      return;
    }

    // Generate hash
    console.log('⏳ Generating secure password hash...');
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, 14);

    // Update database
    console.log('⏳ Updating password in database...');
    await pool.query(
      `UPDATE users 
       SET "passwordHash" = $1, 
           "updatedAt" = NOW(),
           "loginAttempts" = 0,
           "lockedUntil" = NULL
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    console.log();
    console.log('='.repeat(60));
    console.log('✅ PASSWORD RESET SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log();
    console.log('Login Details:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${NEW_PASSWORD}`);
    console.log(`  Role: ${user.role}`);
    console.log();
    console.log('Login at: http://localhost:5173');
    console.log();
    console.log('⚠️  IMPORTANT: Change the password in the script before committing!');
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

quickPasswordReset();
