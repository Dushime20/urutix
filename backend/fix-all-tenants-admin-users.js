const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

async function fixAllTenantsAdminUsers() {
  console.log('🔧 Fixing admin user associations for all tenants...\n');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'urutix',
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected\n');

    // Get all tenants that don't have DEACTIVATED status
    const tenants = await dataSource.query(
      `SELECT id, name, subdomain, domain, "contactEmail", status, "isActive" 
       FROM tenants 
       WHERE status != 'DEACTIVATED'
       ORDER BY "createdAt" DESC`
    );

    console.log(`📋 Found ${tenants.length} active/pending/suspended tenants\n`);

    let fixedCount = 0;
    let alreadyOkCount = 0;
    let errorCount = 0;

    for (const tenant of tenants) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🏢 Tenant: ${tenant.name} (${tenant.status})`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Email: ${tenant.contactEmail}`);

      // Check if tenant has admin users
      const adminUsers = await dataSource.query(
        `SELECT id, email, role, status FROM users 
         WHERE "tenantId" = $1 AND role = 'TENANT_ADMIN'`,
        [tenant.id]
      );

      if (adminUsers.length > 0) {
        console.log(`   ✅ Already has ${adminUsers.length} admin user(s)`);
        alreadyOkCount++;
        continue;
      }

      console.log(`   ⚠️  No admin users found, fixing...`);

      if (!tenant.contactEmail) {
        console.log(`   ❌ No contact email - cannot create admin user`);
        errorCount++;
        continue;
      }

      try {
        // Check if user exists with this email
        const existingUsers = await dataSource.query(
          'SELECT id, email, role, status, "tenantId" FROM users WHERE email = $1',
          [tenant.contactEmail]
        );

        if (existingUsers.length > 0) {
          const user = existingUsers[0];
          console.log(`   📧 Found existing user, reassociating...`);

          // Update user to be TENANT_ADMIN for this tenant
          await dataSource.query(
            `UPDATE users 
             SET role = 'TENANT_ADMIN', "tenantId" = $1, "updatedAt" = NOW()
             WHERE id = $2`,
            [tenant.id, user.id]
          );

          // Update user profile
          const profiles = await dataSource.query(
            'SELECT * FROM user_profiles WHERE "userId" = $1',
            [user.id]
          );

          if (profiles.length > 0) {
            await dataSource.query(
              `UPDATE user_profiles SET "tenantId" = $1 WHERE "userId" = $2`,
              [tenant.id, user.id]
            );
          } else {
            const nameParts = tenant.name.split(' ');
            await dataSource.query(
              `INSERT INTO user_profiles ("userId", "tenantId", "firstName", "lastName", "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, NOW(), NOW())`,
              [user.id, tenant.id, nameParts[0] || 'Tenant', nameParts.slice(1).join(' ') || 'Admin']
            );
          }

          console.log(`   ✅ User reassociated successfully`);
          fixedCount++;
        } else {
          console.log(`   📧 Creating new admin user...`);

          // Generate temporary password
          const tempPassword = crypto.randomBytes(32).toString('hex');
          const passwordHash = await bcrypt.hash(tempPassword, 12);

          // Create new user
          const result = await dataSource.query(
            `INSERT INTO users (id, email, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt")
             VALUES (gen_random_uuid(), $1, $2, 'TENANT_ADMIN', 'PENDING_VERIFICATION', $3, NOW(), NOW())
             RETURNING id`,
            [tenant.contactEmail, passwordHash, tenant.id]
          );

          const newUser = result[0];

          // Create user profile
          const nameParts = tenant.name.split(' ');
          await dataSource.query(
            `INSERT INTO user_profiles ("userId", "tenantId", "firstName", "lastName", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [newUser.id, tenant.id, nameParts[0] || 'Tenant', nameParts.slice(1).join(' ') || 'Admin']
          );

          // Create password reset token
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);

          await dataSource.query(
            `INSERT INTO password_reset_tokens (email, token, "expiresAt", used, "createdAt")
             VALUES ($1, $2, $3, false, NOW())`,
            [tenant.contactEmail, token, expiresAt]
          );

          console.log(`   ✅ New admin user created successfully`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error fixing tenant: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('\n📊 Summary:');
    console.log(`   ✅ Already OK: ${alreadyOkCount} tenants`);
    console.log(`   🔧 Fixed: ${fixedCount} tenants`);
    console.log(`   ❌ Errors: ${errorCount} tenants`);
    console.log(`   📋 Total: ${tenants.length} tenants`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

fixAllTenantsAdminUsers();
