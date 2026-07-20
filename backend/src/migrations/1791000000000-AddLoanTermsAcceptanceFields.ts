import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds borrower terms-acceptance tracking required for IFRS 9 / TILA-compliant
 * loan origination: lender offers terms → borrower accepts → disbursement.
 */
export class AddLoanTermsAcceptanceFields1791000000000
  implements MigrationInterface
{
  name = 'AddLoanTermsAcceptanceFields1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<[string, string]> = [
      ['terms_offered_at', 'TIMESTAMP'],
      ['borrower_accepted_at', 'TIMESTAMP'],
      ['loan_term_months', 'integer'],
      ['terms_declined_at', 'TIMESTAMP'],
      ['terms_decline_reason', 'text'],
    ];

    for (const [col, type] of columns) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "loan_requests" ADD COLUMN "${col}" ${type};
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const col of [
      'terms_offered_at',
      'borrower_accepted_at',
      'loan_term_months',
      'terms_declined_at',
      'terms_decline_reason',
    ]) {
      await queryRunner.query(`
        ALTER TABLE "loan_requests" DROP COLUMN IF EXISTS "${col}";
      `);
    }
  }
}
