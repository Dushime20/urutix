-- =============================================================================
-- Migration 052: Reconcile bids dual-schema (production-ready)
-- =============================================================================
-- ROOT CAUSE
-- ----------
-- `000_base_schema.sql` created a minimal bids stub:
--   bidderId NOT NULL, amount NOT NULL, notes, metadata
-- Later ALTERs added the TypeORM Bid entity columns:
--   truckOwnerId, bidAmount, bidNotes, bidDetails, tenantId, ...
-- but never removed or relaxed the stub NOT NULL columns.
--
-- TypeORM only INSERTs columns mapped on Bid entity, so Postgres rejects
-- inserts with: null value in column "bidderId" / "amount" / "tenantId".
-- Fixing one column at a time is whack-a-mole; this migration retires the
-- stub schema and makes the entity schema the single source of truth.
--
-- SAFE / IDEMPOTENT: backfill → enforce entity NOT NULLs → drop stub cols.
-- =============================================================================

-- ── 1. Ensure entity columns exist (idempotent) ──────────────────────────────
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "tenantId"                 UUID;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "truckOwnerId"             UUID;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "bidAmount"                DECIMAL(15,2);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "bidCurrency"              VARCHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "proposedPickupDate"       TIMESTAMPTZ;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "proposedDeliveryDate"     TIMESTAMPTZ;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "bidNotes"                 TEXT;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "bidDetails"               JSONB NOT NULL DEFAULT '{}';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "successProbability"       DECIMAL(5,2);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "riskAssessment"           JSONB NOT NULL DEFAULT '{}';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "marketContext"            JSONB NOT NULL DEFAULT '{}';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "isAutoBid"                BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "isCounterOffer"           BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "parentBidId"              UUID;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "advancePaymentPercentage" DECIMAL(5,2);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "requireAdvancePayment"    BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "expiresAt"                TIMESTAMPTZ;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "updatedAt"                TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE bids ADD COLUMN IF NOT EXISTS deleted_at                 TIMESTAMPTZ;

-- ── 2. Bidirectional backfill: stub ↔ entity ─────────────────────────────────
DO $$
BEGIN
  -- truckOwnerId ← bidderId (legacy stub)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bids' AND column_name = 'bidderId'
  ) THEN
    EXECUTE 'UPDATE bids SET "truckOwnerId" = "bidderId"
              WHERE "truckOwnerId" IS NULL AND "bidderId" IS NOT NULL';
    EXECUTE 'UPDATE bids SET "bidderId" = "truckOwnerId"
              WHERE "bidderId" IS NULL AND "truckOwnerId" IS NOT NULL';
  END IF;

  -- bidAmount ← amount (legacy stub)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bids' AND column_name = 'amount'
  ) THEN
    EXECUTE 'UPDATE bids SET "bidAmount" = amount
              WHERE "bidAmount" IS NULL AND amount IS NOT NULL';
    EXECUTE 'UPDATE bids SET amount = "bidAmount"
              WHERE amount IS NULL AND "bidAmount" IS NOT NULL';
  END IF;

  -- bidNotes ← notes
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bids' AND column_name = 'notes'
  ) THEN
    EXECUTE 'UPDATE bids SET "bidNotes" = notes
              WHERE "bidNotes" IS NULL AND notes IS NOT NULL';
  END IF;

  -- bidDetails ← metadata (only when bidDetails is empty object)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bids' AND column_name = 'metadata'
  ) THEN
    EXECUTE $q$
      UPDATE bids SET "bidDetails" = metadata
      WHERE ("bidDetails" IS NULL OR "bidDetails" = '{}'::jsonb)
        AND metadata IS NOT NULL
        AND metadata <> '{}'::jsonb
    $q$;
  END IF;
END $$;

-- tenantId from related load when missing
UPDATE bids b
SET "tenantId" = l."tenantId"
FROM loads l
WHERE b."loadId" = l.id
  AND b."tenantId" IS NULL
  AND l."tenantId" IS NOT NULL;

-- ── 3. Enforce entity columns as NOT NULL (source of truth) ───────────────────
-- Only tighten when every row is populated (avoids failing on empty/orphan rows).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bids WHERE "tenantId" IS NULL) THEN
    ALTER TABLE bids ALTER COLUMN "tenantId" SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM bids WHERE "truckOwnerId" IS NULL) THEN
    ALTER TABLE bids ALTER COLUMN "truckOwnerId" SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM bids WHERE "bidAmount" IS NULL) THEN
    ALTER TABLE bids ALTER COLUMN "bidAmount" SET NOT NULL;
  END IF;
END $$;

-- ── 4. Drop obsolete stub columns + indexes (end the dual schema) ────────────
DROP INDEX IF EXISTS idx_bids_bidder;

ALTER TABLE bids DROP COLUMN IF EXISTS "bidderId";
ALTER TABLE bids DROP COLUMN IF EXISTS amount;
ALTER TABLE bids DROP COLUMN IF EXISTS notes;
ALTER TABLE bids DROP COLUMN IF EXISTS metadata;

-- auctionId was stub-only; entity does not map it. Keep if present (nullable),
-- harmless for TypeORM inserts. Do not drop — may be useful for reporting.

-- ── 5. Supporting indexes matching Bid entity ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bids_truck_owner_status
  ON bids ("truckOwnerId", status);
CREATE INDEX IF NOT EXISTS idx_bids_tenant_status
  ON bids ("tenantId", status);
CREATE INDEX IF NOT EXISTS idx_bids_load_owner_status
  ON bids ("loadId", "truckOwnerId", status);

SELECT 'Migration 052: bids dual-schema reconciled (entity is source of truth)' AS message;
