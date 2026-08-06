-- Migration 068: Create lending policy tables if missing
-- Date: 2026-08-06
--
-- Root cause:
--   POST /api/lending/policies/:lenderId/interest-rates
--   → QueryFailedError: relation "lending_policy_interest_rates" does not exist
--
-- Why:
--   Lending policy entities were added with a TypeORM migration
--   (src/database/migrations/1734567890123-CreateLendingPolicyTables.ts) but
--   Docker/production runs SQL migrations via migrate.js — no SQL file existed.
--   SchemaRecovery (1770000000004) may also have created stub tables with a
--   jsonb column only; those are replaced when empty/wrong-shaped.
--
-- Fully idempotent — safe to re-run.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Drop SchemaRecovery stub tables (jsonb-only, no entity columns) ──────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_interest_rates' AND column_name = 'rates'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_interest_rates' AND column_name = 'name'
  ) THEN
    DROP TABLE lending_policy_interest_rates;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_loan_limits' AND column_name = 'limits'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_loan_limits' AND column_name = 'name'
  ) THEN
    DROP TABLE lending_policy_loan_limits;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_eligibility_criteria' AND column_name = 'criteria'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_eligibility_criteria' AND column_name = 'name'
  ) THEN
    DROP TABLE lending_policy_eligibility_criteria;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_risk_assessment' AND column_name = 'rules'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_risk_assessment' AND column_name = 'name'
  ) THEN
    DROP TABLE lending_policy_risk_assessment;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_repayment' AND column_name = 'rules'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_repayment' AND column_name = 'name'
  ) THEN
    DROP TABLE lending_policy_repayment;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_cargo_types' AND column_name = 'cargo_types'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_cargo_types' AND column_name = 'name'
  ) THEN
    DROP TABLE lending_policy_cargo_types;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_system_config' AND column_name = 'config'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_system_config' AND column_name = 'name'
  ) THEN
    DROP TABLE lending_policy_system_config;
  END IF;
END $$;

