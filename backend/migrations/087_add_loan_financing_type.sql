-- Migration 087: Add financing_type to loan_requests
-- Date: 2026-09-07
--
-- Root cause:
--   GET /api/lending/my-loans → QueryFailedError:
--   column LoanRequest.financing_type does not exist
--
-- Why:
--   LoanRequest gained financing_type (CARGO_OWNER | TRUCK_OWNER_TRIP) so cargo-owner
--   and truck-owner products share one table. A TypeORM migration existed under
--   src/migrations/1814000000000-AddLoanFinancingType.ts, but production uses
--   migrate.js which only applies SQL files in backend/migrations/.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'loan_requests'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'loan_requests'
        AND column_name = 'financing_type'
    ) THEN
      ALTER TABLE "loan_requests"
        ADD COLUMN "financing_type" varchar(32) NOT NULL DEFAULT 'CARGO_OWNER';
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IDX_loan_requests_financing_type"
  ON "loan_requests" ("financing_type");

CREATE INDEX IF NOT EXISTS "IDX_loan_requests_tenant_financing_type"
  ON "loan_requests" ("tenant_id", "financing_type");

COMMENT ON COLUMN loan_requests.financing_type IS
  'Financing product: CARGO_OWNER (pay truck owner) or TRUCK_OWNER_TRIP (working capital)';
