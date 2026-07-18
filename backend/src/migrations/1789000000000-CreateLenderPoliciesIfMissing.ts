import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Production fix: relation "lender_policies" does not exist.
 *
 * GET /api/lending/tenant/lenders LEFT JOINs lender_policies via Lender.policies.
 * DBs bootstrapped without the full lending schema never created this table.
 * Prior migration 178800 only ALTERed columns when the table already existed.
 *
 * Fully idempotent — safe to re-run.
 */
export class CreateLenderPoliciesIfMissing1789000000000
  implements MigrationInterface
{
  name = 'CreateLenderPoliciesIfMissing1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "lender_policies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "lender_id" uuid NOT NULL,
        "interest_rate" numeric(5,4) NOT NULL,
        "repayment_term_days" integer NOT NULL,
        "max_advance_per_trip" numeric(15,2) NOT NULL,
        "max_exposure" numeric(15,2) NOT NULL,
        "advance_percentage" numeric(5,4) NOT NULL DEFAULT 0.7,
        "currency" character varying(3) NOT NULL DEFAULT 'RWF',
        "min_credit_score" integer,
        "max_dti_ratio" numeric(5,4),
        "min_business_age_months" integer,
        "required_kyc_level" character varying(20) NOT NULL DEFAULT 'basic',
        "max_ltv_ratio" numeric(5,4),
        "origination_fee_rate" numeric(5,4) NOT NULL DEFAULT 0,
        "penalty_rate" numeric(5,4) NOT NULL DEFAULT 0,
        "grace_period_days" integer NOT NULL DEFAULT 3,
        "early_repayment_penalty_rate" numeric(5,4) NOT NULL DEFAULT 0,
        "delinquency_threshold_days" integer NOT NULL DEFAULT 30,
        "default_threshold_days" integer NOT NULL DEFAULT 90,
        "allowed_purposes" json,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_832872e4152c496a12d35ca547f" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_f684fad7dfb0f0baffd6ea99b3"
      ON "lender_policies" ("lender_id", "created_at")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables WHERE table_name = 'lenders'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_d5433e3c9e1a61a66a2f7b678b0'
            AND table_name = 'lender_policies'
        ) THEN
          ALTER TABLE "lender_policies"
            ADD CONSTRAINT "FK_d5433e3c9e1a61a66a2f7b678b0"
            FOREIGN KEY ("lender_id") REFERENCES "lenders"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);

    const policyColumns: Array<[string, string]> = [
      ['currency', `character varying(3) NOT NULL DEFAULT 'RWF'`],
      ['min_credit_score', 'integer'],
      ['max_dti_ratio', 'numeric(5,4)'],
      ['min_business_age_months', 'integer'],
      ['required_kyc_level', `character varying(20) NOT NULL DEFAULT 'basic'`],
      ['max_ltv_ratio', 'numeric(5,4)'],
      ['origination_fee_rate', `numeric(5,4) NOT NULL DEFAULT 0`],
      ['penalty_rate', `numeric(5,4) NOT NULL DEFAULT 0`],
      ['grace_period_days', `integer NOT NULL DEFAULT 3`],
      ['early_repayment_penalty_rate', `numeric(5,4) NOT NULL DEFAULT 0`],
      ['delinquency_threshold_days', `integer NOT NULL DEFAULT 30`],
      ['default_threshold_days', `integer NOT NULL DEFAULT 90`],
      ['allowed_purposes', 'json'],
      ['is_active', `boolean NOT NULL DEFAULT true`],
    ];

    for (const [column, type] of policyColumns) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_name = 'lender_policies'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'lender_policies' AND column_name = '${column}'
          ) THEN
            ALTER TABLE "lender_policies" ADD COLUMN "${column}" ${type};
          END IF;
        END $$;
      `);
    }
  }

  public async down(): Promise<void> {
    // Non-destructive: do not drop the table in production.
  }
}