-- ── Enum types (TypeORM naming convention) ───────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_interest_rates_risk_level_enum"
    AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_loan_limits_business_type_enum"
    AS ENUM ('individual', 'sme', 'corporation', 'cooperative');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_eligibility_criteria_category_enum"
    AS ENUM ('credit_score', 'business_age', 'revenue', 'collateral', 'guarantor', 'documents', 'industry', 'location');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_eligibility_criteria_operator_enum"
    AS ENUM ('greater_than', 'less_than', 'equal_to', 'greater_than_or_equal', 'less_than_or_equal', 'between', 'in', 'not_in');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_risk_assessment_factor_enum"
    AS ENUM ('credit_score', 'payment_history', 'debt_to_income', 'business_age', 'industry_risk', 'collateral_value', 'cash_flow', 'market_conditions');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_repayment_frequency_enum"
    AS ENUM ('weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_repayment_late_fee_type_enum"
    AS ENUM ('fixed_amount', 'percentage', 'compound_interest');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_cargo_types_cargo_category_enum"
    AS ENUM ('general', 'fragile', 'hazardous', 'refrigerated', 'liquid', 'oversized', 'valuable', 'perishable', 'chemicals', 'machinery');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_cargo_types_risk_level_enum"
    AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_system_config_approval_mode_enum"
    AS ENUM ('manual', 'automatic', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."lending_policy_system_config_compliance_level_enum"
    AS ENUM ('basic', 'standard', 'strict', 'regulatory');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 1. lending_policy_interest_rates ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lending_policy_interest_rates (
  id                  uuid NOT NULL DEFAULT uuid_generate_v4(),
  lender_id           uuid NOT NULL,
  name                character varying(255) NOT NULL,
  risk_level          "public"."lending_policy_interest_rates_risk_level_enum" NOT NULL DEFAULT 'medium',
  base_rate           numeric(5,2) NOT NULL,
  min_rate            numeric(5,2) NOT NULL,
  max_rate            numeric(5,2) NOT NULL,
  adjustment_factors  jsonb,
  description         text,
  conditions          jsonb,
  is_active           boolean NOT NULL DEFAULT true,
  priority            integer NOT NULL DEFAULT 0,
  created_at          TIMESTAMP NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP NOT NULL DEFAULT now(),
  created_by          uuid,
  updated_by          uuid,
  CONSTRAINT "PK_lending_policy_interest_rates" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_lending_policy_interest_rates_lender_id_is_active"
  ON lending_policy_interest_rates (lender_id, is_active);
CREATE INDEX IF NOT EXISTS "IDX_lending_policy_interest_rates_risk_level_is_active"
  ON lending_policy_interest_rates (risk_level, is_active);

-- ── 2. lending_policy_loan_limits ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lending_policy_loan_limits (
  id                          uuid NOT NULL DEFAULT uuid_generate_v4(),
  lender_id                   uuid NOT NULL,
  name                        character varying(255) NOT NULL,
  currency                    character varying(3) NOT NULL DEFAULT 'RWF',
  business_type               "public"."lending_policy_loan_limits_business_type_enum" NOT NULL DEFAULT 'individual',
  min_amount                  numeric(15,2) NOT NULL,
  max_amount                  numeric(15,2) NOT NULL,
  credit_score_requirement    integer NOT NULL,
  collateral_requirement      numeric(5,2) NOT NULL,
  max_utilization             numeric(5,2) NOT NULL,
  max_concurrent_loans        integer,
  annual_income_requirement   numeric(15,2),
  business_age_requirement    integer,
  description                 text,
  additional_requirements     jsonb,
  is_active                   boolean NOT NULL DEFAULT true,
  priority                    integer NOT NULL DEFAULT 0,
  created_at                  TIMESTAMP NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMP NOT NULL DEFAULT now(),
  created_by                  uuid,
  updated_by                  uuid,
  CONSTRAINT "PK_lending_policy_loan_limits" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_lending_policy_loan_limits_lender_id_is_active"
  ON lending_policy_loan_limits (lender_id, is_active);
CREATE INDEX IF NOT EXISTS "IDX_lending_policy_loan_limits_business_type_is_active"
  ON lending_policy_loan_limits (business_type, is_active);

-- ── 3. lending_policy_eligibility_criteria ───────────────────────────────────
CREATE TABLE IF NOT EXISTS lending_policy_eligibility_criteria (
  id               uuid NOT NULL DEFAULT uuid_generate_v4(),
  lender_id        uuid NOT NULL,
  name             character varying(255) NOT NULL,
  category         "public"."lending_policy_eligibility_criteria_category_enum" NOT NULL,
  description      text NOT NULL,
  requirement      text NOT NULL,
  operator         "public"."lending_policy_eligibility_criteria_operator_enum",
  minimum_value    numeric(15,2),
  maximum_value    numeric(15,2),
  allowed_values   jsonb,
  excluded_values  jsonb,
  is_required      boolean NOT NULL DEFAULT true,
  weight           integer NOT NULL DEFAULT 100,
  failure_message  text,
  is_active        boolean NOT NULL DEFAULT true,
  priority         integer NOT NULL DEFAULT 0,
  created_at       TIMESTAMP NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP NOT NULL DEFAULT now(),
  created_by       uuid,
  updated_by       uuid,
  CONSTRAINT "PK_lending_policy_eligibility_criteria" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_lending_policy_eligibility_criteria_lender_id_is_active"
  ON lending_policy_eligibility_criteria (lender_id, is_active);
CREATE INDEX IF NOT EXISTS "IDX_lending_policy_eligibility_criteria_category_is_active"
  ON lending_policy_eligibility_criteria (category, is_active);

-- ── 4. lending_policy_risk_assessment ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lending_policy_risk_assessment (
  id                uuid NOT NULL DEFAULT uuid_generate_v4(),
  lender_id         uuid NOT NULL,
  name              character varying(255) NOT NULL,
  factor            "public"."lending_policy_risk_assessment_factor_enum" NOT NULL,
  weight            numeric(5,2) NOT NULL,
  description       text,
  scoring_criteria  jsonb NOT NULL,
  threshold_score   numeric(5,2),
  adjustment_rules  jsonb,
  is_active         boolean NOT NULL DEFAULT true,
  priority          integer NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP NOT NULL DEFAULT now(),
  created_by        uuid,
  updated_by        uuid,
  CONSTRAINT "PK_lending_policy_risk_assessment" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_lending_policy_risk_assessment_lender_id_is_active"
  ON lending_policy_risk_assessment (lender_id, is_active);
CREATE INDEX IF NOT EXISTS "IDX_lending_policy_risk_assessment_factor_is_active"
  ON lending_policy_risk_assessment (factor, is_active);

-- ── 5. lending_policy_repayment ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lending_policy_repayment (
  id                          uuid NOT NULL DEFAULT uuid_generate_v4(),
  lender_id                   uuid NOT NULL,
  name                        character varying(255) NOT NULL,
  frequency                   "public"."lending_policy_repayment_frequency_enum" NOT NULL DEFAULT 'monthly',
  grace_period_days           integer NOT NULL,
  late_fee_amount             numeric(15,2) NOT NULL,
  late_fee_type               "public"."lending_policy_repayment_late_fee_type_enum" NOT NULL DEFAULT 'fixed_amount',
  penalty_rate                numeric(5,2) NOT NULL,
  max_extensions              integer NOT NULL,
  default_threshold_days      integer NOT NULL,
  early_payment_discount      numeric(5,2),
  allow_partial_payments      boolean NOT NULL DEFAULT false,
  minimum_payment_percentage  numeric(5,2),
  payment_methods             jsonb,
  escalation_rules            jsonb,
  description                 text,
  is_active                   boolean NOT NULL DEFAULT true,
  priority                    integer NOT NULL DEFAULT 0,
  created_at                  TIMESTAMP NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMP NOT NULL DEFAULT now(),
  created_by                  uuid,
  updated_by                  uuid,
  CONSTRAINT "PK_lending_policy_repayment" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_lending_policy_repayment_lender_id_is_active"
  ON lending_policy_repayment (lender_id, is_active);
CREATE INDEX IF NOT EXISTS "IDX_lending_policy_repayment_frequency_is_active"
  ON lending_policy_repayment (frequency, is_active);

-- ── 6. lending_policy_cargo_types ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lending_policy_cargo_types (
  id                                uuid NOT NULL DEFAULT uuid_generate_v4(),
  lender_id                         uuid NOT NULL,
  name                              character varying(255) NOT NULL,
  cargo_category                    "public"."lending_policy_cargo_types_cargo_category_enum" NOT NULL,
  cargo_type                        character varying(255),
  risk_level                        "public"."lending_policy_cargo_types_risk_level_enum" NOT NULL DEFAULT 'medium',
  risk_multiplier                   numeric(5,2) NOT NULL,
  max_loan_amount                   numeric(15,2) NOT NULL,
  interest_rate_adjustment          numeric(5,2),
  insurance_required                boolean NOT NULL DEFAULT false,
  minimum_insurance_coverage        numeric(15,2),
  required_certifications           jsonb,
  special_conditions                jsonb,
  prohibited_routes                 jsonb,
  required_equipment                jsonb,
  max_transit_days                  integer,
  collateral_requirement_multiplier numeric(5,2),
  description                       text,
  is_active                         boolean NOT NULL DEFAULT true,
  priority                          integer NOT NULL DEFAULT 0,
  created_at                        TIMESTAMP NOT NULL DEFAULT now(),
  updated_at                        TIMESTAMP NOT NULL DEFAULT now(),
  created_by                        uuid,
  updated_by                        uuid,
  CONSTRAINT "PK_lending_policy_cargo_types" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_lending_policy_cargo_types_lender_id_is_active"
  ON lending_policy_cargo_types (lender_id, is_active);
CREATE INDEX IF NOT EXISTS "IDX_lending_policy_cargo_types_cargo_category_is_active"
  ON lending_policy_cargo_types (cargo_category, is_active);

-- ── 7. lending_policy_system_config ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lending_policy_system_config (
  id                          uuid NOT NULL DEFAULT uuid_generate_v4(),
  lender_id                   uuid NOT NULL,
  name                        character varying(255) NOT NULL,
  auto_approval_limit         numeric(15,2) NOT NULL,
  manual_review_threshold     numeric(15,2) NOT NULL,
  approval_mode               "public"."lending_policy_system_config_approval_mode_enum" NOT NULL DEFAULT 'hybrid',
  max_concurrent_loans        integer NOT NULL DEFAULT 5,
  total_exposure_limit        numeric(15,2) NOT NULL,
  max_portfolio_utilization   numeric(5,2) NOT NULL DEFAULT 80.0,
  cooldown_period_days        integer NOT NULL DEFAULT 30,
  default_interest_rate       numeric(5,2) NOT NULL DEFAULT 15.0,
  default_repayment_term_days integer NOT NULL DEFAULT 30,
  default_advance_percentage  numeric(5,2) NOT NULL DEFAULT 70.0,
  compliance_level            "public"."lending_policy_system_config_compliance_level_enum" NOT NULL DEFAULT 'standard',
  audit_trail_enabled         boolean NOT NULL DEFAULT true,
  kyc_verification_required   boolean NOT NULL DEFAULT true,
  aml_screening_enabled       boolean NOT NULL DEFAULT false,
  notification_settings       jsonb,
  business_hours              jsonb,
  integration_settings        jsonb,
  risk_thresholds             jsonb,
  description                 text,
  is_active                   boolean NOT NULL DEFAULT true,
  created_at                  TIMESTAMP NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMP NOT NULL DEFAULT now(),
  created_by                  uuid,
  updated_by                  uuid,
  CONSTRAINT "PK_lending_policy_system_config" PRIMARY KEY (id),
  CONSTRAINT "UQ_lending_policy_system_config_lender_id" UNIQUE (lender_id)
);

-- ── Ensure currency column on loan_limits (added after initial entity design) ─
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'lending_policy_loan_limits'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lending_policy_loan_limits' AND column_name = 'currency'
  ) THEN
    ALTER TABLE lending_policy_loan_limits
      ADD COLUMN currency character varying(3) NOT NULL DEFAULT 'RWF';
  END IF;
END $$;

-- ── Foreign keys to lenders ──────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lenders') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'lending_policy_interest_rates'
        AND constraint_name = 'FK_lending_policy_interest_rates_lender_id'
    ) THEN
      ALTER TABLE lending_policy_interest_rates
        ADD CONSTRAINT "FK_lending_policy_interest_rates_lender_id"
        FOREIGN KEY (lender_id) REFERENCES lenders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'lending_policy_loan_limits'
        AND constraint_name = 'FK_lending_policy_loan_limits_lender_id'
    ) THEN
      ALTER TABLE lending_policy_loan_limits
        ADD CONSTRAINT "FK_lending_policy_loan_limits_lender_id"
        FOREIGN KEY (lender_id) REFERENCES lenders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'lending_policy_eligibility_criteria'
        AND constraint_name = 'FK_lending_policy_eligibility_criteria_lender_id'
    ) THEN
      ALTER TABLE lending_policy_eligibility_criteria
        ADD CONSTRAINT "FK_lending_policy_eligibility_criteria_lender_id"
        FOREIGN KEY (lender_id) REFERENCES lenders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'lending_policy_risk_assessment'
        AND constraint_name = 'FK_lending_policy_risk_assessment_lender_id'
    ) THEN
      ALTER TABLE lending_policy_risk_assessment
        ADD CONSTRAINT "FK_lending_policy_risk_assessment_lender_id"
        FOREIGN KEY (lender_id) REFERENCES lenders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'lending_policy_repayment'
        AND constraint_name = 'FK_lending_policy_repayment_lender_id'
    ) THEN
      ALTER TABLE lending_policy_repayment
        ADD CONSTRAINT "FK_lending_policy_repayment_lender_id"
        FOREIGN KEY (lender_id) REFERENCES lenders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'lending_policy_cargo_types'
        AND constraint_name = 'FK_lending_policy_cargo_types_lender_id'
    ) THEN
      ALTER TABLE lending_policy_cargo_types
        ADD CONSTRAINT "FK_lending_policy_cargo_types_lender_id"
        FOREIGN KEY (lender_id) REFERENCES lenders(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'lending_policy_system_config'
        AND constraint_name = 'FK_lending_policy_system_config_lender_id'
    ) THEN
      ALTER TABLE lending_policy_system_config
        ADD CONSTRAINT "FK_lending_policy_system_config_lender_id"
        FOREIGN KEY (lender_id) REFERENCES lenders(id) ON DELETE CASCADE;
    END IF;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
