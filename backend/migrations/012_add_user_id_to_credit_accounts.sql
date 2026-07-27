-- Migration 012: Add user_id column to credit_accounts
-- Description: Adds user_id column to support user-level credit accounts in addition to tenant-level
-- Author: System
-- Date: 2026-02-15
-- Idempotent — safe to retry after partial failure or when 030/051 already applied.

-- ============================================================================
-- 1. ADD user_id COLUMN
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'credit_accounts'
  ) THEN
    ALTER TABLE credit_accounts ADD COLUMN IF NOT EXISTS user_id UUID;
  END IF;
END $$;

-- ============================================================================
-- 2. ADD INDEX ON user_id
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_credit_accounts_user_id ON credit_accounts(user_id);

-- ============================================================================
-- 3. UPDATE UNIQUE CONSTRAINT (only when credit_accounts exists)
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'credit_accounts'
  ) THEN
    RETURN;
  END IF;

  ALTER TABLE credit_accounts DROP CONSTRAINT IF EXISTS credit_accounts_tenant_id_key;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_credit_accounts_tenant_user'
  ) THEN
    CREATE UNIQUE INDEX idx_credit_accounts_tenant_user
    ON credit_accounts(tenant_id, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid));
  END IF;
END $$;

-- ============================================================================
-- 4. ADD COMMENT
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'credit_accounts' AND column_name = 'user_id'
  ) THEN
    COMMENT ON COLUMN credit_accounts.user_id IS
      'Optional user_id for user-level credit accounts. NULL for tenant-level accounts.';
  END IF;
END $$;

DO $$ BEGIN
  RAISE NOTICE 'Migration 012: user_id column added to credit_accounts successfully';
END $$;
