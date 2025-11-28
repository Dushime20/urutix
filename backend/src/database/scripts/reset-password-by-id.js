#!/usr/bin/env node
const { Pool } = require('pg');

// choose bcrypt implementation available
let bcrypt;
try { bcrypt = require('bcrypt'); } catch (e) { bcrypt = require('bcryptjs'); }

const userId = process.argv[2];
const newPassword = process.argv[3] || 'Password123!';

if (!userId) {
  console.error('❌ Usage: node reset-password-by-id.js <userId> [newPassword]');
  console.error('   Example: node reset-password-by-id.js beeb08b9-8d2a-43a5-9ae7-a7b63fecfb07 Password123!');
  process.exit(2);
}

const dbConfig = {
  user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'urutix',
  password: process.env.DB_PASSWORD || '123',
  port: parseInt(process.env.DB_PORT || '5433', 10),
};

async function run() {
  const pool = new Pool(dbConfig);
  try {
    console.log('🔌 Connecting to database...');
    
    // First, check if user exists
    const userCheck = await pool.query('SELECT id, email, role, status FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rowCount === 0) {
      console.error(`❌ User not found with ID: ${userId}`);
      process.exit(1);
    }

    const user = userCheck.rows[0];
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}\n`);

    // Discover password column name
    const colsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'");
    const colsOriginal = colsRes.rows.map(r => r.column_name);
    const colsLower = colsOriginal.map(c => c.toLowerCase());
    const candidates = ['password', 'password_hash', 'passwordhash', 'hash', 'pwd', 'encrypted_password', 'passworddigest', 'pass_hash', 'passworddigest', 'password_hash'];
    const matchedIndex = candidates.map(c => c.toLowerCase()).map(c => colsLower.indexOf(c)).find(idx => idx !== -1);
    
    if (matchedIndex === undefined || matchedIndex === -1) {
      console.error('❌ Could not find a password column on users table. Available columns:');
      console.error(colsOriginal.join(', '));
      process.exit(1);
    }
    
    const passwordColumn = colsOriginal[matchedIndex];
    console.log(`🔍 Found password column: ${passwordColumn}\n`);

    // Hash the new password
    console.log('🔐 Hashing new password...');
    const saltRounds = 12;
    const hash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and reset login attempts
    console.log('💾 Updating password...');
    const updateQuery = `
      UPDATE users 
      SET "${passwordColumn}" = $1, 
          "updatedAt" = now(),
          "loginAttempts" = 0,
          "lockedUntil" = NULL
      WHERE id = $2 
      RETURNING id, email, role, status
    `;
    
    const res = await pool.query(updateQuery, [hash, userId]);
    
    if (res.rowCount === 0) {
      console.error(`❌ Failed to update password for user: ${userId}`);
      process.exit(1);
    }

    const updatedUser = res.rows[0];
    console.log('\n✅ Password reset successfully!');
    console.log(`👤 User: ${updatedUser.email}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log(`📊 Status: ${updatedUser.status}`);
    console.log(`🔓 Login attempts reset: 0`);
    console.log(`🔓 Account unlocked\n`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting password:', err.message || err);
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();

