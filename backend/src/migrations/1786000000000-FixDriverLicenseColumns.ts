import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDriverLicenseColumns1786000000000 implements MigrationInterface {
  name = 'FixDriverLicenseColumns1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Increase licenseNumber length from 50 to 100
    await queryRunner.query(`
      ALTER TABLE "drivers"
      ALTER COLUMN "licenseNumber" TYPE VARCHAR(100)
    `);

    // Make licenseState nullable and increase length to 100
    await queryRunner.query(`
      ALTER TABLE "drivers"
      ALTER COLUMN "licenseState" DROP NOT NULL,
      ALTER COLUMN "licenseState" TYPE VARCHAR(100)
    `);

    // Make licenseCountry nullable and increase length to 100
    await queryRunner.query(`
      ALTER TABLE "drivers"
      ALTER COLUMN "licenseCountry" DROP NOT NULL,
      ALTER COLUMN "licenseCountry" TYPE VARCHAR(100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert licenseNumber length
    await queryRunner.query(`
      ALTER TABLE "drivers"
      ALTER COLUMN "licenseNumber" TYPE VARCHAR(50)
    `);

    // Revert licenseState
    await queryRunner.query(`
      UPDATE "drivers" SET "licenseState" = '' WHERE "licenseState" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "drivers"
      ALTER COLUMN "licenseState" SET NOT NULL,
      ALTER COLUMN "licenseState" TYPE VARCHAR(50)
    `);

    // Revert licenseCountry
    await queryRunner.query(`
      UPDATE "drivers" SET "licenseCountry" = '' WHERE "licenseCountry" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "drivers"
      ALTER COLUMN "licenseCountry" SET NOT NULL,
      ALTER COLUMN "licenseCountry" TYPE VARCHAR(50)
    `);
  }
}
