import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLoanTermsTable1745000000000 implements MigrationInterface {
  name = 'CreateLoanTermsTable1745000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "loan_terms" (
        "id"                           uuid NOT NULL DEFAULT uuid_generate_v4(),
        "loan_request_id"              uuid NOT NULL,
        "lender_id"                    uuid NOT NULL,
        "nominal_rate"                 numeric(7,4),
        "effective_annual_rate"        numeric(7,4),
        "risk_score"                   numeric(6,2),
        "risk_level"                   varchar(20),
        "credit_score_input"           integer,
        "interest_rate_policy_id"      uuid,
        "interest_rate_policy_snapshot" jsonb,
        "risk_score_breakdown"         jsonb,
        "base_rate"                    numeric(7,4),
        "rate_adjustment"              numeric(7,4),
        "origination_fee_rate"         numeric(7,4),
        "currency"                     varchar(3) NOT NULL DEFAULT 'USD',
        "engine_version"               varchar(20) NOT NULL DEFAULT '1.0.0',
        "computed_at"                  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_loan_terms" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_loan_terms_loan_request_id" UNIQUE ("loan_request_id"),
        CONSTRAINT "FK_loan_terms_loan_request"
          FOREIGN KEY ("loan_request_id")
          REFERENCES "loan_requests"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_loan_terms_lender_id_computed_at"
        ON "loan_terms" ("lender_id", "computed_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_loan_terms_lender_id_computed_at"`);
    await queryRunner.query(`DROP TABLE "loan_terms"`);
  }
}
