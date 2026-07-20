import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendCargoInspectionsForPreTrip1790000000000
  implements MigrationInterface
{
  name = 'ExtendCargoInspectionsForPreTrip1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cargo_inspections_inspectiontype_enum') THEN
          CREATE TYPE "public"."cargo_inspections_inspectiontype_enum" AS ENUM('PRE_TRIP', 'DELIVERY');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cargo_inspections_decision_enum') THEN
          CREATE TYPE "public"."cargo_inspections_decision_enum" AS ENUM('PASSED', 'FAILED', 'CONDITIONAL');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TYPE "public"."cargo_inspections_status_enum" ADD VALUE IF NOT EXISTS 'FAILED';
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."cargo_inspections_status_enum" ADD VALUE IF NOT EXISTS 'AWAITING_RESOLUTION';
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."cargo_inspections_status_enum" ADD VALUE IF NOT EXISTS 'READY_FOR_RE_INSPECTION';
    `);
    await queryRunner.query(`
      ALTER TYPE "public"."cargo_inspections_status_enum" ADD VALUE IF NOT EXISTS 'APPROVED';
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      ADD COLUMN IF NOT EXISTS "inspectionType" "public"."cargo_inspections_inspectiontype_enum" NOT NULL DEFAULT 'DELIVERY'
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      ADD COLUMN IF NOT EXISTS "driverId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      ADD COLUMN IF NOT EXISTS "decision" "public"."cargo_inspections_decision_enum"
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      ADD COLUMN IF NOT EXISTS "attemptNumber" integer NOT NULL DEFAULT 1
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      ADD COLUMN IF NOT EXISTS "issues" jsonb DEFAULT '[]'
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      ADD COLUMN IF NOT EXISTS "verificationData" jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      ALTER COLUMN "receiverId" DROP NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cargo_inspections_loadId_driverId"
      ON "cargo_inspections" ("loadId", "driverId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cargo_inspections_loadId_inspectionType"
      ON "cargo_inspections" ("loadId", "inspectionType")
    `);

    const fkDriverExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'FK_cargo_inspections_driverId'
        AND table_name = 'cargo_inspections'
      )
    `);

    if (!fkDriverExists[0].exists) {
      await queryRunner.query(`
        ALTER TABLE "cargo_inspections"
        ADD CONSTRAINT "FK_cargo_inspections_driverId"
        FOREIGN KEY ("driverId")
        REFERENCES "users"("id")
        ON DELETE CASCADE
        ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      DROP CONSTRAINT IF EXISTS "FK_cargo_inspections_driverId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_cargo_inspections_loadId_inspectionType"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_cargo_inspections_loadId_driverId"
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections" DROP COLUMN IF EXISTS "verificationData"
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections" DROP COLUMN IF EXISTS "issues"
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections" DROP COLUMN IF EXISTS "attemptNumber"
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections" DROP COLUMN IF EXISTS "decision"
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections" DROP COLUMN IF EXISTS "driverId"
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections" DROP COLUMN IF EXISTS "inspectionType"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."cargo_inspections_decision_enum"
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."cargo_inspections_inspectiontype_enum"
    `);
  }
}
