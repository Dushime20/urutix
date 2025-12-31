#!/usr/bin/env node

/**
 * 🔍 VERIFY CARGO OWNER USER
 * 
 * This script verifies if the cargo owner user exists and can login
 */

const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'urutix_database',
  user: process.env.DB_USERNAME || 'dev',
  password: process.env.DB_PASSWORD || 'password',
};

const pool = new Pool(dbConfig);

async function verifyCargoOwner() {
  console.log('🔍 Verifying Cargo Owner User...\n');
  
  try {
    const email = 'cargo.owner@test.com';
    
    // Check if user exists
    const userResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.phone,
        u.role,
        u.status,
        u."passwordHash",
        up."firstName",
        up."lastName"
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      WHERE u.email = $1
    `, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User NOT FOUND!');
      console.log(`   Email: ${email}`);
      console.log('\n💡 Solution: Run the cargo seed to create the user:');
      console.log('   npm run seed:cargos-brokers\n');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User FOUND!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A');
    console.log(`   Password Hash: ${user.passwordHash ? '✅ Set' : '❌ Missing'}`);
    console.log('');
    
    // Test password
    if (user.passwordHash) {
      const testPassword = 'test123';
      const passwordMatch = await bcrypt.compare(testPassword, user.passwordHash);
      
      console.log('🔐 Password Verification:');
      console.log(`   Test Password: ${testPassword}`);
      console.log(`   Password Match: ${passwordMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
      console.log('');
      
      if (!passwordMatch) {
        console.log('⚠️  Password does not match!');
        console.log('💡 Fixing password...\n');
        
        // Fix password
        const newPasswordHash = await bcrypt.hash(testPassword, 10);
        await pool.query(`
          UPDATE users 
          SET "passwordHash" = $1, "updatedAt" = NOW()
          WHERE id = $2
        `, [newPasswordHash, user.id]);
        
        console.log('✅ Password updated successfully!');
        console.log('   You can now login with:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${testPassword}\n`);
      }
    } else {
      console.log('⚠️  No password hash found!');
      console.log('💡 Setting password...\n');
      
      // Set password
      const passwordHash = await bcrypt.hash('test123', 10);
      await pool.query(`
        UPDATE users 
        SET "passwordHash" = $1, "updatedAt" = NOW()
        WHERE id = $2
      `, [passwordHash, user.id]);
      
      console.log('✅ Password set successfully!');
      console.log('   You can now login with:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: test123\n`);
    }
    
    // Check status
    if (user.status !== 'ACTIVE') {
      console.log(`⚠️  User status is ${user.status}, updating to ACTIVE...\n`);
      await pool.query(`
        UPDATE users 
        SET status = 'ACTIVE', "updatedAt" = NOW()
        WHERE id = $1
      `, [user.id]);
      console.log('✅ Status updated to ACTIVE\n');
    }
    
    console.log('✅ Verification Complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  verifyCargoOwner()
    .then(() => {
      console.log('✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyCargoOwner };

