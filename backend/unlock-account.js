const { Client } = require('pg');
require('dotenv').config();

async function unlockAccount() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'urutix',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check current status
    const checkResult = await client.query(`
      SELECT email, "loginAttempts", "lockedUntil", status
      FROM users 
      WHERE email = 'superadmin@urutix.com'
    `);

    if (checkResult.rows.length > 0) {
      const user = checkResult.rows[0];
      console.log('Current status:');
      console.log('Email:', user.email);
      console.log('Login attempts:', user.loginAttempts);
      console.log('Locked until:', user.lockedUntil);
      console.log('Status:', user.status);
    }

    // Reset login attempts and unlock
    const result = await client.query(`
      UPDATE users 
      SET "loginAttempts" = 0, "lockedUntil" = NULL, "updatedAt" = NOW()
      WHERE email = 'superadmin@urutix.com'
      RETURNING email, "loginAttempts", "lockedUntil"
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ Account unlocked successfully!');
      console.log('Email:', result.rows[0].email);
      console.log('Login attempts reset to:', result.rows[0].loginAttempts);
      console.log('Locked until:', result.rows[0].lockedUntil);
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

unlockAccount();