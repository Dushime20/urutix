-- Migration: 041_epod_international_standard_fields
-- Created: 2026-07-09
-- Description: Add international-standard ePOD fields (CMR / BoL compliance)
--   - recipientIdNumber   : National ID / passport of the receiving party
--   - recipientCompany    : Organisation the recipient represents
--   - deliveredAt         : Actual delivery date-time as declared by driver
--   - cargoCondition      : INTACT | PARTIAL_DAMAGE | SHORT_DELIVERY | FULL_DAMAGE
--   - unitsDelivered      : Actual pieces delivered (short-delivery reconciliation)
--   - exceptionNotes      : Required damage/exception description when condition ≠ INTACT
--   - disputedAt          : Timestamp when cargo owner raised a dispute
--   - disputeReason       : Free-text dispute reason
--
-- All ALTER statements use IF NOT EXISTS / DO $$ blocks — safe to run multiple times.

-- ── 1. Create cargo condition enum ────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE cargo_condition_on_delivery_enum AS ENUM (
    'INTACT',
    'PARTIAL_DAMAGE',
    'SHORT_DELIVERY',
    'FULL_DAMAGE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Create epod_status enum (guard for fresh installs) ─────────────────────
DO $$ BEGIN
  CREATE TYPE epod_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. Create epods table (full schema — safe on fresh databases) ──────────────
CREATE TABLE IF NOT EXISTS epods (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"            UUID NOT NULL,
  "tripId"              UUID NOT NULL UNIQUE,
  "driverId"            UUID NOT NULL,
  "cargoOwnerId"        UUID NOT NULL,

  -- Recipient identity
  "recipientName"       VARCHAR(200) NOT NULL,
  "recipientPhone"      VARCHAR(50),
  "recipientIdNumber"   VARCHAR(100),
  "recipientCompany"    VARCHAR(200),

  -- Signature & photo evidence
  "signatureFileUrl"    VARCHAR(500),
  "photoUrls"           JSONB NOT NULL DEFAULT '[]',

  -- Delivery details
  "deliveredAt"         TIMESTAMP WITH TIME ZONE,
  "deliveryNotes"       TEXT,
  "odometerReading"     VARCHAR(100),
  "deliveryAddress"     TEXT,
  "deliveryCoordinates" JSONB,

  -- Cargo condition (CMR / BoL standard)
  "cargoCondition"      cargo_condition_on_delivery_enum NOT NULL DEFAULT 'INTACT',
  "unitsDelivered"      VARCHAR(100),
  "exceptionNotes"      TEXT,

  -- Status lifecycle
  status                epod_status_enum NOT NULL DEFAULT 'PENDING',
  "submittedAt"         TIMESTAMP WITH TIME ZONE NOT NULL,
  "confirmedAt"         TIMESTAMP WITH TIME ZONE,
  "disputedAt"          TIMESTAMP WITH TIME ZONE,
  "disputeReason"       TEXT,
  "invoiceId"           UUID,

  "createdAt"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── 4. Safe ALTER TABLE for databases that already have the old epods table ────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'epods'
  ) THEN
    ALTER TABLE epods ADD COLUMN IF NOT EXISTS "recipientIdNumber"  VARCHAR(100);
    ALTER TABLE epods ADD COLUMN IF NOT EXISTS "recipientCompany"   VARCHAR(200);
    ALTER TABLE epods ADD COLUMN IF NOT EXISTS "deliveredAt"        TIMESTAMP WITH TIME ZONE;
    ALTER TABLE epods ADD COLUMN IF NOT EXISTS "unitsDelivered"     VARCHAR(100);
    ALTER TABLE epods ADD COLUMN IF NOT EXISTS "exceptionNotes"     TEXT;
    ALTER TABLE epods ADD COLUMN IF NOT EXISTS "disputedAt"         TIMESTAMP WITH TIME ZONE;
    ALTER TABLE epods ADD COLUMN IF NOT EXISTS "disputeReason"      TEXT;
  END IF;
END $$;

-- cargoCondition needs the enum type to exist first (already created above)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'epods'
  ) THEN
    ALTER TABLE epods
      ADD COLUMN "cargoCondition" cargo_condition_on_delivery_enum NOT NULL DEFAULT 'INTACT';
  END IF;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ── 5. Indexes ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'epods'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_epods_tenant_status  ON epods ("tenantId", status);
    CREATE INDEX IF NOT EXISTS idx_epods_cargo_owner    ON epods ("cargoOwnerId");
    CREATE INDEX IF NOT EXISTS idx_epods_driver         ON epods ("driverId");
    CREATE INDEX IF NOT EXISTS idx_epods_submitted_at   ON epods ("submittedAt");
    CREATE INDEX IF NOT EXISTS idx_epods_cargo_cond     ON epods ("cargoCondition");
  END IF;
END $$;

-- ── 6. trips table: ensure completedAt column exists ──────────────────────────
ALTER TABLE trips ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE;
