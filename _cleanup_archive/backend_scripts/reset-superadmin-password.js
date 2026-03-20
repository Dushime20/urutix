const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetPassword() {
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

    // Hash the new password
    const newPassword = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the superadmin password
    const result = await client.query(`
      UPDATE users 
      SET "passwordHash" = $1, "updatedAt" = NOW()
      WHERE email = 'superadmin@urutix.com'
      RETURNING email, role
    `, [hashedPassword]);

    if (result.rows.length > 0) {
      console.log('✅ Password reset successful!');
      console.log('Email:', result.rows[0].email);
      console.log('Role:', result.rows[0].role);
      console.log('New password:', newPassword);
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

resetPassword();