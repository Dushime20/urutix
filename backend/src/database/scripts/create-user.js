#!/usr/bin/env node
const { Pool } = require('pg');
let bcrypt;
try { bcrypt = require('bcrypt'); } catch (e) { bcrypt = require('bcryptjs'); }

const email = process.argv[2];
const password = process.argv[3] || 'test123';
const role = process.argv[4] || 'CARGO_OWNER';

if (!email) {
  console.error('Usage: node create-user.js <email> [password] [role]');
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
    // find tenant to attach to
    const tenantRes = await pool.query("SELECT id FROM tenants WHERE deleted_at IS NULL LIMIT 1");
    if (tenantRes.rowCount === 0) {
      console.error('No tenant found. Run tenants seed or migrations first.');
      process.exit(1);
    }
    const tenantId = tenantRes.rows[0].id;

    // find password column
    const colsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'");
    const colsOriginal = colsRes.rows.map(r => r.column_name);
    const colsLower = colsOriginal.map(c => c.toLowerCase());
    const candidates = ['password', 'password_hash', 'passwordhash', 'hash', 'pwd', 'encrypted_password', 'passworddigest', 'pass_hash', 'passworddigest'];
    const matchedIndex = candidates.map(c => c.toLowerCase()).map(c => colsLower.indexOf(c)).find(idx => idx !== -1);
    if (matchedIndex === undefined || matchedIndex === -1) {
      console.error('Could not find a password column on users table. Available columns:');
      console.error(colsOriginal.join(', '));
      process.exit(1);
    }
    const passCol = colsOriginal[matchedIndex];

    // ensure email not present
    const exists = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
    if (exists.rowCount > 0) {
      console.error(`User with email=${email} already exists (id=${exists.rows[0].id}).`);
      process.exit(1);
    }

    const id = require('crypto').randomUUID();
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // build insert columns adaptively
    const insertCols = ['id', 'email', 'role', 'status', '"tenantId"', `"${passCol}"`, '"createdAt"', '"updatedAt"'];
    const placeholders = insertCols.map((_, i) => `$${i+1}`);
    const insertQuery = `INSERT INTO users (${insertCols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING id, email`;
    const values = [id, email, role, 'ACTIVE', tenantId, hash, new Date(), new Date()];

    await pool.query(insertQuery, values);
    console.log(`Created user ${email} with role=${role} (id=${id}). Password set to provided value.`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating user:', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
