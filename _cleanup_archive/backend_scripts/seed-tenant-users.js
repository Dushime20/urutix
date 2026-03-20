require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Default password for all seeded users
const DEFAULT_PASSWORD = 'Admin@123';

async function seedTenantUsers() {
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
    console.log('  TENANT USERS SEED SCRIPT');
    console.log('═══════════════════════════════════════════════════════\n');

    // Hash the default password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log('🔐 Password hash generated\n');

    // Get all tenants without admin users
    const tenantsQuery = `
      SELECT 
        t.id,
        t.name,
        t.subdomain,
        t.status
      FROM tenants t
      WHERE NOT EXISTS (
        SELECT 1 FROM users u 
        WHERE u."tenantId" = t.id 
        AND u.role IN ('TENANT_ADMIN', 'ADMIN')
      )
      AND t.id != '00000000-0000-0000-0000-000000000001'
      ORDER BY t."createdAt" DESC
    `;

    const tenantsResult = await client.query(tenantsQuery);

    if (tenantsResult.rows.length === 0) {
      console.log('✅ All tenants already have admin users!\n');
      return;
    }

    console.log(`Found ${tenantsResult.rows.length} tenant(s) without admin users\n`);

    let successCount = 0;
    let failedCount = 0;
    const results = [];

    // Create admin user for each tenant
    for (const tenant of tenantsResult.rows) {
      try {
        // Generate email from tenant name
        const emailUsername = tenant.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 20);
        
        const email = `${emailUsername}.admin@urutix.com`;

        // Check if email already exists
        const emailCheckQuery = `
          SELECT id FROM users WHERE email = $1
        `;
        const emailCheck = await client.query(emailCheckQuery, [email]);

        let finalEmail = email;
        if (emailCheck.rows.length > 0) {
          // Email exists, add tenant ID suffix
          finalEmail = `${emailUsername}.${tenant.id.substring(0, 8)}@urutix.com`;
        }

        // Insert user
        const insertUserQuery = `
          INSERT INTO users (
            "tenantId",
            email,
            "passwordHash",
            role,
            status,
            "emailVerifiedAt",
            "createdAt",
            "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
          RETURNING id, email
        `;

        const userResult = await client.query(insertUserQuery, [
          tenant.id,
          finalEmail,
          passwordHash,
          'TENANT_ADMIN',
          'ACTIVE',
          new Date(), // Email verified
        ]);

        const userId = userResult.rows[0].id;

        // Create user profile
        const insertProfileQuery = `
          INSERT INTO user_profiles (
            "userId",
            "tenantId",
            "firstName",
            "lastName",
            "createdAt",
            "updatedAt"
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        `;

        await client.query(insertProfileQuery, [
          userId,
          tenant.id, // Add tenantId
          tenant.name.split(' ')[0] || 'Admin',
          tenant.name.split(' ').slice(1).join(' ') || 'User',
        ]);

        console.log(`✅ Created admin for: ${tenant.name}`);
        console.log(`   Email: ${finalEmail}`);
        console.log(`   Password: ${DEFAULT_PASSWORD}`);
        console.log(`   Subdomain: ${tenant.subdomain || 'Not set'}`);
        console.log('');

        successCount++;
        results.push({
          tenant: tenant.name,
          email: finalEmail,
          subdomain: tenant.subdomain,
          success: true,
        });

      } catch (error) {
        console.error(`❌ Failed to create admin for: ${tenant.name}`);
        console.error(`   Error: ${error.message}\n`);
        failedCount++;
        results.push({
          tenant: tenant.name,
          success: false,
          error: error.message,
        });
      }
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('  SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Tenants Processed: ${tenantsResult.rows.length}`);
    console.log(`✅ Successfully Created: ${successCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log('');

    // Display credentials
    if (successCount > 0) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('  CREDENTIALS');
      console.log('═══════════════════════════════════════════════════════\n');
      
      results.filter(r => r.success).forEach((result, index) => {
        console.log(`${index + 1}. ${result.tenant}`);
        console.log(`   Email: ${result.email}`);
        console.log(`   Password: ${DEFAULT_PASSWORD}`);
        if (result.subdomain) {
          console.log(`   Login URL: http://${result.subdomain}.localhost:5173/login`);
        } else {
          console.log(`   Login URL: http://localhost:5173/login`);
        }
        console.log('');
      });

      console.log('⚠️  IMPORTANT: Save these credentials securely!');
      console.log('⚠️  Change default passwords after first login!\n');
    }

    // Verification
    console.log('═══════════════════════════════════════════════════════');
    console.log('  VERIFICATION');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Run this command to verify:');
    console.log('  node check-tenant-credentials.js\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

seedTenantUsers();
