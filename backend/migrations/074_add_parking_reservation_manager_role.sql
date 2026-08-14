-- Ensure parking officer role exists on whatever user-role enum this database uses.
-- Production DBs historically used users_role_enum; some environments report user_role.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
    ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_MANAGER';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_MANAGER';
  END IF;
END $$;
