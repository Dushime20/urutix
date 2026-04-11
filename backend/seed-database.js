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

async function seedDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');
    console.log('🌱 Seeding database with test data...\n');

    // 1. Create Tenant
    console.log('1️⃣  Creating tenant...');
    const tenantResult = await AppDataSource.query(`
      INSERT INTO tenants (id, name, subdomain, type, status, is_active, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'Test Company',
        'test-company',
        'STANDARD',
        'ACTIVE',
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `);
    const tenantId = tenantResult[0].id;
    console.log(`   ✓ Tenant created: ${tenantId}\n`);

    // 2. Create Subscription Plan
    console.log('2️⃣  Creating subscription plan...');
    const planResult = await AppDataSource.query(`
      INSERT INTO subscription_plans (
        id, name, slug, description, price, billing_cycle,
        included_credits, credits_per_ton_tenant, credits_per_ton_truck_owner,
        is_active, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        'Pro Plan',
        'pro-plan',
        'Professional plan with 5000 credits',
        99.99,
        'monthly',
        5000,
        2.00,
        5.00,
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `);
    const planId = planResult[0].id;
    console.log(`   ✓ Plan created: ${planId}\n`);

    // 3. Create Super Admin User
    console.log('3️⃣  Creating super admin user...');
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

    // 4. Create Super Admin Profile
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

    // 5. Create Tenant Admin User
    console.log('4️⃣  Creating tenant admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
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
    `, [hashedPassword, tenantId]);
    const adminId = adminResult[0].id;
    console.log(`   ✓ Tenant Admin created: admin@test.com / Admin@123\n`);

    // 6. Create Tenant Admin Profile
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

    // 7. Create 2 Active Subscriptions for Tenant Admin
    console.log('5️⃣  Creating 2 active subscriptions...');
    
    const sub1Result = await AppDataSource.query(`
      INSERT INTO tenant_subscriptions (
        id, tenant_id, user_id, plan_id, status, billing_cycle,
        current_period_start, current_period_end, auto_renew,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        'active',
        'monthly',
        NOW(),
        NOW() + INTERVAL '30 days',
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `, [tenantId, adminId, planId]);
    const sub1Id = sub1Result[0].id;

    const sub2Result = await AppDataSource.query(`
      INSERT INTO tenant_subscriptions (
        id, tenant_id, user_id, plan_id, status, billing_cycle,
        current_period_start, current_period_end, auto_renew,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        'active',
        'monthly',
        NOW(),
        NOW() + INTERVAL '30 days',
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `, [tenantId, adminId, planId]);
    const sub2Id = sub2Result[0].id;
    console.log(`   ✓ Subscription 1 created: ${sub1Id}`);
    console.log(`   ✓ Subscription 2 created: ${sub2Id}\n`);

    // 8. Create Credit Account for Tenant Admin
    console.log('6️⃣  Creating credit account...');
    const accountResult = await AppDataSource.query(`
      INSERT INTO credit_accounts (
        id, tenant_id, user_id, current_balance, subscription_credits,
        purchased_credits, bonus_credits, lifetime_earned, lifetime_spent,
        last_refresh_date, next_refresh_date, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        10000,
        10000,
        0,
        0,
        10000,
        0,
        NOW(),
        NOW() + INTERVAL '30 days',
        NOW(),
        NOW()
      )
      RETURNING id
    `, [tenantId, adminId]);
    const accountId = accountResult[0].id;
    console.log(`   ✓ Credit account created with 10,000 credits\n`);

    // 9. Create Credit Transactions for the 2 subscriptions
    console.log('7️⃣  Creating credit transactions...');
    await AppDataSource.query(`
      INSERT INTO credit_transactions (
        id, tenant_id, user_id, credit_account_id, type, amount,
        balance_after, description, subscription_id, expires_at, created_at
      )
      VALUES
        (gen_random_uuid(), $1, $2, $3, 'SUBSCRIPTION_GRANT', 5000, 5000, 'Monthly subscription credits granted', $4, NOW() + INTERVAL '30 days', NOW()),
        (gen_random_uuid(), $1, $2, $3, 'SUBSCRIPTION_GRANT', 5000, 10000, 'Monthly subscription credits granted', $5, NOW() + INTERVAL '30 days', NOW())
    `, [tenantId, adminId, accountId, sub1Id, sub2Id]);
    console.log(`   ✓ 2 grant transactions created\n`);

    // 10. Create Truck Owner User
    console.log('8️⃣  Creating truck owner user...');
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
    console.log(`   ✓ Truck owner created: truckowner@test.com / TruckOwner@123\n`);

    // 11. Create Truck Owner Profile
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

    // 12. Create Credit Account for Truck Owner (empty)
    await AppDataSource.query(`
      INSERT INTO credit_accounts (
        id, tenant_id, user_id, current_balance, subscription_credits,
        purchased_credits, bonus_credits, lifetime_earned, lifetime_spent,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        0,
        0,
        0,
        0,
        0,
        0,
        NOW(),
        NOW()
      )
    `, [tenantId, truckOwnerId]);
    console.log(`   ✓ Truck owner credit account created (0 credits)\n`);

    // 13. Create Cargo Owner User
    console.log('9️⃣  Creating cargo owner user...');
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
    console.log(`   ✓ Cargo owner created: cargoowner@test.com / CargoOwner@123\n`);

    // 14. Create Cargo Owner Profile
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

    // 15. Create Credit Account for Cargo Owner (empty)
    await AppDataSource.query(`
      INSERT INTO credit_accounts (
        id, tenant_id, user_id, current_balance, subscription_credits,
        purchased_credits, bonus_credits, lifetime_earned, lifetime_spent,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        0,
        0,
        0,
        0,
        0,
        0,
        NOW(),
        NOW()
      )
    `, [tenantId, cargoOwnerId]);
    console.log(`   ✓ Cargo owner credit account created (0 credits)\n`);

    // 16. Configure Credit Marketplace
    console.log('🔟 Configuring credit marketplace...');
    await AppDataSource.query(`
      INSERT INTO credit_marketplace_settings (
        id, tenant_id, tenant_admin_user_id, min_purchase_amount,
        max_purchase_amount, price_per_credit, is_enabled, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        500,
        NULL,
        1.00,
        true,
        NOW(),
        NOW()
      )
    `, [tenantId, adminId]);
    console.log(`   ✓ Marketplace configured (min: 500, price: $1.00/credit)\n`);

    console.log('✅ Database seeded successfully!\n');
    console.log('═'.repeat(60));
    console.log('📋 Test Accounts Created:');
    console.log('═'.repeat(60));
    console.log('');
    console.log('👑 Super Admin:');
    console.log('   Email: superadmin@test.com');
    console.log('   Password: SuperAdmin@123');
    console.log('   Role: System administrator');
    console.log('');
    console.log('👤 Tenant Admin:');
    console.log('   Email: admin@test.com');
    console.log('   Password: Admin@123');
    console.log('   Credits: 10,000 (from 2 active subscriptions)');
    console.log('');
    console.log('🚛 Truck Owner:');
    console.log('   Email: truckowner@test.com');
    console.log('   Password: TruckOwner@123');
    console.log('   Credits: 0 (ready to purchase from marketplace)');
    console.log('');
    console.log('📦 Cargo Owner:');
    console.log('   Email: cargoowner@test.com');
    console.log('   Password: CargoOwner@123');
    console.log('   Credits: 0');
    console.log('');
    console.log('🏪 Marketplace:');
    console.log('   Status: Enabled');
    console.log('   Min Purchase: 500 credits');
    console.log('   Price: $1.00 per credit');
    console.log('   Available: 10,000 credits');
    console.log('');
    console.log('═'.repeat(60));
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Restart the backend server');
    console.log('   2. Login as truck owner');
    console.log('   3. Go to dashboard/fleet/buy-credits');
    console.log('   4. Purchase credits (e.g., 1000 credits)');
    console.log('   5. Verify balance updates correctly');
    console.log('');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
