-- Migration 065: Add currency to loan_disbursements and loan_repayments
-- Date: 2026-08-03
--
-- Root cause:
--   GET /api/lending/my-loans → QueryFailedError:
--   column LoanRequest__LoanRequest_disbursements.currency does not exist
--
-- Why:
--   LoanDisbursement / LoanRepayment entities gained a `currency` column, and a
--   TypeORM migration existed under src/migrations/, but production uses
--   migrate.js which only applies SQL files in backend/migrations/.

ALTER TABLE "loan_disbursements"
  ADD COLUMN IF NOT EXISTS "currency" character varying(3) NOT NULL DEFAULT 'RWF';

ALTER TABLE "loan_repayments"
  ADD COLUMN IF NOT EXISTS "currency" character varying(3) NOT NULL DEFAULT 'RWF';

COMMENT ON COLUMN loan_disbursements.currency IS 'ISO 4217 currency code for this disbursement';
COMMENT ON COLUMN loan_repayments.currency IS 'ISO 4217 currency code for this repayment';
