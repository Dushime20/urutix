/**
 * Check User Credentials
 */

const { Client } = require('pg');
require('dotenv').config();

async function checkUserCredentials() {
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

    // Check cargo owner users
    console.log('\n👤 Cargo Owner Users:');
    console.log('====================');
    
    const usersResult = await client.query(`
      SELECT id, "tenantId", email, role, status, "passwordHash"
      FROM users 
      WHERE role = 'CARGO_OWNER'
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);

    if (usersResult.rows.length === 0) {
      console.log('❌ No cargo owner users found');
    } else {
      console.log(`✅ Found ${usersResult.rows.length} cargo owner users:`);
      usersResult.rows.forEach(user => {
        console.log(`- Email: ${user.email}`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Tenant: ${user.tenantId}`);
        console.log(`  Status: ${user.status}`);
        console.log(`  Has Password: ${user.passwordHash ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    // Check if there are any users with simple passwords
    console.log('\n🔍 Checking for test users...');
    console.log('=============================');
    
    const testUsers = await client.query(`
      SELECT email, role, status
      FROM users 
      WHERE email LIKE '%test%' OR email LIKE '%sample%' OR email LIKE '%demo%'
      ORDER BY email
    `);

    if (testUsers.rows.length > 0) {
      console.log('Test users found:');
      testUsers.rows.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - ${user.status}`);
      });
    } else {
      console.log('No test users found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUserCredentials();