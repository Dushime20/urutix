import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCargoInspectionTable1737200000000 implements MigrationInterface {
  name = 'CreateCargoInspectionTable1737200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for inspection status
    await queryRunner.query(`
      CREATE TYPE "public"."cargo_inspections_status_enum" AS ENUM(
        'PENDING',
        'IN_PROGRESS',
        'COMPLETED',
        'DISPUTED'
      )
    `);

    // Create cargo_inspections table
    await queryRunner.query(`
      CREATE TABLE "cargo_inspections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "loadId" uuid NOT NULL,
        "receiverId" uuid NOT NULL,
        "status" "public"."cargo_inspections_status_enum" NOT NULL DEFAULT 'PENDING',
        "checklist" jsonb NOT NULL DEFAULT '[]',
        "overallNotes" text,
        "allItemsVerified" boolean NOT NULL DEFAULT false,
        "verifiedCount" integer NOT NULL DEFAULT 0,
        "totalItems" integer NOT NULL DEFAULT 0,
        "discrepancyCount" integer NOT NULL DEFAULT 0,
        "discrepancies" jsonb,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cargo_inspections_id" PRIMARY KEY ("id")
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_cargo_inspections_loadId_receiverId" 
      ON "cargo_inspections" ("loadId", "receiverId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_cargo_inspections_status_createdAt" 
      ON "cargo_inspections" ("status", "createdAt")
    `);

    // Create foreign keys
    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      ADD CONSTRAINT "FK_cargo_inspections_loadId"
      FOREIGN KEY ("loadId")
      REFERENCES "loads"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      ADD CONSTRAINT "FK_cargo_inspections_receiverId"
      FOREIGN KEY ("receiverId")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      DROP CONSTRAINT IF EXISTS "FK_cargo_inspections_receiverId"
    `);

    await queryRunner.query(`
      ALTER TABLE "cargo_inspections"
      DROP CONSTRAINT IF EXISTS "FK_cargo_inspections_loadId"
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_cargo_inspections_status_createdAt"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_cargo_inspections_loadId_receiverId"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "cargo_inspections"`);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."cargo_inspections_status_enum"
    `);
  }
}

