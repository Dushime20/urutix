import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRemainingLoadColumns1767830200000 implements MigrationInterface {
    name = 'AddRemainingLoadColumns1767830200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create PaymentTerms enum if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."load_paymentterms_enum" AS ENUM('Prepaid', 'OnDelivery', 'Net15', 'Net30');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Add unitsRequired column
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'unitsRequired'
                ) THEN
                    ALTER TABLE "loads" ADD "unitsRequired" integer NOT NULL DEFAULT 1;
                END IF;
            END $$;
        `);

        // Add origin column (JSONB)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'origin'
                ) THEN
                    ALTER TABLE "loads" ADD "origin" jsonb;
                END IF;
            END $$;
        `);

        // Add destination column (JSONB)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'destination'
                ) THEN
                    ALTER TABLE "loads" ADD "destination" jsonb;
                END IF;
            END $$;
        `);

        // Add pickupWindow column (JSONB)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'pickupWindow'
                ) THEN
                    ALTER TABLE "loads" ADD "pickupWindow" jsonb;
                END IF;
            END $$;
        `);

        // Add deliveryWindow column (JSONB)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'deliveryWindow'
                ) THEN
                    ALTER TABLE "loads" ADD "deliveryWindow" jsonb;
                END IF;
            END $$;
        `);

        // Add pricing column (JSONB)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'pricing'
                ) THEN
                    ALTER TABLE "loads" ADD "pricing" jsonb;
                END IF;
            END $$;
        `);

        // Add paymentTerms column (enum)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'paymentTerms'
                ) THEN
                    ALTER TABLE "loads" ADD "paymentTerms" "public"."load_paymentterms_enum" NOT NULL DEFAULT 'OnDelivery';
                END IF;
            END $$;
        `);

        // Add invitedCarriers column (simple-array)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'invitedCarriers'
                ) THEN
                    ALTER TABLE "loads" ADD "invitedCarriers" text;
                END IF;
            END $$;
        `);

        // Add assignedCarrierId column (UUID)
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'assignedCarrierId'
                ) THEN
                    ALTER TABLE "loads" ADD "assignedCarrierId" uuid;
                END IF;
            END $$;
        `);

        // Create index on assignedCarrierId
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_loads_assignedCarrierId" ON "loads" ("assignedCarrierId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_loads_assignedCarrierId"`);

        // Drop columns
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "assignedCarrierId"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "invitedCarriers"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "paymentTerms"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "pricing"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "deliveryWindow"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "pickupWindow"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "destination"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "origin"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "unitsRequired"`);

        // Drop enum
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."load_paymentterms_enum"`);
    }
}
