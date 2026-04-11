const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');
require('dotenv').config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urutix',
  synchronize: false,
  logging: false,
});

async function seedUsersOnly() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');
    console.log('🌱 Seeding users only (no subscriptions)...\n');

    // 1. Create Tenant
    console.log('1️⃣  Creating tenant...');
    const tenantResult = await AppDataSource.query(`
      INSERT INTO tenants (id, name, subdomain, type, status, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid(),
        'Test Company',
        'test-company',
        'STANDARD',
        'ACTIVE',
        NOW(),
        NOW()
      )
      RETURNING id
    `);
    const tenantId = tenantResult[0].id;
    console.log(`   ✓ Tenant created: ${tenantId}\n`);

    // 2. Create Super Admin User
    console.log('2️⃣  Creating super admin user...');
    const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
    const superAdminResult = await AppDataSource.query(`
      INSERT INTO users (
        id, email, password, role, is_active, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'superadmin@test.com',
        $1,
        'SUPER_ADMIN',
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `, [superAdminPassword]);
    const superAdminId = superAdminResult[0].id;
    console.log(`   ✓ Super Admin created: superadmin@test.com / SuperAdmin@123\n`);

    // Create Super Admin Profile
    await AppDataSource.query(`
      INSERT INTO user_profiles (
        id, user_id, first_name, last_name, phone, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'Super',
        'Admin',
        '+250788000000',
        NOW(),
        NOW()
      )
    `, [superAdminId]);

    // 3. Create Tenant Admin User
    console.log('3️⃣  Creating tenant admin user...');
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const adminResult = await AppDataSource.query(`
      INSERT INTO users (
        id, email, password, role, tenant_id, is_active, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'admin@test.com',
        $1,
        'TENANT_ADMIN',
        $2,
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `, [adminPassword, tenantId]);
    const adminId = adminResult[0].id;
    console.log(`   ✓ Tenant Admin created: admin@test.com / Admin@123\n`);

    // Create Tenant Admin Profile
    await AppDataSource.query(`
      INSERT INTO user_profiles (
        id, user_id, first_name, last_name, phone, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'Admin',
        'User',
        '+250788000001',
        NOW(),
        NOW()
      )
    `, [adminId]);

    // 4. Create Truck Owner User
    console.log('4️⃣  Creating truck owner user...');
    const truckOwnerPassword = await bcrypt.hash('TruckOwner@123', 10);
    const truckOwnerResult = await AppDataSource.query(`
      INSERT INTO users (
        id, email, password, role, tenant_id, is_active, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'truckowner@test.com',
        $1,
        'TRUCK_OWNER',
        $2,
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `, [truckOwnerPassword, tenantId]);
    const truckOwnerId = truckOwnerResult[0].id;
    console.log(`   ✓ Truck Owner created: truckowner@test.com / TruckOwner@123\n`);

    // Create Truck Owner Profile
    await AppDataSource.query(`
      INSERT INTO user_profiles (
        id, user_id, first_name, last_name, phone, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'Truck',
        'Owner',
        '+250788000002',
        NOW(),
        NOW()
      )
    `, [truckOwnerId]);

    // 5. Create Cargo Owner User
    console.log('5️⃣  Creating cargo owner user...');
    const cargoOwnerPassword = await bcrypt.hash('CargoOwner@123', 10);
    const cargoOwnerResult = await AppDataSource.query(`
      INSERT INTO users (
        id, email, password, role, tenant_id, is_active, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'cargoowner@test.com',
        $1,
        'CARGO_OWNER',
        $2,
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `, [cargoOwnerPassword, tenantId]);
    const cargoOwnerId = cargoOwnerResult[0].id;
    console.log(`   ✓ Cargo Owner created: cargoowner@test.com / CargoOwner@123\n`);

    // Create Cargo Owner Profile
    await AppDataSource.query(`
      INSERT INTO user_profiles (
        id, user_id, first_name, last_name, phone, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        'Cargo',
        'Owner',
        '+250788000003',
        NOW(),
        NOW()
      )
    `, [cargoOwnerId]);

    console.log('✅ Users seeded successfully!\n');
    console.log('═'.repeat(70));
    console.log('📋 Test Accounts Created:');
    console.log('═'.repeat(70));
    console.log('');
    console.log('👑 Super Admin:');
    console.log('   Email: superadmin@test.com');
    console.log('   Password: SuperAdmin@123');
    console.log('   Role: System administrator');
    console.log('');
    console.log('👤 Tenant Admin:');
    console.log('   Email: admin@test.com');
    console.log('   Password: Admin@123');
    console.log('   Role: Tenant administrator');
    console.log('   Tenant: Test Company');
    console.log('');
    console.log('🚛 Truck Owner:');
    console.log('   Email: truckowner@test.com');
    console.log('   Password: TruckOwner@123');
    console.log('   Role: Truck owner');
    console.log('   Tenant: Test Company');
    console.log('');
    console.log('📦 Cargo Owner:');
    console.log('   Email: cargoowner@test.com');
    console.log('   Password: CargoOwner@123');
    console.log('   Role: Cargo owner');
    console.log('   Tenant: Test Company');
    console.log('');
    console.log('═'.repeat(70));
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Login as Super Admin and create subscription plans');
    console.log('   3. Login as Tenant Admin and purchase subscriptions');
    console.log('   4. Configure the credit marketplace');
    console.log('   5. Login as Truck Owner and test buying credits');
    console.log('');
    console.log('💡 Tip: All users belong to "Test Company" tenant');
    console.log('');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedUsersOnly();
