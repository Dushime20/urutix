import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTruckComplianceDocuments1801000000000
  implements MigrationInterface
{
  name = 'AddTruckComplianceDocuments1801000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "complianceDocuments" jsonb DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trucks" DROP COLUMN IF EXISTS "complianceDocuments"`,
    );
  }
}
