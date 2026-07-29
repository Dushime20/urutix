import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyToRepaymentAndDisbursement1795000000000
  implements MigrationInterface
{
  name = 'AddCurrencyToRepaymentAndDisbursement1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add currency to loan_repayments (ISO 4217, 3-char, default RWF)
    await queryRunner.query(`
      ALTER TABLE "loan_repayments"
      ADD COLUMN IF NOT EXISTS "currency" character varying(3) NOT NULL DEFAULT 'RWF'
    `);

    // Add currency to loan_disbursements
    await queryRunner.query(`
      ALTER TABLE "loan_disbursements"
      ADD COLUMN IF NOT EXISTS "currency" character varying(3) NOT NULL DEFAULT 'RWF'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan_disbursements" DROP COLUMN IF EXISTS "currency"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loan_repayments" DROP COLUMN IF EXISTS "currency"`,
    );
  }
}
