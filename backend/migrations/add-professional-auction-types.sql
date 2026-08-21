-- Migration: Add Professional Auction Types Support
-- Date: 2026-05-08
-- Description: Add fields to support REVERSE, FORWARD, DUTCH, and SEALED auction types
-- Idempotent on DBs that already have auctions without professional-type constraints.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'auctions'
  ) THEN
    RAISE NOTICE 'auctions table missing — skipping professional auction types migration';
    RETURN;
  END IF;
END $$;

ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "targetPrice" DECIMAL(15,2);
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "maxBudget" DECIMAL(15,2);
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "startingPrice" DECIMAL(15,2);
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "marketRate" DECIMAL(15,2);

-- Existing REVERSE rows often have only one of target/reserve. Fill the other
-- from whichever is present so new inserts can still be constrained.
UPDATE auctions
SET
  "targetPrice" = COALESCE("targetPrice", "reservePrice"),
  "reservePrice" = COALESCE("reservePrice", "targetPrice")
WHERE "auctionType"::text = 'REVERSE'
  AND ("targetPrice" IS NULL OR "reservePrice" IS NULL);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_reverse_pricing' AND table_name = 'auctions'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM auctions
    WHERE "auctionType"::text = 'REVERSE'
      AND ("targetPrice" IS NULL OR "reservePrice" IS NULL)
  ) THEN
    ALTER TABLE auctions
      ADD CONSTRAINT check_reverse_pricing
      CHECK (
        "auctionType" != 'REVERSE' OR
        ("targetPrice" IS NOT NULL AND "reservePrice" IS NOT NULL)
      ) NOT VALID;
  ELSE
    ALTER TABLE auctions
      ADD CONSTRAINT check_reverse_pricing
      CHECK (
        "auctionType" != 'REVERSE' OR
        ("targetPrice" IS NOT NULL AND "reservePrice" IS NOT NULL)
      );
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'check_reverse_pricing skipped: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_auctions_type_status
  ON auctions("auctionType", status);

CREATE INDEX IF NOT EXISTS idx_auctions_active
  ON auctions(status, "auctionStart", "auctionEnd")
  WHERE status = 'ACTIVE';

DO $$ BEGIN
  COMMENT ON COLUMN auctions."targetPrice" IS 'REVERSE: What shipper wants to pay (visible to carriers)';
  COMMENT ON COLUMN auctions."maxBudget" IS 'REVERSE: Maximum shipper can pay (hidden from carriers)';
  COMMENT ON COLUMN auctions."startingPrice" IS 'FORWARD/DUTCH: Starting price for bidding';
  COMMENT ON COLUMN auctions."marketRate" IS 'Reference market rate for all types';
EXCEPTION WHEN undefined_column THEN
  RAISE NOTICE 'auction professional-type comments skipped — column missing';
END $$;
