import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingLoadColumns1767830000000 implements MigrationInterface {
    name = 'AddMissingLoadColumns1767830000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums if they don't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."load_loadtype_enum" AS ENUM('FTL', 'LTL', 'PARTIAL');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."load_equipmenttype_enum" AS ENUM('DRY_VAN', 'REEFER', 'FLATBED', 'TANKER', 'OTHER');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."load_cargotype_enum" AS ENUM('GENERAL', 'FRAGILE', 'HAZARDOUS', 'PERISHABLE', 'OVERSIZED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Add loadType column if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'loadType'
                ) THEN
                    ALTER TABLE "loads" ADD "loadType" "public"."load_loadtype_enum" NOT NULL DEFAULT 'FTL';
                END IF;
            END $$;
        `);

        // Add equipmentType column if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'equipmentType'
                ) THEN
                    ALTER TABLE "loads" ADD "equipmentType" "public"."load_equipmenttype_enum" NOT NULL DEFAULT 'DRY_VAN';
                END IF;
            END $$;
        `);

        // Add cargoType column if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'cargoType'
                ) THEN
                    ALTER TABLE "loads" ADD "cargoType" "public"."load_cargotype_enum" NOT NULL DEFAULT 'GENERAL';
                END IF;
            END $$;
        `);

        // Create indexes if they don't exist
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_loads_loadType" ON "loads" ("loadType");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_loads_equipmentType" ON "loads" ("equipmentType");
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_loads_cargoType_urgencyLevel" ON "loads" ("cargoType", "urgencyLevel");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_loads_cargoType_urgencyLevel"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_loads_equipmentType"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_loads_loadType"`);

        // Drop columns
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "cargoType"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "equipmentType"`);
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "loadType"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."load_cargotype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."load_equipmenttype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."load_loadtype_enum"`);
    }
}
