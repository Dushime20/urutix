-- Migration: 038_add_role_column_to_users
-- Adds the 'role' enum column to the users table.
-- Idempotent: safe to run on any database regardless of current state.

-- 1. Create the role enum type if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'users_role_enum'
  ) THEN
    CREATE TYPE public.users_role_enum AS ENUM (
      'SUPER_ADMIN',
      'ADMIN',
      'TENANT_ADMIN',
      'CARGO_OWNER',
      'CARGO_RECEIVER',
      'TRUCK_OWNER',
      'DRIVER',
      'FLEET_MANAGER',
      'FLEET_DISPATCHER',
      'FLEET_ACCOUNTANT',
      'FLEET_SAFETY_OFFICER',
      'BROKER',
      'LENDER',
      'AGENT',
      'CUSTOMS_OFFICER'
    );
  END IF;
END
$$;

-- 2. Add the role column if it does not already exist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role public.users_role_enum NOT NULL DEFAULT 'CARGO_OWNER';

-- 3. Add status enum type if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'users_status_enum'
  ) THEN
    CREATE TYPE public.users_status_enum AS ENUM (
      'ACTIVE',
      'INACTIVE',
      'SUSPENDED',
      'PENDING_VERIFICATION',
      'DEACTIVATED'
    );
  END IF;
END
$$;

-- 4. Add status column if missing
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status public.users_status_enum NOT NULL DEFAULT 'PENDING_VERIFICATION';

-- 5. Add other columns that may be missing on older databases
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone             VARCHAR,
  ADD COLUMN IF NOT EXISTS broker_tenant_id  UUID,
  ADD COLUMN IF NOT EXISTS login_attempts    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until      TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_login_at     TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_at        TIMESTAMP WITH TIME ZONE;
