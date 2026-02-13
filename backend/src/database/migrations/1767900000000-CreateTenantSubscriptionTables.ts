import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenantSubscriptionTables1767900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if tables already exist
    const tenantPlansExists = await queryRunner.hasTable('tenant_plans');
    const userSubscriptionsExists = await queryRunner.hasTable('user_subscriptions');

    if (tenantPlansExists && userSubscriptionsExists) {
      console.log('✓ Tenant subscription tables already exist, skipping...');
      return;
    }

    // Create tenant_plans table
    if (!tenantPlansExists) {
      await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tenant_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    }

    // Create user_subscriptions table
    if (!userSubscriptionsExists) {
      await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    }

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_plans_tenant_status ON tenant_plans("tenantId", status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_plans_target_status ON tenant_plans("targetUser", status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON user_subscriptions("userId", status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tenant_status ON user_subscriptions("tenantId", status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_status ON user_subscriptions("planId", status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires ON user_subscriptions("expiresAt");
    `);

    console.log('✅ Tenant subscription migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS user_subscriptions CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_plans CASCADE;`);
  }
}
