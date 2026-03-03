require('dotenv').config();
const { Client } = require('pg');

async function checkTenantCredentials() {
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
    console.log('  TENANT CREDENTIALS REPORT');
    console.log('═══════════════════════════════════════════════════════\n');

    // Get all tenants with their admin users
    const query = `
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.subdomain,
        t.status as tenant_status,
        t."createdAt" as tenant_created,
        u.id as user_id,
        u.email,
        u.role,
        u.status as user_status,
        u."emailVerifiedAt" as email_verified_at,
        u."lastLoginAt" as last_login_at,
        u."createdAt" as user_created
      FROM tenants t
      LEFT JOIN users u ON t.id = u."tenantId" 
        AND u.role IN ('TENANT_ADMIN', 'ADMIN')
      ORDER BY t."createdAt" DESC, u.role DESC, u."createdAt" ASC
    `;

    const result = await client.query(query);

    if (result.rows.length === 0) {
      console.log('⚠️  No tenants found in database\n');
      return;
    }

    // Group by tenant
    const tenantMap = new Map();
    result.rows.forEach(row => {
      if (!tenantMap.has(row.tenant_id)) {
        tenantMap.set(row.tenant_id, {
          tenant: {
            id: row.tenant_id,
            name: row.tenant_name,
            subdomain: row.subdomain,
            status: row.tenant_status,
            created: row.tenant_created,
          },
          admins: []
        });
      }
      
      if (row.user_id) {
        tenantMap.get(row.tenant_id).admins.push({
          id: row.user_id,
          email: row.email,
          role: row.role,
          status: row.user_status,
          emailVerified: row.email_verified_at ? '✅' : '❌',
          lastLogin: row.last_login_at || 'Never',
          created: row.user_created,
        });
      }
    });

    // Display results
    let totalTenants = 0;
    let tenantsWithAdmins = 0;
    let tenantsWithoutAdmins = 0;
    let totalAdmins = 0;

    tenantMap.forEach((data, tenantId) => {
      totalTenants++;
      const { tenant, admins } = data;

      console.log(`\n📦 TENANT: ${tenant.name}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Subdomain: ${tenant.subdomain || 'Not set'}`);
      console.log(`   Status: ${tenant.status}`);
      console.log(`   Created: ${new Date(tenant.created).toLocaleString()}`);
      
      if (admins.length === 0) {
        console.log(`   ⚠️  NO ADMIN USERS FOUND`);
        tenantsWithoutAdmins++;
      } else {
        console.log(`   Admin Users (${admins.length}):`);
        tenantsWithAdmins++;
        totalAdmins += admins.length;
        
        admins.forEach((admin, index) => {
          console.log(`\n   ${index + 1}. ${admin.email}`);
          console.log(`      Role: ${admin.role}`);
          console.log(`      Status: ${admin.status}`);
          console.log(`      Email Verified: ${admin.emailVerified}`);
          console.log(`      Last Login: ${admin.lastLogin === 'Never' ? 'Never' : new Date(admin.lastLogin).toLocaleString()}`);
          console.log(`      Created: ${new Date(admin.created).toLocaleString()}`);
          
          // Login URL
          const loginUrl = tenant.subdomain 
            ? `http://${tenant.subdomain}.localhost:5173/login`
            : `http://localhost:5173/login`;
          console.log(`      Login URL: ${loginUrl}`);
        });
      }
      console.log('   ' + '─'.repeat(50));
    });

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Tenants: ${totalTenants}`);
    console.log(`Tenants with Admins: ${tenantsWithAdmins}`);
    console.log(`Tenants without Admins: ${tenantsWithoutAdmins}`);
    console.log(`Total Admin Users: ${totalAdmins}`);
    console.log('');

    // Check for super admin
    console.log('═══════════════════════════════════════════════════════');
    console.log('  SUPER ADMIN ACCOUNTS');
    console.log('═══════════════════════════════════════════════════════\n');

    const superAdminQuery = `
      SELECT 
        id,
        email,
        role,
        status,
        "emailVerifiedAt" as email_verified_at,
        "lastLoginAt" as last_login_at,
        "createdAt" as created_at
      FROM users
      WHERE role = 'SUPER_ADMIN'
      ORDER BY "createdAt" ASC
    `;

    const superAdminResult = await client.query(superAdminQuery);

    if (superAdminResult.rows.length === 0) {
      console.log('⚠️  No SUPER_ADMIN accounts found\n');
    } else {
      superAdminResult.rows.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email}`);
        console.log(`   Status: ${admin.status}`);
        console.log(`   Email Verified: ${admin.email_verified_at ? '✅' : '❌'}`);
        console.log(`   Last Login: ${admin.last_login_at ? new Date(admin.last_login_at).toLocaleString() : 'Never'}`);
        console.log(`   Created: ${new Date(admin.created_at).toLocaleString()}`);
        console.log(`   Login URL: http://localhost:5173/login`);
        console.log('');
      });
    }

    // Recommendations
    if (tenantsWithoutAdmins > 0) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('  ⚠️  RECOMMENDATIONS');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log(`${tenantsWithoutAdmins} tenant(s) have no admin users.`);
      console.log('You can create admin users using:');
      console.log('  node fix-tenant-admin-user.js');
      console.log('  node fix-all-tenants-admin-users.js');
      console.log('');
    }

    // Default password warning
    console.log('═══════════════════════════════════════════════════════');
    console.log('  🔐 PASSWORD INFORMATION');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Default passwords for seeded accounts:');
    console.log('  - Super Admin: Admin@123');
    console.log('  - Tenant Admins: Admin@123 (if created by seed scripts)');
    console.log('');
    console.log('⚠️  IMPORTANT: Change default passwords in production!');
    console.log('');
    console.log('To reset a password:');
    console.log('  1. Use frontend: http://localhost:5173/forgot-password');
    console.log('  2. Use script: node reset-super-admin-password.js');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkTenantCredentials();
