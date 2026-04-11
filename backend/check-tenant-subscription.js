const { DataSource } = require('typeorm');
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

async function checkTenantSubscription() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    // Get tenant admin user
    const tenantAdminResult = await AppDataSource.query(`
      SELECT id, email, "tenantId", role 
      FROM users 
      WHERE role = 'TENANT_ADMIN'
      LIMIT 1
    `);

    if (tenantAdminResult.length === 0) {
      console.log('❌ No tenant admin found');
      await AppDataSource.destroy();
      return;
    }

    const tenantAdmin = tenantAdminResult[0];
    console.log('👤 Tenant Admin:', tenantAdmin.email);
    console.log('   Tenant ID:', tenantAdmin.tenantId);
    console.log('');

    // Check for tenant-level subscriptions (userId IS NULL)
    const tenantSubscriptions = await AppDataSource.query(`
      SELECT 
        ts.id,
        ts.user_id,
        ts.plan_id,
        ts.status,
        sp.name as plan_name,
        sp.credits_per_ton_tenant,
        sp.credits_per_ton_truck_owner
      FROM tenant_subscriptions ts
      LEFT JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.tenant_id = $1 
        AND ts.user_id IS NULL
        AND ts.status = 'ACTIVE'
      ORDER BY ts.created_at DESC
    `, [tenantAdmin.tenantId]);

    console.log('📋 Tenant-level subscriptions (userId IS NULL):');
    if (tenantSubscriptions.length === 0) {
      console.log('   ❌ No active tenant-level subscriptions found');
      console.log('   This is the problem! Tenant admin needs to purchase a subscription.');
    } else {
      tenantSubscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. Plan: ${sub.plan_name}`);
        console.log(`      Status: ${sub.status}`);
        console.log(`      Credits per ton (Tenant): ${sub.credits_per_ton_tenant}`);
        console.log(`      Credits per ton (Truck Owner): ${sub.credits_per_ton_truck_owner}`);
        console.log('');
      });
    }

    // Check truck owner credits
    const truckOwnerResult = await AppDataSource.query(`
      SELECT id, email, "tenantId" 
      FROM users 
      WHERE role = 'TRUCK_OWNER'
      LIMIT 1
    `);

    if (truckOwnerResult.length > 0) {
      const truckOwner = truckOwnerResult[0];
      console.log('🚛 Truck Owner:', truckOwner.email);

      const creditAccount = await AppDataSource.query(`
        SELECT "currentBalance", "lifetimeEarned", "lifetimeSpent"
        FROM credit_accounts
        WHERE "tenantId" = $1 AND "userId" = $2
      `, [truckOwner.tenantId, truckOwner.id]);

      if (creditAccount.length > 0) {
        console.log('   Current Balance:', creditAccount[0].currentBalance, 'credits');
        console.log('   Lifetime Earned:', creditAccount[0].lifetimeEarned, 'credits');
        console.log('   Lifetime Spent:', creditAccount[0].lifetimeSpent, 'credits');
      } else {
        console.log('   ❌ No credit account found');
      }
    }

    console.log('');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkTenantSubscription();
