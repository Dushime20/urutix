#!/usr/bin/env node
const { Pool } = require('pg');

const dbConfig = {
  user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'urutix',
  password: process.env.DB_PASSWORD || '123456',
  port: parseInt(process.env.DB_PORT || '5433', 10),
};

async function verifyUsers() {
  const pool = new Pool(dbConfig);
  try {
    const res = await pool.query(`SELECT id, email, role, status, "tenantId", "createdAt" FROM users ORDER BY "createdAt" DESC LIMIT 50`);
    console.log(`Found ${res.rowCount} user(s):`);
    res.rows.forEach((u, i) => {
      console.log(`${i+1}. ${u.email} | role=${u.role} | status=${u.status} | tenant=${u.tenantId} | id=${u.id}`);
    });
    if (res.rowCount === 0) console.log('No users found.');
  } catch (err) {
    console.error('Error verifying users:', err.message || err);
    process.exitCode = 2;
  } finally {
    await pool.end();
  }
}

verifyUsers();
