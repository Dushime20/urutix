#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  database: process.env.DB_DATABASE || 'urutix',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
};

async function verifyPassword() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔍 Verifying password for driver user...');
    
    // Get user's password hash
    const userResult = await pool.query(
      'SELECT id, email, "passwordHash" FROM users WHERE email = $1',
      ['driver.test@example.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Stored hash:', user.passwordHash);
    
    // Test password comparison
    const testPassword = 'test123';
    console.log('\n🧪 Testing password comparison...');
    console.log('Test password:', testPassword);
    
    const isMatch = await bcrypt.compare(testPassword, user.passwordHash);
    console.log('Password match:', isMatch);
    
    // Generate a new hash for comparison
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('New hash for same password:', newHash);
    
    // Test the new hash
    const isNewHashMatch = await bcrypt.compare(testPassword, newHash);
    console.log('New hash match:', isNewHashMatch);
    
    if (!isMatch) {
      console.log('\n❌ Password hash mismatch detected!');
      console.log('This explains why login is failing.');
    } else {
      console.log('\n✅ Password hash is correct');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyPassword();
