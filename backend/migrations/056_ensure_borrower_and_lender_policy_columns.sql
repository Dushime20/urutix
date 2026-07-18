-- Fix: column borrower.company_name does not exist
-- Production borrowers table was created from an older schema (user_id + metadata only).
-- Lending joins that select Borrower entity columns were 500ing.
--
-- Also creates lender_policies if missing (root cause of:
--   QueryFailedError: relation "lender_policies" does not exist
-- on GET /api/lending/tenant/lenders) and ensures underwriting columns.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS borrowers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  company_name character varying(255) NOT NULL DEFAULT 'Unknown',
  contact_name character varying(255),
  email character varying(255),
  phone character varying(20),
  business_type character varying(100),
  registration_number character varying(100),
  address text,
  credit_score integer,
  status character varying(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT PK_borrowers_id PRIMARY KEY (id)
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'borrowers') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'company_name') THEN
      ALTER TABLE borrowers ADD COLUMN company_name character varying(255) NOT NULL DEFAULT 'Unknown';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'contact_name') THEN
      ALTER TABLE borrowers ADD COLUMN contact_name character varying(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'email') THEN
      ALTER TABLE borrowers ADD COLUMN email character varying(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'phone') THEN
      ALTER TABLE borrowers ADD COLUMN phone character varying(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'business_type') THEN
      ALTER TABLE borrowers ADD COLUMN business_type character varying(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'registration_number') THEN
      ALTER TABLE borrowers ADD COLUMN registration_number character varying(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'address') THEN
      ALTER TABLE borrowers ADD COLUMN address text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'credit_score') THEN
      ALTER TABLE borrowers ADD COLUMN credit_score integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'status') THEN
      ALTER TABLE borrowers ADD COLUMN status character varying(20) NOT NULL DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'user_id') THEN
      ALTER TABLE borrowers ADD COLUMN user_id uuid;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowers' AND column_name = 'metadata') THEN
      ALTER TABLE borrowers ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
  END IF;
END $$;

-- Backfill placeholder company names from linked user profiles when possible.
-- Wrapped so missing profile columns cannot abort the migration.
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

CREATE INDEX IF NOT EXISTS idx_borrowers_tenant ON borrowers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_borrowers_email_tenant ON borrowers (email, tenant_id);

-- ---------------------------------------------------------------------------
-- LENDER_POLICIES
-- Root cause of GET /api/lending/tenant/lenders 500:
--   relation "lender_policies" does not exist
-- Production DBs bootstrapped from 000_base_schema (or partial lending setup)
-- created lenders but never created lender_policies. TypeORM then LEFT JOINs
-- this table via Lender.policies and crashes.
-- ---------------------------------------------------------------------------
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

-- lender_policies underwriting columns (entity added these; older DBs may lack them)
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
