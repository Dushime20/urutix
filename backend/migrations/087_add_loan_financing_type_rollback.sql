-- Rollback 087: Remove financing_type from loan_requests

DROP INDEX IF EXISTS "IDX_loan_requests_tenant_financing_type";
DROP INDEX IF EXISTS "IDX_loan_requests_financing_type";
ALTER TABLE "loan_requests" DROP COLUMN IF EXISTS "financing_type";
