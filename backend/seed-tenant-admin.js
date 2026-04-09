const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config();

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

async function seedTenantAdmin() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    // Check if tenant exists, if not create one
    const tenantResult = await queryRunner.query(
      `SELECT id, name FROM tenants WHERE name = $1 LIMIT 1`,
      ['Demo Tenant']
    );

    let tenantId;
    let tenantName;

    if (tenantResult.length === 0) {
      console.log('📦 Creating demo tenant...');
      const newTenant = await queryRunner.query(
        `INSERT INTO tenants (name, status, "contactEmail", "contactPhone", address, city, state, country, "postalCode", type, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id, name`,
        [
          'Demo Tenant',
          'ACTIVE',
          'admin@demotenant.com',
          '+1234567890',
          '123 Demo Street',
          'Demo City',
          'Demo State',
          'USA',
          '12345',
          'ENTERPRISE'
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

    // Check if tenant admin already exists
    const existingAdmin = await queryRunner.query(
      `SELECT id, email FROM users WHERE email = $1 AND "tenantId" = $2`,
      ['tenantadmin@demo.com', tenantId]
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Tenant admin already exists:', existingAdmin[0].email);
      
      // Verify the user
      await queryRunner.query(
        `UPDATE users SET status = $1, "emailVerifiedAt" = NOW() WHERE id = $2`,
        ['ACTIVE', existingAdmin[0].id]
      );
      console.log('✅ Tenant admin verified');

      // Display credentials
      console.log('\n' + '='.repeat(60));
      console.log('🔑 TENANT ADMIN CREDENTIALS');
      console.log('='.repeat(60));
      console.log('Email:    tenantadmin@demo.com');
      console.log('Password: TenantAdmin@123');
      console.log('Role:     TENANT_ADMIN');
      console.log('Tenant:   ' + tenantName);
      console.log('Status:   ACTIVE (Verified)');
      console.log('='.repeat(60) + '\n');

      await queryRunner.release();
      await AppDataSource.destroy();
      return;
    }

    // Create tenant admin user
    console.log('👤 Creating tenant admin user...');
    const password = 'TenantAdmin@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await queryRunner.query(
      `INSERT INTO users (
        email, 
        "passwordHash", 
        role, 
        status, 
        "tenantId",
        "emailVerifiedAt",
        "createdAt", 
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
      RETURNING id, email, role, status`,
      [
        'tenantadmin@demo.com',
        hashedPassword,
        'TENANT_ADMIN',
        'ACTIVE',
        tenantId
      ]
    );

    const user = userResult[0];
    console.log(`✅ Tenant admin created: ${user.email} (${user.id})`);

    // Create user profile
    console.log('📝 Creating user profile...');
    await queryRunner.query(
      `INSERT INTO user_profiles (
        "userId",
        "tenantId",
        "firstName",
        "lastName",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [user.id, tenantId, 'Tenant', 'Admin']
    );
    console.log('✅ User profile created');

    await queryRunner.release();

    // Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TENANT ADMIN CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('Email:    ' + user.email);
    console.log('Password: ' + password);
    console.log('Role:     ' + user.role);
    console.log('Tenant:   ' + tenantName);
    console.log('Status:   ' + user.status + ' (Verified)');
    console.log('User ID:  ' + user.id);
    console.log('='.repeat(60) + '\n');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding tenant admin:', error);
    process.exit(1);
  }
}

// Run the seed
seedTenantAdmin();
