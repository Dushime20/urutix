#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
  database: process.env.DB_DATABASE || 'urutix',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
};

async function fixPassword() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔧 Fixing password hash for driver user...');
    
    // Generate correct password hash
    const correctPassword = 'test123';
    const correctHash = await bcrypt.hash(correctPassword, 10);
    
    console.log('Correct password:', correctPassword);
    console.log('Correct hash:', correctHash);
    
    // Update the user's password hash
    const updateResult = await pool.query(
      'UPDATE users SET "passwordHash" = $1, "updatedAt" = NOW() WHERE email = $2 RETURNING id, email',
      [correctHash, 'driver.test@example.com']
    );
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Password hash updated successfully');
      
      // Verify the update
      const verifyResult = await pool.query(
        'SELECT id, email, "passwordHash" FROM users WHERE email = $1',
        ['driver.test@example.com']
      );
      
      const user = verifyResult.rows[0];
      console.log('\n🔍 Verifying update...');
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('New hash:', user.passwordHash);
      
      // Test the new hash
      const isMatch = await bcrypt.compare(correctPassword, user.passwordHash);
      console.log('Password verification:', isMatch ? '✅ SUCCESS' : '❌ FAILED');
      
      if (isMatch) {
        console.log('\n🎯 Password fixed successfully!');
        console.log('You can now login with:');
        console.log('Email: driver.test@example.com');
        console.log('Password: test123');
      }
    } else {
      console.log('❌ Failed to update password hash');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixPassword();
