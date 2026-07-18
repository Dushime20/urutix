-- Migration 057: Create lender_policies if missing
-- Date: 2026-07-18
--
-- Root cause:
--   GET /api/lending/tenant/lenders → QueryFailedError: relation "lender_policies" does not exist
--
-- Why:
--   Production DBs bootstrapped from 000_base_schema (or partial lending setup) created
--   `lenders` but never created `lender_policies`. Running code loads Lender.policies
--   (LEFT JOIN lender_policies) and 500s.
--
-- Note: 056 only ALTERed columns when the table already existed; it did not CREATE it.
-- This migration is fully idempotent and safe if 056 was later patched.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS lender_policies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lender_id uuid NOT NULL,
  interest_rate numeric(5,4) NOT NULL,
  repayment_term_days integer NOT NULL,
  max_advance_per_trip numeric(15,2) NOT NULL,
  max_exposure numeric(15,2) NOT NULL,
  advance_percentage numeric(5,4) NOT NULL DEFAULT 0.7,
  currency character varying(3) NOT NULL DEFAULT 'RWF',
  min_credit_score integer,
  max_dti_ratio numeric(5,4),
  min_business_age_months integer,
  required_kyc_level character varying(20) NOT NULL DEFAULT 'basic',
  max_ltv_ratio numeric(5,4),
  origination_fee_rate numeric(5,4) NOT NULL DEFAULT 0,
  penalty_rate numeric(5,4) NOT NULL DEFAULT 0,
  grace_period_days integer NOT NULL DEFAULT 3,
  early_repayment_penalty_rate numeric(5,4) NOT NULL DEFAULT 0,
  delinquency_threshold_days integer NOT NULL DEFAULT 30,
  default_threshold_days integer NOT NULL DEFAULT 90,
  allowed_purposes json,
  is_active boolean NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_832872e4152c496a12d35ca547f" PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS "IDX_f684fad7dfb0f0baffd6ea99b3"
  ON lender_policies (lender_id, created_at);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lenders')
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
       WHERE tc.table_name = 'lender_policies'
         AND tc.constraint_type = 'FOREIGN KEY'
         AND kcu.column_name = 'lender_id'
     ) THEN
    ALTER TABLE lender_policies
      ADD CONSTRAINT "FK_d5433e3c9e1a61a66a2f7b678b0"
      FOREIGN KEY (lender_id) REFERENCES lenders(id)
      ON DELETE NO ACTION ON UPDATE NO ACTION;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ensure underwriting columns exist on older tables that were created without them
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lender_policies') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'currency') THEN
      ALTER TABLE lender_policies ADD COLUMN currency character varying(3) NOT NULL DEFAULT 'RWF';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'min_credit_score') THEN
      ALTER TABLE lender_policies ADD COLUMN min_credit_score integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'max_dti_ratio') THEN
      ALTER TABLE lender_policies ADD COLUMN max_dti_ratio numeric(5,4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'min_business_age_months') THEN
      ALTER TABLE lender_policies ADD COLUMN min_business_age_months integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'required_kyc_level') THEN
      ALTER TABLE lender_policies ADD COLUMN required_kyc_level character varying(20) NOT NULL DEFAULT 'basic';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'max_ltv_ratio') THEN
      ALTER TABLE lender_policies ADD COLUMN max_ltv_ratio numeric(5,4);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'origination_fee_rate') THEN
      ALTER TABLE lender_policies ADD COLUMN origination_fee_rate numeric(5,4) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'penalty_rate') THEN
      ALTER TABLE lender_policies ADD COLUMN penalty_rate numeric(5,4) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'grace_period_days') THEN
      ALTER TABLE lender_policies ADD COLUMN grace_period_days integer NOT NULL DEFAULT 3;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'early_repayment_penalty_rate') THEN
      ALTER TABLE lender_policies ADD COLUMN early_repayment_penalty_rate numeric(5,4) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'delinquency_threshold_days') THEN
      ALTER TABLE lender_policies ADD COLUMN delinquency_threshold_days integer NOT NULL DEFAULT 30;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'default_threshold_days') THEN
      ALTER TABLE lender_policies ADD COLUMN default_threshold_days integer NOT NULL DEFAULT 90;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'allowed_purposes') THEN
      ALTER TABLE lender_policies ADD COLUMN allowed_purposes json;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lender_policies' AND column_name = 'is_active') THEN
      ALTER TABLE lender_policies ADD COLUMN is_active boolean NOT NULL DEFAULT true;
    END IF;
  END IF;
END $$;
