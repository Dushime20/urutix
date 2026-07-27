-- Fix: POST /api/disputes 500 — category column still uses legacy dispute_category
-- enum (PAYMENT, DAMAGE, …) while the app sends PAYMENT_ISSUE, DELIVERY_DELAY, etc.
-- Safe to re-run: only migrates when the column UDT is still the legacy type.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disputes_v2_category_enum') THEN
    CREATE TYPE public."disputes_v2_category_enum" AS ENUM (
      'PAYMENT_ISSUE','DELIVERY_DELAY','CARGO_DAMAGE','CARGO_LOSS','ROUTE_VIOLATION',
      'CONTRACT_VIOLATION','DRIVER_MISCONDUCT','VEHICLE_DAMAGE','LOADING_DELAY',
      'UNLOADING_DELAY','DOCUMENTATION_ISSUE','FRAUD_SUSPECTED','OTHER',
      'TRUCK_BREAKDOWN','AUCTION_ISSUE','BROKER_COMPLAINT','LENDER_COMPLAINT',
      'IDENTITY_VERIFICATION','INSURANCE_CLAIM','ACCOUNT_SUSPENSION',
      'TECHNICAL_PROBLEM','BILLING_ISSUE','SUBSCRIPTION_ISSUE',
      'FEATURE_REQUEST','SECURITY_CONCERN'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disputes_v2_status_enum') THEN
    CREATE TYPE public."disputes_v2_status_enum" AS ENUM (
      'OPEN','UNDER_REVIEW','ASSIGNED','INVESTIGATING','AWAITING_INFORMATION',
      'ESCALATED','RESOLVED','REJECTED','CLOSED','REOPENED'
    );
  END IF;
END $$;

DO $$
DECLARE
  cat_udt text;
BEGIN
  SELECT c.udt_name INTO cat_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'disputes_v2'
    AND c.column_name = 'category';

  IF cat_udt = 'dispute_category' THEN
    ALTER TABLE disputes_v2
      ADD COLUMN IF NOT EXISTS category_new public."disputes_v2_category_enum";

    UPDATE disputes_v2 SET category_new = (
      CASE category::text
        WHEN 'PAYMENT' THEN 'PAYMENT_ISSUE'
        WHEN 'DAMAGE' THEN 'CARGO_DAMAGE'
        WHEN 'DELAY' THEN 'DELIVERY_DELAY'
        WHEN 'DOCUMENTATION' THEN 'DOCUMENTATION_ISSUE'
        WHEN 'SERVICE' THEN 'OTHER'
        ELSE category::text
      END
    )::public."disputes_v2_category_enum"
    WHERE category_new IS NULL;

    UPDATE disputes_v2 SET category_new = 'OTHER'::public."disputes_v2_category_enum"
    WHERE category_new IS NULL;

    ALTER TABLE disputes_v2 DROP COLUMN category;
    ALTER TABLE disputes_v2 RENAME COLUMN category_new TO category;
    ALTER TABLE disputes_v2 ALTER COLUMN category SET NOT NULL;
    ALTER TABLE disputes_v2 ALTER COLUMN category SET DEFAULT 'OTHER'::public."disputes_v2_category_enum";
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE '062 category migration skipped: %', SQLERRM;
END $$;

DO $$
DECLARE
  status_udt text;
BEGIN
  SELECT c.udt_name INTO status_udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'disputes_v2'
    AND c.column_name = 'status';

  IF status_udt = 'dispute_status_v2' THEN
    ALTER TABLE disputes_v2
      ADD COLUMN IF NOT EXISTS status_new public."disputes_v2_status_enum";

    UPDATE disputes_v2 SET status_new = (
      CASE status::text
        WHEN 'IN_REVIEW' THEN 'UNDER_REVIEW'
        ELSE status::text
      END
    )::public."disputes_v2_status_enum"
    WHERE status_new IS NULL;

    UPDATE disputes_v2 SET status_new = 'OPEN'::public."disputes_v2_status_enum"
    WHERE status_new IS NULL;

    ALTER TABLE disputes_v2 DROP COLUMN status;
    ALTER TABLE disputes_v2 RENAME COLUMN status_new TO status;
    ALTER TABLE disputes_v2 ALTER COLUMN status SET NOT NULL;
    ALTER TABLE disputes_v2 ALTER COLUMN status SET DEFAULT 'OPEN'::public."disputes_v2_status_enum";
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE '062 status migration skipped: %', SQLERRM;
END $$;
