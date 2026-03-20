const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

async function fixTenantAdminUser() {
  const tenantId = 'f3276ef3-068b-4875-81bb-de53e26cc0fe';
  const contactEmail = 'dkubui@gmail.com';
  const tenantName = 'David';
  
  console.log('🔧 Fixing tenant admin user association...\n');

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

    // Check if user exists with this email
    const existingUsers = await dataSource.query(
      'SELECT id, email, role, status, "tenantId" FROM users WHERE email = $1',
      [contactEmail]
    );

    if (existingUsers.length > 0) {
      console.log(`📧 Found existing user with email ${contactEmail}:`);
      console.log(JSON.stringify(existingUsers[0], null, 2));
      console.log('');

      const user = existingUsers[0];

      // Update user to be TENANT_ADMIN for this tenant
      await dataSource.query(
        `UPDATE users 
         SET role = 'TENANT_ADMIN', "tenantId" = $1, "updatedAt" = NOW()
         WHERE id = $2`,
        [tenantId, user.id]
      );

      console.log('✅ Updated user role to TENANT_ADMIN and associated with tenant');

      // Check/update user profile
      const profiles = await dataSource.query(
        'SELECT * FROM user_profiles WHERE "userId" = $1',
        [user.id]
      );

      if (profiles.length > 0) {
        await dataSource.query(
          `UPDATE user_profiles SET "tenantId" = $1 WHERE "userId" = $2`,
          [tenantId, user.id]
        );
        console.log('✅ Updated user profile with tenant association');
      } else {
        // Create user profile
        const nameParts = tenantName.split(' ');
        await dataSource.query(
          `INSERT INTO user_profiles ("userId", "tenantId", "firstName", "lastName", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [user.id, tenantId, nameParts[0] || 'Tenant', nameParts.slice(1).join(' ') || 'Admin']
        );
        console.log('✅ Created user profile for tenant admin');
      }
    } else {
      console.log(`📧 No existing user found with email ${contactEmail}`);
      console.log('🔧 Creating new tenant admin user...\n');

      // Generate temporary password
      const tempPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 12);

      // Create new user
      const result = await dataSource.query(
        `INSERT INTO users (id, email, "passwordHash", role, status, "tenantId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 'TENANT_ADMIN', 'PENDING_VERIFICATION', $3, NOW(), NOW())
         RETURNING id, email, role, status`,
        [contactEmail, passwordHash, tenantId]
      );

      const newUser = result[0];
      console.log('✅ Created new tenant admin user:');
      console.log(JSON.stringify(newUser, null, 2));
      console.log('');

      // Create user profile
      const nameParts = tenantName.split(' ');
      await dataSource.query(
        `INSERT INTO user_profiles ("userId", "tenantId", "firstName", "lastName", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [newUser.id, tenantId, nameParts[0] || 'Tenant', nameParts.slice(1).join(' ') || 'Admin']
      );
      console.log('✅ Created user profile for tenant admin');

      // Create password reset token for setup
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await dataSource.query(
        `INSERT INTO password_reset_tokens (email, token, "expiresAt", used, "createdAt")
         VALUES ($1, $2, $3, false, NOW())`,
        [contactEmail, token, expiresAt]
      );
      console.log('✅ Created password setup token (expires in 7 days)');
      console.log(`   Token: ${token.substring(0, 20)}...`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tenant admin user setup complete!');
    console.log('   You can now activate the tenant.');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

fixTenantAdminUser();
