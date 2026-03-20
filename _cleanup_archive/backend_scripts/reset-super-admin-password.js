const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetSuperAdminPassword() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('='.repeat(60));
    console.log('SUPER ADMIN PASSWORD RESET');
    console.log('='.repeat(60));
    console.log();

    // Get all super admin users
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        role,
        status,
        "tenantId"
      FROM users 
      WHERE role IN ('SUPER_ADMIN', 'ADMIN') 
        AND deleted_at IS NULL
      ORDER BY 
        CASE 
          WHEN role = 'SUPER_ADMIN' THEN 1
          WHEN role = 'ADMIN' THEN 2
          ELSE 3
        END,
        email
    `);

    if (result.rows.length === 0) {
      console.log('❌ No super admin users found in database!');
      rl.close();
      await pool.end();
      return;
    }

    console.log('Found super admin users:\n');
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log();
    });

    // Ask which user to reset
    const userChoice = await question('Enter the number of the user to reset password (or press Enter for #1): ');
    const selectedIndex = userChoice.trim() ? parseInt(userChoice) - 1 : 0;

    if (selectedIndex < 0 || selectedIndex >= result.rows.length) {
      console.log('❌ Invalid selection!');
      rl.close();
      await pool.end();
      return;
    }

    const selectedUser = result.rows[selectedIndex];
    console.log(`\n✓ Selected: ${selectedUser.email}\n`);

    // Ask for new password
    const newPassword = await question('Enter new password (min 8 characters): ');
    
    if (!newPassword || newPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters long!');
      rl.close();
      await pool.end();
      return;
    }

    // Confirm password
    const confirmPassword = await question('Confirm new password: ');
    
    if (newPassword !== confirmPassword) {
      console.log('❌ Passwords do not match!');
      rl.close();
      await pool.end();
      return;
    }

    // Generate bcrypt hash
    console.log('\n⏳ Generating secure password hash...');
    const passwordHash = await bcrypt.hash(newPassword, 14);

    // Update password in database
    console.log('⏳ Updating password in database...');
    await pool.query(
      `UPDATE users 
       SET "passwordHash" = $1, 
           "updatedAt" = NOW(),
           "loginAttempts" = 0,
           "lockedUntil" = NULL
       WHERE id = $2`,
      [passwordHash, selectedUser.id]
    );

    console.log('\n' + '='.repeat(60));
    console.log('✅ PASSWORD RESET SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log();
    console.log('Login Details:');
    console.log(`  Email: ${selectedUser.email}`);
    console.log(`  Password: ${newPassword}`);
    console.log(`  Role: ${selectedUser.role}`);
    console.log();
    console.log('You can now login at:');
    console.log('  http://localhost:5173');
    console.log();
    console.log('⚠️  IMPORTANT: Save these credentials securely!');
    console.log();

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

resetSuperAdminPassword();
