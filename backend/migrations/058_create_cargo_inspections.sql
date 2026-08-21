-- Migration: 058_create_cargo_inspections
-- Description: Create cargo_inspections table for receiver delivery inspections
--              and driver pre-trip inspections. Safe to run multiple times.
--              Older DBs already have the delivery-only table (no driverId);
--              ALTER TABLE ADD COLUMN runs before CREATE INDEX.

-- ── 1. Status enum ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "public"."cargo_inspections_status_enum" AS ENUM(
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'DISPUTED',
    'FAILED',
    'AWAITING_RESOLUTION',
    'READY_FOR_RE_INSPECTION',
    'APPROVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "public"."cargo_inspections_status_enum" ADD VALUE IF NOT EXISTS 'FAILED';
  ALTER TYPE "public"."cargo_inspections_status_enum" ADD VALUE IF NOT EXISTS 'AWAITING_RESOLUTION';
  ALTER TYPE "public"."cargo_inspections_status_enum" ADD VALUE IF NOT EXISTS 'READY_FOR_RE_INSPECTION';
  ALTER TYPE "public"."cargo_inspections_status_enum" ADD VALUE IF NOT EXISTS 'APPROVED';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- ── 2. Inspection type enum ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "public"."cargo_inspections_inspectiontype_enum" AS ENUM(
    'PRE_TRIP',
    'DELIVERY'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. Decision enum ──────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "public"."cargo_inspections_decision_enum" AS ENUM(
    'PASSED',
    'FAILED',
    'CONDITIONAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. Table ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cargo_inspections" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "loadId" uuid NOT NULL,
  "inspectionType" "public"."cargo_inspections_inspectiontype_enum" NOT NULL DEFAULT 'DELIVERY',
  "receiverId" uuid,
  "driverId" uuid,
  "decision" "public"."cargo_inspections_decision_enum",
  "attemptNumber" integer NOT NULL DEFAULT 1,
  "status" "public"."cargo_inspections_status_enum" NOT NULL DEFAULT 'PENDING',
  "checklist" jsonb NOT NULL DEFAULT '[]',
  "overallNotes" text,
  "allItemsVerified" boolean NOT NULL DEFAULT false,
  "verifiedCount" integer NOT NULL DEFAULT 0,
  "totalItems" integer NOT NULL DEFAULT 0,
  "discrepancyCount" integer NOT NULL DEFAULT 0,
  "discrepancies" jsonb,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "documents" jsonb DEFAULT '[]',
  "issues" jsonb DEFAULT '[]',
  "verificationData" jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_cargo_inspections_id" PRIMARY KEY ("id")
);

-- Existing delivery-only tables: add pre-trip columns before indexes/FKs.
ALTER TABLE "cargo_inspections" ADD COLUMN IF NOT EXISTS "inspectionType" "public"."cargo_inspections_inspectiontype_enum" NOT NULL DEFAULT 'DELIVERY';
ALTER TABLE "cargo_inspections" ADD COLUMN IF NOT EXISTS "driverId" uuid;
ALTER TABLE "cargo_inspections" ADD COLUMN IF NOT EXISTS "decision" "public"."cargo_inspections_decision_enum";
ALTER TABLE "cargo_inspections" ADD COLUMN IF NOT EXISTS "attemptNumber" integer NOT NULL DEFAULT 1;
ALTER TABLE "cargo_inspections" ADD COLUMN IF NOT EXISTS "documents" jsonb DEFAULT '[]';
ALTER TABLE "cargo_inspections" ADD COLUMN IF NOT EXISTS "issues" jsonb DEFAULT '[]';
ALTER TABLE "cargo_inspections" ADD COLUMN IF NOT EXISTS "verificationData" jsonb;

DO $$ BEGIN
  ALTER TABLE "cargo_inspections" ALTER COLUMN "receiverId" DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
END $$;

-- ── 5. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "IDX_cargo_inspections_loadId_receiverId"
  ON "cargo_inspections" ("loadId", "receiverId");

CREATE INDEX IF NOT EXISTS "IDX_cargo_inspections_loadId_driverId"
  ON "cargo_inspections" ("loadId", "driverId");

CREATE INDEX IF NOT EXISTS "IDX_cargo_inspections_loadId_inspectionType"
  ON "cargo_inspections" ("loadId", "inspectionType");

CREATE INDEX IF NOT EXISTS "IDX_cargo_inspections_status_createdAt"
  ON "cargo_inspections" ("status", "createdAt");

-- ── 6. Foreign keys ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_cargo_inspections_loadId'
      AND table_name = 'cargo_inspections'
  ) THEN
    ALTER TABLE "cargo_inspections"
      ADD CONSTRAINT "FK_cargo_inspections_loadId"
      FOREIGN KEY ("loadId") REFERENCES "loads"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_cargo_inspections_receiverId'
      AND table_name = 'cargo_inspections'
  ) THEN
    ALTER TABLE "cargo_inspections"
      ADD CONSTRAINT "FK_cargo_inspections_receiverId"
      FOREIGN KEY ("receiverId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'FK_cargo_inspections_driverId'
      AND table_name = 'cargo_inspections'
  ) THEN
    ALTER TABLE "cargo_inspections"
      ADD CONSTRAINT "FK_cargo_inspections_driverId"
      FOREIGN KEY ("driverId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;
