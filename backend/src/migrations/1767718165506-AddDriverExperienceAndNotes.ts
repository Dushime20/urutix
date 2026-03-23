import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDriverExperienceAndNotes1767718165506 implements MigrationInterface {
  name = 'AddDriverExperienceAndNotes1767718165506';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add experience column to drivers table
    await queryRunner.query(`
      ALTER TABLE "drivers" 
      ADD COLUMN IF NOT EXISTS "experience" integer
    `);

    // Add driverNotes column to drivers table
    await queryRunner.query(`
      ALTER TABLE "drivers" 
      ADD COLUMN IF NOT EXISTS "driverNotes" text
    `);

    // Add comment for documentation
    await queryRunner.query(`
      COMMENT ON COLUMN "drivers"."experience" IS 'Years of driving experience'
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "drivers"."driverNotes" IS 'Additional notes about the driver'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the added columns
    await queryRunner.query(`
      ALTER TABLE "drivers" 
      DROP COLUMN IF EXISTS "experience"
    `);

    await queryRunner.query(`
      ALTER TABLE "drivers" 
      DROP COLUMN IF EXISTS "driverNotes"
    `);
  }
}