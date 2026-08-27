import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds financing_type to loan_requests so Cargo Owner Financing and
 * Truck Owner Trip Financing share one lending infrastructure.
 */
export class AddLoanFinancingType1814000000000 implements MigrationInterface {
  name = 'AddLoanFinancingType1814000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "loan_requests"
          ADD COLUMN "financing_type" varchar(32) NOT NULL DEFAULT 'CARGO_OWNER';
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_loan_requests_financing_type"
        ON "loan_requests" ("financing_type");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_loan_requests_tenant_financing_type"
        ON "loan_requests" ("tenant_id", "financing_type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_loan_requests_tenant_financing_type";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_loan_requests_financing_type";
    `);
    await queryRunner.query(`
      ALTER TABLE "loan_requests" DROP COLUMN IF EXISTS "financing_type";
    `);
  }
}
