#!/usr/bin/env node
const { Pool } = require('pg');

// choose bcrypt implementation available
let bcrypt;
try { bcrypt = require('bcrypt'); } catch (e) { bcrypt = require('bcryptjs'); }

const email = process.argv[2];
const newPassword = process.argv[3] || 'test123';

if (!email) {
  console.error('Usage: node reset-user-password.js <email> [newPassword]');
  process.exit(2);
}

const dbConfig = {
  user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'urutix',
  password: process.env.DB_PASSWORD || '123456',
  port: parseInt(process.env.DB_PORT || '5433', 10),
};

async function run() {
  const pool = new Pool(dbConfig);
  try {
    // discover password column name
    const colsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'");
    // preserve original column names but match case-insensitively
    const colsOriginal = colsRes.rows.map(r => r.column_name);
    const colsLower = colsOriginal.map(c => c.toLowerCase());
    const candidates = ['password', 'password_hash', 'passwordhash', 'hash', 'pwd', 'encrypted_password', 'passworddigest', 'pass_hash', 'passworddigest', 'password_hash'];
    const matchedIndex = candidates.map(c => c.toLowerCase()).map(c => colsLower.indexOf(c)).find(idx => idx !== -1);
    if (matchedIndex === undefined || matchedIndex === -1) {
      console.error('Could not find a password column on users table. Available columns:');
      console.error(colsOriginal.join(', '));
      process.exit(1);
    }
    const found = colsOriginal[matchedIndex];

    const saltRounds = 10;
    const hash = await bcrypt.hash(newPassword, saltRounds);

    // use parameterized query with dynamic column name
    const updateQuery = `UPDATE users SET "${found}" = $1, "updatedAt" = now() WHERE email = $2 RETURNING id, email`;
    const res = await pool.query(updateQuery, [hash, email]);
    if (res.rowCount === 0) {
      console.error(`No user found with email=${email}`);
      process.exit(1);
    }
    console.log(`Password for ${res.rows[0].email} updated successfully (column: ${found}).`);
    console.log(`New password (plaintext): ${newPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating password:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
