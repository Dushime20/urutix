
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

async function resetPassword(email, newPassword) {
  const pool = new Pool(dbConfig);
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE users SET "passwordHash" = $1, "loginAttempts" = 0, "lockedUntil" = NULL, "status" = \'ACTIVE\' WHERE email = $2 RETURNING id',
      [hash, email]
    );
    if (result.rowCount > 0) {
      console.log(`✅ Password for ${email} has been reset to: ${newPassword}`);
    } else {
      console.log(`❌ User with email ${email} not found.`);
    }
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await pool.end();
  }
}

const targetEmail = process.argv[2] || 'uruticargo@gmail.com';
const targetPassword = process.argv[3] || 'test123';

resetPassword(targetEmail, targetPassword);
