#!/usr/bin/env node

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: '123',
    database: 'urutix',
  });

  try {
    console.log('🔐 Resetting truck owner password...\n');

    // Hash the password
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log(`📝 Hashing password: ${password}`);
    console.log(`   Hash: ${hashedPassword}\n`);

    // Update the user
    const result = await pool.query(`
      UPDATE users 
      SET "passwordHash" = $1
      WHERE email = 'truck.owner@test.com'
      RETURNING id, email, role, status
    `, [hashedPassword]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✅ Password reset successfully!`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`\n   You can now login with:`);
      console.log(`   Email: truck.owner@test.com`);
      console.log(`   Password: test123`);
    } else {
      console.log(`❌ User not found!`);
    }

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
