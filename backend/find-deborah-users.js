const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function findUsers() {
  console.log('🔍 Searching for users with "deborah" in email...\n');

  try {
    // Find users with deborah in email
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u."tenantId",
        u.role,
        u.status,
        u."createdAt",
        u."lastLoginAt",
        p."firstName",
        p."lastName",
        t.name as tenant_name,
        t.status as tenant_status,
        t."contactEmail" as tenant_email
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p."userId"
      LEFT JOIN tenants t ON u."tenantId" = t.id
      WHERE u.email ILIKE '%deborah%'
      ORDER BY u."createdAt" DESC;
    `;

    const result = await pool.query(userQuery);

    if (result.rows.length === 0) {
      console.log('❌ No users found with "deborah" in email');
      console.log('\n🔍 Let me check all users in the system...\n');
      
      const allUsersQuery = `
        SELECT 
          u.id,
          u.email,
          u.role,
          u.status,
          p."firstName",
          p."lastName",
          t.name as tenant_name
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p."userId"
        LEFT JOIN tenants t ON u."tenantId" = t.id
        ORDER BY u."createdAt" DESC
        LIMIT 20;
      `;
      
      const allUsers = await pool.query(allUsersQuery);
      console.log(`Found ${allUsers.rows.length} users:\n`);
      
      allUsers.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.firstName} ${user.lastName} - Tenant: ${user.tenant_name}`);
      });
      
      return;
    }

    console.log(`✅ Found ${result.rows.length} user(s):\n`);

    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. User Details:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Tenant: ${user.tenant_name} (${user.tenant_status})`);
      console.log(`   Tenant Email: ${user.tenant_email}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
      console.log(`   Last Login: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findUsers();
