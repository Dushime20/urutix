-- ============================================================
-- Lending Policy Tables - ALTER MIGRATION
-- Adds missing columns to existing tables and renames
-- old columns to match the current entity definitions.
-- ============================================================

-- ============================================================
-- ENUM TYPES (create if not already present)
-- ============================================================

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

DO $$ BEGIN
  CREATE TYPE risk_factor_enum AS ENUM (
    'credit_score', 'payment_history', 'debt_to_income', 'business_age',
    'industry_risk', 'collateral_value', 'cash_flow', 'market_conditions'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- lending_policy_interest_rates
-- Missing: description, conditions
-- created_by/updated_by are varchar, entity expects uuid — cast
-- ============================================================

ALTER TABLE lending_policy_interest_rates
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS conditions   JSONB;

-- Fix created_by / updated_by type (varchar -> uuid)
ALTER TABLE lending_policy_interest_rates
  ALTER COLUMN created_by TYPE UUID USING created_by::uuid,
  ALTER COLUMN updated_by TYPE UUID USING updated_by::uuid;

-- ============================================================
-- lending_policy_loan_limits
-- Missing: max_concurrent_loans, annual_income_requirement,
--          business_age_requirement, description, additional_requirements
-- created_by/updated_by varchar -> uuid
-- ============================================================

ALTER TABLE lending_policy_loan_limits
  ADD COLUMN IF NOT EXISTS max_concurrent_loans        INT,
  ADD COLUMN IF NOT EXISTS annual_income_requirement   DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS business_age_requirement    INT,
  ADD COLUMN IF NOT EXISTS description                 TEXT,
  ADD COLUMN IF NOT EXISTS additional_requirements     JSONB;

ALTER TABLE lending_policy_loan_limits
  ALTER COLUMN created_by TYPE UUID USING created_by::uuid,
  ALTER COLUMN updated_by TYPE UUID USING updated_by::uuid;

-- ============================================================
-- lending_policy_risk_assessment
-- Missing: name, description, threshold_score, adjustment_rules
-- factor is varchar, entity expects enum — alter type
-- created_by/updated_by varchar -> uuid
-- ============================================================

ALTER TABLE lending_policy_risk_assessment
  ADD COLUMN IF NOT EXISTS name             VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description      TEXT,
  ADD COLUMN IF NOT EXISTS threshold_score  DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS adjustment_rules JSONB;

-- Backfill name so NOT NULL can be enforced later if needed
UPDATE lending_policy_risk_assessment SET name = 'Unnamed' WHERE name IS NULL;

-- Alter factor column to use the enum type
ALTER TABLE lending_policy_risk_assessment
  ALTER COLUMN factor TYPE risk_factor_enum USING factor::risk_factor_enum;

ALTER TABLE lending_policy_risk_assessment
  ALTER COLUMN created_by TYPE UUID USING created_by::uuid,
  ALTER COLUMN updated_by TYPE UUID USING updated_by::uuid;

-- ============================================================
-- lending_policy_repayment
-- Old columns: grace_period, late_fee, default_threshold
-- New columns: grace_period_days, late_fee_amount, late_fee_type,
--              default_threshold_days, early_payment_discount,
--              allow_partial_payments, minimum_payment_percentage,
--              payment_methods, escalation_rules, description
-- frequency is varchar, entity expects enum
-- created_by/updated_by varchar -> uuid
-- ============================================================

-- Rename old columns to new names
DO $$ BEGIN
  ALTER TABLE lending_policy_repayment RENAME COLUMN grace_period TO grace_period_days;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE lending_policy_repayment RENAME COLUMN late_fee TO late_fee_amount;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE lending_policy_repayment RENAME COLUMN default_threshold TO default_threshold_days;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- Add missing columns
ALTER TABLE lending_policy_repayment
  ADD COLUMN IF NOT EXISTS late_fee_type               penalty_type_enum NOT NULL DEFAULT 'fixed_amount',
  ADD COLUMN IF NOT EXISTS early_payment_discount      DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS allow_partial_payments      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS minimum_payment_percentage  DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS payment_methods             JSONB,
  ADD COLUMN IF NOT EXISTS escalation_rules            JSONB,
  ADD COLUMN IF NOT EXISTS description                 TEXT;

-- Alter frequency to enum type
ALTER TABLE lending_policy_repayment
  ALTER COLUMN frequency TYPE repayment_frequency_enum USING frequency::repayment_frequency_enum;

ALTER TABLE lending_policy_repayment
  ALTER COLUMN created_by TYPE UUID USING created_by::uuid,
  ALTER COLUMN updated_by TYPE UUID USING updated_by::uuid;

-- ============================================================
-- lending_policy_cargo_types
-- Missing: name, cargo_category, interest_rate_adjustment,
--          minimum_insurance_coverage, required_certifications,
--          prohibited_routes, required_equipment, max_transit_days,
--          collateral_requirement_multiplier, description
-- risk_level is varchar, entity expects enum
-- created_by/updated_by varchar -> uuid
-- ============================================================

ALTER TABLE lending_policy_cargo_types
  ADD COLUMN IF NOT EXISTS name                              VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cargo_category                    cargo_category_enum,
  ADD COLUMN IF NOT EXISTS interest_rate_adjustment          DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS minimum_insurance_coverage        DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS required_certifications           JSONB,
  ADD COLUMN IF NOT EXISTS prohibited_routes                 JSONB,
  ADD COLUMN IF NOT EXISTS required_equipment                JSONB,
  ADD COLUMN IF NOT EXISTS max_transit_days                  INT,
  ADD COLUMN IF NOT EXISTS collateral_requirement_multiplier DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS description                       TEXT;

-- Backfill name
UPDATE lending_policy_cargo_types SET name = cargo_type WHERE name IS NULL AND cargo_type IS NOT NULL;
UPDATE lending_policy_cargo_types SET name = 'Unnamed' WHERE name IS NULL;

-- Backfill cargo_category from cargo_type where possible
UPDATE lending_policy_cargo_types
  SET cargo_category = 'general'
  WHERE cargo_category IS NULL;

-- Alter risk_level to enum
ALTER TABLE lending_policy_cargo_types
  ALTER COLUMN risk_level TYPE risk_level_enum USING risk_level::risk_level_enum;

ALTER TABLE lending_policy_cargo_types
  ALTER COLUMN created_by TYPE UUID USING created_by::uuid,
  ALTER COLUMN updated_by TYPE UUID USING updated_by::uuid;

-- Create missing index on cargo_category
CREATE INDEX IF NOT EXISTS idx_lpct_cargo_category_active ON lending_policy_cargo_types (cargo_category, is_active);

-- ============================================================
-- lending_policy_system_config
-- Old columns: cooldown_period, compliance_mode, audit_trail
-- New columns: cooldown_period_days, approval_mode,
--              max_portfolio_utilization, default_interest_rate,
--              default_repayment_term_days, default_advance_percentage,
--              compliance_level, audit_trail_enabled,
--              kyc_verification_required, aml_screening_enabled,
--              notification_settings, business_hours,
--              integration_settings, risk_thresholds, description
-- created_by/updated_by varchar -> uuid
-- ============================================================

-- Rename old columns
DO $$ BEGIN
  ALTER TABLE lending_policy_system_config RENAME COLUMN cooldown_period TO cooldown_period_days;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE lending_policy_system_config RENAME COLUMN audit_trail TO audit_trail_enabled;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- Add missing columns
ALTER TABLE lending_policy_system_config
  ADD COLUMN IF NOT EXISTS approval_mode               approval_mode_enum NOT NULL DEFAULT 'hybrid',
  ADD COLUMN IF NOT EXISTS max_portfolio_utilization   DECIMAL(5,2) NOT NULL DEFAULT 80.0,
  ADD COLUMN IF NOT EXISTS default_interest_rate       DECIMAL(5,2) NOT NULL DEFAULT 15.0,
  ADD COLUMN IF NOT EXISTS default_repayment_term_days INT NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS default_advance_percentage  DECIMAL(5,2) NOT NULL DEFAULT 70.0,
  ADD COLUMN IF NOT EXISTS compliance_level            compliance_level_enum NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS kyc_verification_required   BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS aml_screening_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notification_settings       JSONB,
  ADD COLUMN IF NOT EXISTS business_hours              JSONB,
  ADD COLUMN IF NOT EXISTS integration_settings        JSONB,
  ADD COLUMN IF NOT EXISTS risk_thresholds             JSONB,
  ADD COLUMN IF NOT EXISTS description                 TEXT;

-- Drop old compliance_mode boolean (replaced by compliance_level enum)
ALTER TABLE lending_policy_system_config
  DROP COLUMN IF EXISTS compliance_mode;

ALTER TABLE lending_policy_system_config
  ALTER COLUMN created_by TYPE UUID USING created_by::uuid,
  ALTER COLUMN updated_by TYPE UUID USING updated_by::uuid;
