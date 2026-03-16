const { Client } = require('pg');
require('dotenv').config();

async function checkUsers() {
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

    // Check table schema first
    const schemaResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Users Table Schema:');
    console.log('======================');
    schemaResult.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });

    // Check users
    const result = await client.query(`
      SELECT id, email, role, "createdAt"
      FROM users 
      WHERE role IN ('SUPER_ADMIN', 'ADMIN')
      ORDER BY "createdAt" DESC
      LIMIT 10
    `);

    console.log('\n📋 Admin Users:');
    console.log('================');
    result.rows.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Created: ${user.createdAt}`);
      console.log('---');
    });

    if (result.rows.length === 0) {
      console.log('No admin users found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();