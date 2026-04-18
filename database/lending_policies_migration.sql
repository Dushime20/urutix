-- ============================================================
-- Lending Policy Tables Migration
-- Run this against your PostgreSQL database to create all
-- lending policy tables required by the backend entities.
-- ============================================================

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE risk_level_enum AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE business_type_enum AS ENUM ('individual', 'sme', 'corporation', 'cooperative');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE eligibility_category_enum AS ENUM (
    'credit_score', 'business_age', 'revenue', 'collateral',
    'guarantor', 'documents', 'industry', 'location'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE comparison_operator_enum AS ENUM (
    'greater_than', 'less_than', 'equal_to',
    'greater_than_or_equal', 'less_than_or_equal',
    'between', 'in', 'not_in'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE risk_factor_enum AS ENUM (
    'credit_score', 'payment_history', 'debt_to_income', 'business_age',
    'industry_risk', 'collateral_value', 'cash_flow', 'market_conditions'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE repayment_frequency_enum AS ENUM (
    'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE penalty_type_enum AS ENUM (
    'fixed_amount', 'percentage', 'compound_interest'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cargo_category_enum AS ENUM (
    'general', 'fragile', 'hazardous', 'refrigerated', 'liquid',
    'oversized', 'valuable', 'perishable', 'chemicals', 'machinery'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approval_mode_enum AS ENUM ('manual', 'automatic', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE compliance_level_enum AS ENUM ('basic', 'standard', 'strict', 'regulatory');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 1. lending_policy_interest_rates
-- ============================================================

CREATE TABLE IF NOT EXISTS lending_policy_interest_rates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id           UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  risk_level          risk_level_enum NOT NULL DEFAULT 'medium',
  base_rate           DECIMAL(5,2) NOT NULL,
  min_rate            DECIMAL(5,2) NOT NULL,
  max_rate            DECIMAL(5,2) NOT NULL,
  adjustment_factors  JSONB,
  description         TEXT,
  conditions          JSONB,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  priority            INT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID,
  updated_by          UUID
);

CREATE INDEX IF NOT EXISTS idx_lpir_lender_active   ON lending_policy_interest_rates (lender_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lpir_risk_active      ON lending_policy_interest_rates (risk_level, is_active);

-- ============================================================
-- 2. lending_policy_loan_limits
-- ============================================================

CREATE TABLE IF NOT EXISTS lending_policy_loan_limits (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id                   UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  name                        VARCHAR(255) NOT NULL,
  business_type               business_type_enum NOT NULL DEFAULT 'individual',
  min_amount                  DECIMAL(15,2) NOT NULL,
  max_amount                  DECIMAL(15,2) NOT NULL,
  credit_score_requirement    INT NOT NULL,
  collateral_requirement      DECIMAL(5,2) NOT NULL,
  max_utilization             DECIMAL(5,2) NOT NULL,
  max_concurrent_loans        INT,
  annual_income_requirement   DECIMAL(15,2),
  business_age_requirement    INT,
  description                 TEXT,
  additional_requirements     JSONB,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  priority                    INT NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                  UUID,
  updated_by                  UUID
);

CREATE INDEX IF NOT EXISTS idx_lpll_lender_active        ON lending_policy_loan_limits (lender_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lpll_business_type_active ON lending_policy_loan_limits (business_type, is_active);

-- ============================================================
-- 3. lending_policy_eligibility_criteria
-- ============================================================

CREATE TABLE IF NOT EXISTS lending_policy_eligibility_criteria (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id        UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  category         eligibility_category_enum NOT NULL,
  description      TEXT NOT NULL,
  requirement      TEXT NOT NULL,
  operator         comparison_operator_enum,
  minimum_value    DECIMAL(15,2),
  maximum_value    DECIMAL(15,2),
  allowed_values   JSONB,
  excluded_values  JSONB,
  is_required      BOOLEAN NOT NULL DEFAULT TRUE,
  weight           INT NOT NULL DEFAULT 100,
  failure_message  TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  priority         INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID,
  updated_by       UUID
);

CREATE INDEX IF NOT EXISTS idx_lpec_lender_active   ON lending_policy_eligibility_criteria (lender_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lpec_category_active ON lending_policy_eligibility_criteria (category, is_active);

-- ============================================================
-- 4. lending_policy_risk_assessment
-- ============================================================

CREATE TABLE IF NOT EXISTS lending_policy_risk_assessment (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id         UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  factor            risk_factor_enum NOT NULL,
  weight            DECIMAL(5,2) NOT NULL,
  description       TEXT,
  scoring_criteria  JSONB NOT NULL,
  threshold_score   DECIMAL(5,2),
  adjustment_rules  JSONB,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  priority          INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        UUID,
  updated_by        UUID
);

CREATE INDEX IF NOT EXISTS idx_lpra_lender_active ON lending_policy_risk_assessment (lender_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lpra_factor_active ON lending_policy_risk_assessment (factor, is_active);

-- ============================================================
-- 5. lending_policy_repayment
-- ============================================================

CREATE TABLE IF NOT EXISTS lending_policy_repayment (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id                   UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  name                        VARCHAR(255) NOT NULL,
  frequency                   repayment_frequency_enum NOT NULL DEFAULT 'monthly',
  grace_period_days           INT NOT NULL,
  late_fee_amount             DECIMAL(15,2) NOT NULL,
  late_fee_type               penalty_type_enum NOT NULL DEFAULT 'fixed_amount',
  penalty_rate                DECIMAL(5,2) NOT NULL,
  max_extensions              INT NOT NULL,
  default_threshold_days      INT NOT NULL,
  early_payment_discount      DECIMAL(5,2),
  allow_partial_payments      BOOLEAN NOT NULL DEFAULT FALSE,
  minimum_payment_percentage  DECIMAL(5,2),
  payment_methods             JSONB,
  escalation_rules            JSONB,
  description                 TEXT,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  priority                    INT NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                  UUID,
  updated_by                  UUID
);

CREATE INDEX IF NOT EXISTS idx_lpr_lender_active    ON lending_policy_repayment (lender_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lpr_frequency_active ON lending_policy_repayment (frequency, is_active);

-- ============================================================
-- 6. lending_policy_cargo_types
-- ============================================================

CREATE TABLE IF NOT EXISTS lending_policy_cargo_types (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id                       UUID NOT NULL REFERENCES lenders(id) ON DELETE CASCADE,
  name                            VARCHAR(255) NOT NULL,
  cargo_category                  cargo_category_enum NOT NULL,
  cargo_type                      VARCHAR(255),
  risk_level                      risk_level_enum NOT NULL DEFAULT 'medium',
  risk_multiplier                 DECIMAL(5,2) NOT NULL,
  max_loan_amount                 DECIMAL(15,2) NOT NULL,
  interest_rate_adjustment        DECIMAL(5,2),
  insurance_required              BOOLEAN NOT NULL DEFAULT FALSE,
  minimum_insurance_coverage      DECIMAL(15,2),
  required_certifications         JSONB,
  special_conditions              JSONB,
  prohibited_routes               JSONB,
  required_equipment              JSONB,
  max_transit_days                INT,
  collateral_requirement_multiplier DECIMAL(5,2),
  description                     TEXT,
  is_active                       BOOLEAN NOT NULL DEFAULT TRUE,
  priority                        INT NOT NULL DEFAULT 0,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                      UUID,
  updated_by                      UUID
);

CREATE INDEX IF NOT EXISTS idx_lpct_lender_active        ON lending_policy_cargo_types (lender_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lpct_cargo_category_active ON lending_policy_cargo_types (cargo_category, is_active);

-- ============================================================
-- 7. lending_policy_system_config
-- ============================================================

CREATE TABLE IF NOT EXISTS lending_policy_system_config (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id                   UUID NOT NULL UNIQUE REFERENCES lenders(id) ON DELETE CASCADE,
  name                        VARCHAR(255) NOT NULL,
  auto_approval_limit         DECIMAL(15,2) NOT NULL,
  manual_review_threshold     DECIMAL(15,2) NOT NULL,
  approval_mode               approval_mode_enum NOT NULL DEFAULT 'hybrid',
  max_concurrent_loans        INT NOT NULL DEFAULT 5,
  total_exposure_limit        DECIMAL(15,2) NOT NULL,
  max_portfolio_utilization   DECIMAL(5,2) NOT NULL DEFAULT 80.0,
  cooldown_period_days        INT NOT NULL DEFAULT 30,
  default_interest_rate       DECIMAL(5,2) NOT NULL DEFAULT 15.0,
  default_repayment_term_days INT NOT NULL DEFAULT 30,
  default_advance_percentage  DECIMAL(5,2) NOT NULL DEFAULT 70.0,
  compliance_level            compliance_level_enum NOT NULL DEFAULT 'standard',
  audit_trail_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  kyc_verification_required   BOOLEAN NOT NULL DEFAULT TRUE,
  aml_screening_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  notification_settings       JSONB,
  business_hours              JSONB,
  integration_settings        JSONB,
  risk_thresholds             JSONB,
  description                 TEXT,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by                  UUID,
  updated_by                  UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lpsc_lender_id ON lending_policy_system_config (lender_id);
