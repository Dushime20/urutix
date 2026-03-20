const { Client } = require('pg');
require('dotenv').config();

async function checkSystemUser() {
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

    // Check for system/admin users
    const result = await client.query(`
      SELECT id, email, role 
      FROM users 
      WHERE role IN ('SUPER_ADMIN', 'ADMIN')
      ORDER BY "createdAt" ASC
      LIMIT 5
    `);

    console.log('\n📋 System Users:');
    console.log('================');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkSystemUser();