import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Production borrowers was created from an older base schema:
 *   id, tenant_id, user_id, metadata, created_at, updated_at
 *
 * The Borrower entity (and all lending joins) expect:
 *   company_name, contact_name, email, phone, business_type,
 *   registration_number, address, credit_score, status
 *
 * Without these columns, any query that joins loan.borrower fails with:
 *   QueryFailedError: column borrower.company_name does not exist
 *
 * Also creates lender_policies if missing (root cause of
 * QueryFailedError: relation "lender_policies" does not exist on
 * GET /lending/tenant/lenders) and ensures underwriting columns.
 *
 * Fully idempotent — safe to re-run.
 */
export class EnsureBorrowerAndLenderPolicyColumns1788000000000
  implements MigrationInterface
{
  name = 'EnsureBorrowerAndLenderPolicyColumns1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── borrowers ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "borrowers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "company_name" character varying(255) NOT NULL DEFAULT 'Unknown',
        "contact_name" character varying(255),
        "email" character varying(255),
        "phone" character varying(20),
        "business_type" character varying(100),
        "registration_number" character varying(100),
        "address" text,
        "credit_score" integer,
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_borrowers_id" PRIMARY KEY ("id")
      )
    `);

    const borrowerColumns: Array<[string, string]> = [
      ['company_name', `character varying(255) NOT NULL DEFAULT 'Unknown'`],
      ['contact_name', 'character varying(255)'],
      ['email', 'character varying(255)'],
      ['phone', 'character varying(20)'],
      ['business_type', 'character varying(100)'],
      ['registration_number', 'character varying(100)'],
      ['address', 'text'],
      ['credit_score', 'integer'],
      ['status', `character varying(20) NOT NULL DEFAULT 'active'`],
      ['user_id', 'uuid'],
      ['metadata', `jsonb DEFAULT '{}'::jsonb`],
    ];

    for (const [column, type] of borrowerColumns) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_name = 'borrowers'
          ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'borrowers' AND column_name = '${column}'
          ) THEN
            ALTER TABLE "borrowers" ADD COLUMN "${column}" ${type};
          END IF;
        END $$;
      `);
    }

    // Backfill placeholder company_name from linked user profile / email
    await queryRunner.query(`
      DO $$
      BEGIN
        UPDATE borrowers b
        SET company_name = COALESCE(
          (
            SELECT COALESCE(
              NULLIF(up."companyName", ''),
              NULLIF(TRIM(CONCAT(COALESCE(up."firstName", ''), ' ', COALESCE(up."lastName", ''))), ''),
              u.email
            )
            FROM users u
            LEFT JOIN user_profiles up ON up."userId" = u.id
            WHERE b.user_id IS NOT NULL AND u.id = b.user_id
            LIMIT 1
          ),
          NULLIF(b.email, ''),
          'Unknown'
        )
        WHERE b.company_name IS NULL
           OR b.company_name = ''
           OR b.company_name = 'Unknown';
      EXCEPTION
        WHEN undefined_column THEN
          UPDATE borrowers
          SET company_name = COALESCE(NULLIF(email, ''), 'Unknown')
          WHERE company_name IS NULL OR company_name = '' OR company_name = 'Unknown';
        WHEN undefined_table THEN
          UPDATE borrowers
          SET company_name = COALESCE(NULLIF(email, ''), 'Unknown')
          WHERE company_name IS NULL OR company_name = '' OR company_name = 'Unknown';
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_borrowers_tenant" ON "borrowers" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_borrowers_email_tenant"
      ON "borrowers" ("email", "tenant_id")
    `);

    // ── lender_policies (create if missing, then ensure columns) ───────────
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Non-destructive: leave columns in place. Dropping would break running code.
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_borrowers_email_tenant"`);
  }
}
