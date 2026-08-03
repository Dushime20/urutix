-- Rollback 065: Remove currency from loan_disbursements and loan_repayments

ALTER TABLE "loan_disbursements" DROP COLUMN IF EXISTS "currency";
ALTER TABLE "loan_repayments" DROP COLUMN IF EXISTS "currency";
