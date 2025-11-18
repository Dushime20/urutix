#!/usr/bin/env node
const { Pool } = require('pg');

const dbConfig = {
  user: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'urutix',
  password: process.env.DB_PASSWORD || '123456',
  port: parseInt(process.env.DB_PORT || '5433', 10),
};

async function verify() {
  const pool = new Pool(dbConfig);
  try {
    const res = await pool.query('SELECT id, name, subdomain, status, "isActive", "createdAt" FROM tenants ORDER BY "createdAt" DESC LIMIT 10');
    console.log(`Found ${res.rowCount} tenant(s):`);
    res.rows.forEach(r => console.log(`- ${r.name} (${r.subdomain}) id=${r.id} status=${r.status} active=${r.isActive} createdAt=${r.createdAt}`));
  } catch (err) {
    console.error('Error verifying tenants:', err.message || err);
    process.exitCode = 2;
  } finally {
    await pool.end();
  }
}

verify();
