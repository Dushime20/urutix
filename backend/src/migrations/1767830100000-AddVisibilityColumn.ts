import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVisibilityColumn1767830100000 implements MigrationInterface {
    name = 'AddVisibilityColumn1767830100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create visibility enum if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."load_visibility_enum" AS ENUM('public', 'private');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Add visibility column if it doesn't exist
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'loads' AND column_name = 'visibility'
                ) THEN
                    ALTER TABLE "loads" ADD "visibility" "public"."load_visibility_enum" NOT NULL DEFAULT 'public';
                END IF;
            END $$;
        `);

        // Create index on visibility if it doesn't exist
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_loads_visibility" ON "loads" ("visibility");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_loads_visibility"`);

        // Drop column
        await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "visibility"`);

        // Drop enum
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."load_visibility_enum"`);
    }
}
