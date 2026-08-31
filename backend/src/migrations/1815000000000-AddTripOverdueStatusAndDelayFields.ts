import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTripOverdueStatusAndDelayFields1815000000000
  implements MigrationInterface
{
  name = 'AddTripOverdueStatusAndDelayFields1815000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "public"."trips_status_enum" ADD VALUE IF NOT EXISTS 'OVERDUE';
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "trips"
        ADD COLUMN IF NOT EXISTS "delayReason" character varying(80),
        ADD COLUMN IF NOT EXISTS "delayDescription" text,
        ADD COLUMN IF NOT EXISTS "delayReportedAt" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "delayReportedBy" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_trips_overdue_scan"
        ON "trips" ("status", "plannedEndTime")
        WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_trips_overdue_scan"`);
    await queryRunner.query(`
      ALTER TABLE "trips"
        DROP COLUMN IF EXISTS "delayReportedBy",
        DROP COLUMN IF EXISTS "delayReportedAt",
        DROP COLUMN IF EXISTS "delayDescription",
        DROP COLUMN IF EXISTS "delayReason"
    `);
    // PostgreSQL cannot easily remove enum values
  }
}
