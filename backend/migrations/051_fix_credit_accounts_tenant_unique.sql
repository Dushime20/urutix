-- Migration 051: Fix credit_accounts unique constraint
-- Problem: credit_accounts still has UNIQUE(tenant_id) from migration 006
-- (credit_accounts_tenant_id_key). That blocks per-user credit accounts
-- (truck owners). Lookup by (tenant_id, user_id) finds nothing, then INSERT
-- fails with duplicate key on tenant_id.
--
-- Fix: drop the obsolete tenant-only unique constraint and enforce
-- uniqueness on (tenant_id, user_id) with NULL-safe coalescing so
-- one tenant-level account (user_id IS NULL) and many user-level accounts
-- can coexist per tenant.

-- 1. Drop obsolete unique constraint / index on tenant_id alone
ALTER TABLE credit_accounts
  DROP CONSTRAINT IF EXISTS credit_accounts_tenant_id_key;

DROP INDEX IF EXISTS credit_accounts_tenant_id_key;

-- 2. Ensure user_id column exists (idempotent; may already be present)
ALTER TABLE credit_accounts
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- 3. Replace any incomplete unique indexes with a NULL-safe composite unique
DROP INDEX IF EXISTS idx_credit_accounts_tenant_user;
DROP INDEX IF EXISTS "IDX_595ba72b7adb92ee80c0837694";
DROP INDEX IF EXISTS uq_credit_accounts_tenant_user;

-- One row per (tenant, user); treat NULL user_id as a sentinel so only one
-- tenant-level account is allowed per tenant.
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_accounts_tenant_user
ON credit_accounts (
  tenant_id,
  COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- 4. Supporting indexes
CREATE INDEX IF NOT EXISTS idx_credit_accounts_user_id
ON credit_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_credit_accounts_tenant
ON credit_accounts(tenant_id);

COMMENT ON COLUMN credit_accounts.user_id IS
  'User-level credit account when set; NULL = tenant-level (company) account';

SELECT 'Migration 051: credit_accounts tenant unique constraint fixed' AS message;
