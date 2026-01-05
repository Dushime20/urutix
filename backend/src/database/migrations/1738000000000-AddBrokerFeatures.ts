import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrokerFeatures1738000000000 implements MigrationInterface {
  name = 'AddBrokerFeatures1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add BROKER to the users_role_enum
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'BROKER'`,
    );

    // Add broker fields to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "brokerTenantId" uuid,
      ADD COLUMN IF NOT EXISTS "totalCommissionEarned" decimal(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "defaultCommissionRate" decimal(5,2);
    `);

    // Add foreign key for brokerTenantId
    const fkExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_users_broker_tenant'
        AND table_name = 'users'
      )
    `);

    if (!fkExists[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_broker_tenant"
        FOREIGN KEY ("brokerTenantId")
        REFERENCES "tenants"("id")
        ON DELETE SET NULL;
      `);
    }

    // Add broker fields to loads table
    await queryRunner.query(`
      ALTER TABLE "loads"
      ADD COLUMN IF NOT EXISTS "brokerId" uuid,
      ADD COLUMN IF NOT EXISTS "brokerCommissionRate" decimal(5,2),
      ADD COLUMN IF NOT EXISTS "brokerCommissionAmount" decimal(15,2);
    `);

    // Add foreign key for brokerId
    const loadFkExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_loads_broker'
        AND table_name = 'loads'
      )
    `);

    if (!loadFkExists[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "loads"
        ADD CONSTRAINT "FK_loads_broker"
        FOREIGN KEY ("brokerId")
        REFERENCES "users"("id")
        ON DELETE SET NULL;
      `);
    }

    // Add broker settings to tenants
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN IF NOT EXISTS "brokerSettings" jsonb DEFAULT '{}';
    `);

    // Create broker_commissions_status_enum type
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broker_commissions_status_enum') THEN
          CREATE TYPE "public"."broker_commissions_status_enum" AS ENUM('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
        END IF;
      END $$;
    `);

    // Create broker_commissions table
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'broker_commissions'
      )
    `);

    if (!tableExists[0].exists) {
      await queryRunner.query(`
        CREATE TABLE "broker_commissions" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "tenantId" uuid NOT NULL,
          "brokerId" uuid NOT NULL,
          "loadId" uuid NOT NULL,
          "tripId" uuid,
          "loadAmount" decimal(15,2) NOT NULL,
          "commissionRate" decimal(5,2) NOT NULL,
          "commissionAmount" decimal(15,2) NOT NULL,
          "status" "public"."broker_commissions_status_enum" NOT NULL DEFAULT 'PENDING',
          "paidAt" TIMESTAMP,
          "paymentReference" character varying,
          "metadata" jsonb DEFAULT '{}',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_broker_commissions" PRIMARY KEY ("id")
        );
      `);

      // Add indexes
      await queryRunner.query(`
        CREATE INDEX "IDX_broker_commissions_broker_status" ON "broker_commissions" ("brokerId", "status");
        CREATE INDEX "IDX_broker_commissions_load" ON "broker_commissions" ("loadId");
        CREATE INDEX "IDX_broker_commissions_tenant_created" ON "broker_commissions" ("tenantId", "createdAt");
        CREATE INDEX "IDX_broker_commissions_status_created" ON "broker_commissions" ("status", "createdAt");
      `);

      // Add foreign keys
      await queryRunner.query(`
        ALTER TABLE "broker_commissions"
        ADD CONSTRAINT "FK_broker_commissions_broker"
        FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;
        
        ALTER TABLE "broker_commissions"
        ADD CONSTRAINT "FK_broker_commissions_load"
        FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;
        
        ALTER TABLE "broker_commissions"
        ADD CONSTRAINT "FK_broker_commissions_tenant"
        FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
      `);

      // Add trip foreign key if trips table exists
      const tripsTableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'trips'
        )
      `);

      if (tripsTableExists[0].exists) {
        const tripFkExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_broker_commissions_trip'
            AND table_name = 'broker_commissions'
          )
        `);

        if (!tripFkExists[0].exists) {
          await queryRunner.query(`
            ALTER TABLE "broker_commissions"
            ADD CONSTRAINT "FK_broker_commissions_trip"
            FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL;
          `);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop broker_commissions table
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_commissions"`);
    
    // Drop enum type
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'broker_commissions_status_enum') THEN
          DROP TYPE "public"."broker_commissions_status_enum";
        END IF;
      END $$;
    `);

    // Remove foreign keys
    await queryRunner.query(`
      ALTER TABLE "loads" DROP CONSTRAINT IF EXISTS "FK_loads_broker";
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_broker_tenant";
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "loads" 
      DROP COLUMN IF EXISTS "brokerId",
      DROP COLUMN IF EXISTS "brokerCommissionRate",
      DROP COLUMN IF EXISTS "brokerCommissionAmount";
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "brokerTenantId",
      DROP COLUMN IF EXISTS "totalCommissionEarned",
      DROP COLUMN IF EXISTS "defaultCommissionRate";
    `);

    await queryRunner.query(`
      ALTER TABLE "tenants" 
      DROP COLUMN IF EXISTS "brokerSettings";
    `);
  }
}

