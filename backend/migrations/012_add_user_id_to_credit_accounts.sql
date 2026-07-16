-- Migration 012: Add user_id column to credit_accounts
-- Description: Adds user_id column to support user-level credit accounts in addition to tenant-level
-- Author: System
-- Date: 2026-02-15

-- ============================================================================
-- 1. ADD user_id COLUMN
-- ============================================================================
ALTER TABLE credit_accounts 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- ============================================================================
-- 2. ADD INDEX ON user_id
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_credit_accounts_user_id ON credit_accounts(user_id);

-- ============================================================================
-- 3. UPDATE UNIQUE CONSTRAINT
-- ============================================================================
-- Drop the old unique constraint on tenant_id only
ALTER TABLE credit_accounts 
DROP CONSTRAINT IF EXISTS credit_accounts_tenant_id_key;

-- Add composite unique index on tenant_id and user_id
-- This allows multiple credit accounts per tenant (one per user) or tenant-level accounts (user_id NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_accounts_tenant_user 
ON credit_accounts(tenant_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ============================================================================
-- 4. ADD COMMENT
-- ============================================================================
COMMENT ON COLUMN credit_accounts.user_id IS 'Optional user_id for user-level credit accounts. NULL for tenant-level accounts.';

-- Tracking is handled by schema_migrations via migrate.js (do not write TypeORM migrations table).
DO $$
BEGIN
  RAISE NOTICE 'Migration 012: user_id column added to credit_accounts successfully';
END $$;
