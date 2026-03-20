#!/usr/bin/env node

const { createConnection } = require('typeorm');
const path = require('path');

async function main() {
  try {
    console.log('🔍 Checking truck owner credentials...\n');

    // Create connection using the same config as the app
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5433'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '123',
      database: process.env.DB_NAME || 'urutix',
      entities: [path.join(__dirname, 'src/entities/*.entity.ts')],
      synchronize: false,
      logging: false,
    });

    // Query for truck owner users
    const users = await connection.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        u."tenantId",
        u."passwordHash",
        up."firstName",
        up."lastName"
      FROM "user" u
      LEFT JOIN "user_profile" up ON u.id = up."userId"
      WHERE u.role = 'TRUCK_OWNER'
      ORDER BY u."createdAt" DESC
      LIMIT 10
    `);

    console.log(`📋 Found ${users.length} truck owner users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Tenant ID: ${user.tenantId}`);
      console.log(`   Has Password: ${!!user.passwordHash}`);
      console.log('');
    });

    // Also check for any users with email containing 'truck'
    console.log('\n🔍 Checking for users with "truck" in email:\n');
    const truckUsers = await connection.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.status,
        u."tenantId",
        u."passwordHash",
        up."firstName",
        up."lastName"
      FROM "user" u
      LEFT JOIN "user_profile" up ON u.id = up."userId"
      WHERE LOWER(u.email) LIKE '%truck%'
      ORDER BY u."createdAt" DESC
    `);

    console.log(`📋 Found ${truckUsers.length} users with "truck" in email:\n`);
    
    truckUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Has Password: ${!!user.passwordHash}`);
      console.log('');
    });

    await connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
