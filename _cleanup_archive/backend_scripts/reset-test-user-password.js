/**
 * Reset Test User Password
 */

const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetTestUserPassword() {
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

    const email = 'cargo.owner@test.com';
    const newPassword = 'password123';
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log(`🔐 Resetting password for ${email}...`);
    
    // Update the user's password
    const result = await client.query(`
      UPDATE users 
      SET "passwordHash" = $1, "updatedAt" = NOW()
      WHERE email = $2
      RETURNING id, email, role, "tenantId"
    `, [hashedPassword, email]);

    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log('✅ Password reset successful!');
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Tenant ID: ${user.tenantId}`);
    console.log(`New Password: ${newPassword}`);
    
    console.log('\n🧪 Test Credentials:');
    console.log('===================');
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

resetTestUserPassword();