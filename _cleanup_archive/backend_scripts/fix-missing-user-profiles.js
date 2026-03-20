require('dotenv').config();
const { Client } = require('pg');

async function fixMissingUserProfiles() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('  FIX MISSING USER PROFILES');
    console.log('═══════════════════════════════════════════════════════\n');

    // Find users without profiles
    const usersWithoutProfilesQuery = `
      SELECT 
        u.id as user_id,
        u."tenantId",
        u.email,
        u.role,
        t.name as tenant_name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up."userId"
      LEFT JOIN tenants t ON u."tenantId" = t.id
      WHERE up.id IS NULL
      ORDER BY u."createdAt" DESC
    `;

    const result = await client.query(usersWithoutProfilesQuery);

    if (result.rows.length === 0) {
      console.log('✅ All users have profiles!\n');
      return;
    }

    console.log(`Found ${result.rows.length} user(s) without profiles\n`);

    let successCount = 0;
    let failedCount = 0;

    for (const user of result.rows) {
      try {
        // Extract first and last name from email or tenant name
        const emailUsername = user.email.split('@')[0];
        const firstName = user.tenant_name?.split(' ')[0] || emailUsername.split('.')[0] || 'User';
        const lastName = user.tenant_name?.split(' ').slice(1).join(' ') || emailUsername.split('.').slice(1).join(' ') || 'Admin';

        const insertProfileQuery = `
          INSERT INTO user_profiles (
            "userId",
            "tenantId",
            "firstName",
            "lastName",
            "createdAt",
            "updatedAt"
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING id
        `;

        await client.query(insertProfileQuery, [
          user.user_id,
          user.tenantId,
          firstName.charAt(0).toUpperCase() + firstName.slice(1),
          lastName.charAt(0).toUpperCase() + lastName.slice(1),
        ]);

        console.log(`✅ Created profile for: ${user.email}`);
        console.log(`   Name: ${firstName} ${lastName}`);
        console.log(`   Tenant: ${user.tenant_name || 'Unknown'}\n`);

        successCount++;

      } catch (error) {
        console.error(`❌ Failed to create profile for: ${user.email}`);
        console.error(`   Error: ${error.message}\n`);
        failedCount++;
      }
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Users Processed: ${result.rows.length}`);
    console.log(`✅ Successfully Created: ${successCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

fixMissingUserProfiles();
