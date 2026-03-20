const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function verifyPassword() {
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

    // Get current password hash
    const result = await client.query(`
      SELECT email, "passwordHash"
      FROM users 
      WHERE email = 'superadmin@urutix.com'
    `);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('Email:', user.email);
      console.log('Password hash:', user.passwordHash);
      
      // Test password verification
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, user.passwordHash);
      console.log(`\nPassword "${testPassword}" is valid:`, isValid);
      
      // Generate a new hash for comparison
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('New hash for comparison:', newHash);
      
      // Test the new hash
      const newHashValid = await bcrypt.compare(testPassword, newHash);
      console.log('New hash is valid:', newHashValid);
      
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyPassword();