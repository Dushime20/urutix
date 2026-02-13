const { Client } = require('pg');
require('dotenv').config();

async function runTenantSubscriptionMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'urutix',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if tables already exist
    const checkTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('tenant_plans', 'user_subscriptions')
    `);

    if (checkTables.rows.length === 2) {
      console.log('✓ Tenant subscription tables already exist!');
      console.log('  - tenant_plans');
      console.log('  - user_subscriptions');
      console.log('\n✅ Migration not needed, tables are ready to use.');
      return;
    }

    console.log('📦 Creating tenant subscription tables...\n');

    // Create tenant_plans table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenantId" UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "targetUser" VARCHAR(50) NOT NULL DEFAULT 'BOTH',
        price DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
        duration VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        features JSONB DEFAULT '{}',
        "maxShipments" INTEGER,
        "maxTrucks" INTEGER,
        "maxDrivers" INTEGER,
        "maxTransactions" INTEGER,
        "advancedAnalytics" BOOLEAN DEFAULT FALSE,
        "prioritySupport" BOOLEAN DEFAULT FALSE,
        "apiAccess" BOOLEAN DEFAULT FALSE,
        "displayOrder" INTEGER DEFAULT 0,
        "isPopular" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT fk_tenant_plans_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ Created tenant_plans table');

    // Create user_subscriptions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "tenantId" UUID NOT NULL,
        "planId" UUID NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        "startDate" TIMESTAMP NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "cancelledAt" TIMESTAMP,
        "suspendedAt" TIMESTAMP,
        "suspendedReason" TEXT,
        "autoRenew" BOOLEAN DEFAULT FALSE,
        "nextBillingDate" TIMESTAMP,
        "amountPaid" DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
        "paymentId" VARCHAR(255),
        "invoiceId" VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_user_subscriptions_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_subscriptions_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_subscriptions_plan FOREIGN KEY ("planId") REFERENCES tenant_plans(id) ON DELETE RESTRICT
      );
    `);
    console.log('✅ Created user_subscriptions table');

    // Create indexes
    console.log('\n📊 Creating indexes...');
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tenant_plans_tenant_status ON tenant_plans("tenantId", status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tenant_plans_target_status ON tenant_plans("targetUser", status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions("userId", status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tenant_status ON user_subscriptions("tenantId", status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_status ON user_subscriptions("planId", status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires ON user_subscriptions("expiresAt");`);
    
    console.log('✅ Created all indexes');

    // Record migration in migrations table
    await client.query(`
      INSERT INTO migrations (timestamp, name)
      VALUES (1767900000000, 'CreateTenantSubscriptionTables1767900000000')
      ON CONFLICT DO NOTHING;
    `);

    console.log('\n✅ Tenant subscription migration completed successfully!');
    console.log('\n📋 Tables created:');
    console.log('  - tenant_plans');
    console.log('  - user_subscriptions');
    console.log('\n🚀 You can now start using the subscription system!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTenantSubscriptionMigration();
