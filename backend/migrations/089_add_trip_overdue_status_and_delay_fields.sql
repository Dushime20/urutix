-- Migration 089: Add OVERDUE trip status and delay-report columns
-- Date: 2026-09-07
--
-- @no-transaction  -- ALTER TYPE ADD VALUE cannot run inside a transaction
--
-- Root cause:
--   GET /api/availability/trucks → 500 Internal Server Error
--   QueryFailedError: column Trip.delayReason does not exist
--
-- Why:
--   Trip entity gained delayReason / delayDescription / delayReportedAt /
--   delayReportedBy and TripStatus.OVERDUE. A TypeORM migration exists at
--   src/migrations/1815000000000-AddTripOverdueStatusAndDelayFields.ts, but
--   production docker-entrypoint runs migrate.js which only applies
--   backend/migrations/*.sql. AvailabilityService.getBusyTruckIds() loads
--   Trip via findOne(), which TypeORM expands to every mapped column.

-- 1. Enum value — TypeORM default name AND 000_base_schema name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trips_status_enum') THEN
    ALTER TYPE "public"."trips_status_enum" ADD VALUE IF NOT EXISTS 'OVERDUE';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
    ALTER TYPE "public"."trip_status" ADD VALUE IF NOT EXISTS 'OVERDUE';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Delay-report columns used by driver delay reporting and overdue flow
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trips'
  ) THEN
    ALTER TABLE "trips"
      ADD COLUMN IF NOT EXISTS "delayReason" character varying(80),
      ADD COLUMN IF NOT EXISTS "delayDescription" text,
      ADD COLUMN IF NOT EXISTS "delayReportedAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "delayReportedBy" uuid;
  END IF;
END $$;

-- 3. Overdue scheduler scan index (IN_PROGRESS rows past plannedEndTime)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'trips'
  ) THEN
    CREATE INDEX IF NOT EXISTS "IDX_trips_overdue_scan"
      ON "trips" ("status", "plannedEndTime")
      WHERE "deleted_at" IS NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'trips'
      AND column_name = 'delayReason'
  ) THEN
    COMMENT ON COLUMN trips."delayReason" IS
      'Structured delay reason submitted by the driver (does not complete the trip)';
  END IF;
END $$;
