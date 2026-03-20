#!/usr/bin/env node

const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5433,
    user: 'postgres',
    password: '123',
    database: 'urutix',
  });

  try {
    console.log('🔍 Checking all users in database...\n');

    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        u."tenantId",
        u."passwordHash" IS NOT NULL as has_password,
        u."createdAt"
      FROM users u
      ORDER BY u."createdAt" DESC
      LIMIT 20
    `);

    console.log(`📋 Found ${result.rows.length} users:\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Has Password: ${user.has_password}`);
      console.log(`   Tenant ID: ${user.tenantId}`);
      console.log('');
    });

    // Check specifically for truck owner
    console.log('\n🔍 Checking for truck.owner@test.com...\n');
    const truckOwnerResult = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        u."tenantId",
        u."passwordHash" IS NOT NULL as has_password
      FROM users u
      WHERE LOWER(u.email) = 'truck.owner@test.com'
    `);

    if (truckOwnerResult.rows.length > 0) {
      const user = truckOwnerResult.rows[0];
      console.log(`✅ Found truck owner user:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Has Password: ${user.has_password}`);
      console.log(`   Tenant ID: ${user.tenantId}`);
    } else {
      console.log(`❌ truck.owner@test.com not found!`);
      console.log(`\n   You need to run the seed script to create test users.`);
      console.log(`   Run: npm run seed:all-data`);
    }

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
