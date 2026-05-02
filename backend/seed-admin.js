// Load environment variables
require('dotenv').config();

const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

// Database configuration
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix_db',
  synchronize: false,
  logging: true,
});

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Check if Admin Global tenant exists, if not create one
    const tenantResult = await queryRunner.query(
      `SELECT id, name FROM tenants WHERE name = $1 LIMIT 1`,
      ['Admin Global']
    );

    let tenantId;
    let tenantName;

    if (tenantResult.length === 0) {
      console.log('📦 Creating Admin Global tenant...');
      const newTenant = await queryRunner.query(
        `INSERT INTO tenants (
          name, status, "contactEmail", "contactPhone", address, city, state, country, "postalCode", type, 
          "onboardingStep", "kycStatus", "kycData", 
          settings, features, "billingInfo", "isActive", 
          "createdAt", "updatedAt"
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
         RETURNING id, name`,
        [
          'Admin Global', 'ACTIVE', 'admin@urutix.com', '+250788000000', 'Kigali Business Center', 'Kigali', 'Kigali City', 'Rwanda', '00000', 'ENTERPRISE',
          1, 'VERIFIED', '{}', 
          '{}', '{}', '{}', true
        ]
      );
      tenantId = newTenant[0].id;
      tenantName = newTenant[0].name;
      console.log(`✅ Tenant created: ${tenantName} (${tenantId})`);
    } else {
      tenantId = tenantResult[0].id;
      tenantName = tenantResult[0].name;
      console.log(`✅ Using existing tenant: ${tenantName} (${tenantId})`);
    }

    // Check if admin already exists
    const existingAdmin = await queryRunner.query(
      `SELECT id, email, role FROM users WHERE email = $1`,
      ['admin@urutix.com']
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists:', existingAdmin[0].email);
      
      // Verify the user
      await queryRunner.query(
        `UPDATE users SET status = $1, "emailVerifiedAt" = NOW(), role = $2 WHERE id = $3`,
        ['ACTIVE', 'ADMIN', existingAdmin[0].id]
      );
      console.log('✅ Admin user verified and role updated');

      // Display credentials
      console.log('\n' + '='.repeat(60));
      console.log('🔑 SYSTEM ADMIN CREDENTIALS');
      console.log('='.repeat(60));
      console.log('Email:    admin@urutix.com');
      console.log('Password: Admin@123456');
      console.log('Role:     ADMIN');
      console.log('Tenant:   ' + tenantName);
      console.log('Status:   ACTIVE (Verified)');
      console.log('Access:   Full System Administration');
      console.log('='.repeat(60) + '\n');

      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // Create admin user
    console.log('👤 Creating system admin user...');
    const password = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await queryRunner.query(
      `INSERT INTO users (
        email, "passwordHash", role, status, "tenantId", 
        "emailVerifiedAt", "twoFactorEnabled", "loginAttempts",
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), false, 0, NOW(), NOW())
      RETURNING id, email, role, status`,
      [
        'admin@urutix.com',
        hashedPassword,
        'ADMIN',
        'ACTIVE',
        tenantId
      ]
    );

    const user = userResult[0];
    console.log(`✅ Admin user created: ${user.email} (${user.id})`);

    // Create user profile
    console.log('📝 Creating user profile...');
    await queryRunner.query(
      `INSERT INTO user_profiles (
        "userId", "tenantId", "firstName", "lastName", 
        "insuranceInfo", "bankAccountInfo", "preferences", "kycStatus", "kycDocuments",
        "rating", "totalTrips", "kyc_data", "compliance_score",
        "background_check_completed", "business_verified", "financial_verified", "address_verified", "identity_verified",
        "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, 
        '{}', '{}', '{}', 'VERIFIED', '[]', 
        0, 0, '{}', 100, 
        true, true, true, true, true, 
        NOW(), NOW()
      )`,
      [user.id, tenantId, 'System', 'Administrator']
    );
    console.log('✅ User profile created');

    await queryRunner.release();

    // Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SYSTEM ADMIN CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('Email:    ' + user.email);
    console.log('Password: ' + password);
    console.log('Role:     ' + user.role);
    console.log('Tenant:   ' + tenantName);
    console.log('Status:   ' + user.status + ' (Verified)');
    console.log('User ID:  ' + user.id);
    console.log('Access:   Full System Administration');
    console.log('='.repeat(60) + '\n');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

// Run the seed
seedAdmin();
