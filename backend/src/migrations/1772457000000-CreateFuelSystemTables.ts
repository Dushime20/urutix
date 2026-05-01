import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFuelSystemTables1772457000000 implements MigrationInterface {
    name = 'CreateFuelSystemTables1772457000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create fuel_logs table if not exists
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "fuel_logs" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "tenant_id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "truck_id" UUID NOT NULL,
                "driver_id" UUID,
                "trip_id" UUID,
                "created_by" UUID NOT NULL,
                "fuel_date" TIMESTAMPTZ NOT NULL,
                "fuel_amount" DECIMAL(10,2) NOT NULL,
                "gallons" DECIMAL(10,2) NOT NULL,
                "price_per_gallon" DECIMAL(10,2) NOT NULL,
                "total_cost" DECIMAL(10,2) NOT NULL,
                "location" VARCHAR(255) NOT NULL,
                "odometer" DECIMAL(10,2),
                "status" VARCHAR(50) DEFAULT 'PENDING',
                "receipt_number" VARCHAR(100),
                "payment_method" VARCHAR(100),
                "notes" TEXT,
                "metadata" JSONB DEFAULT '{}',
                "odometer_image_url" VARCHAR(500),
                "receipt_url" VARCHAR(500),
                "is_flagged" BOOLEAN DEFAULT FALSE,
                "flag_reason" TEXT,
                "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Create driver_fuel_advances table if not exists
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "driver_fuel_advances" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "tenant_id" UUID NOT NULL,
                "driver_id" UUID NOT NULL,
                "trip_id" UUID,
                "amount" DECIMAL(10,2) NOT NULL,
                "status" VARCHAR(50) DEFAULT 'PENDING',
                "requested_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                "approved_at" TIMESTAMPTZ,
                "approved_by" UUID,
                "rejection_reason" TEXT,
                "notes" TEXT,
                "metadata" JSONB DEFAULT '{}',
                "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Set UUID defaults for existing tables only if they exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_wallets') THEN
                    ALTER TABLE "fuel_wallets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_wallet_transactions') THEN
                    ALTER TABLE "fuel_wallet_transactions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_budgets') THEN
                    ALTER TABLE "fuel_budgets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
                END IF;
            END $$;
        `);

        // 4. Create indexes for fuel_logs
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_fuel_logs_tenant_truck" ON "fuel_logs"("tenant_id", "truck_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_fuel_logs_tenant_driver" ON "fuel_logs"("tenant_id", "driver_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_fuel_logs_tenant_status" ON "fuel_logs"("tenant_id", "status")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_fuel_logs_tenant_date" ON "fuel_logs"("tenant_id", "fuel_date")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_fuel_logs_tenant_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_fuel_logs_tenant_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_fuel_logs_tenant_driver"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_fuel_logs_tenant_truck"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "driver_fuel_advances"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "fuel_logs"`);
        // We don't drop the defaults in down to prevent breaking other things if data exists
    }
}
