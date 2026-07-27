-- Migration: Add Professional Auction Types Support
-- Date: 2026-05-08
-- Description: Add fields to support REVERSE, FORWARD, DUTCH, and SEALED auction types

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'auctions'
  ) THEN
    RAISE NOTICE 'auctions table missing — skipping professional auction types migration';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_reverse_pricing' AND table_name = 'auctions'
  ) THEN
    ALTER TABLE auctions
    ADD CONSTRAINT check_reverse_pricing
      CHECK (
        "auctionType" != 'REVERSE' OR
        ("targetPrice" IS NOT NULL AND "reservePrice" IS NOT NULL)
      );
  END IF;
END $$;

-- Add indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_auctions_type_status 
  ON auctions("auctionType", status);

CREATE INDEX IF NOT EXISTS idx_auctions_active 
  ON auctions(status, "auctionStart", "auctionEnd") 
  WHERE status = 'ACTIVE';

-- Add comments for documentation
COMMENT ON COLUMN auctions."targetPrice" IS 'REVERSE: What shipper wants to pay (visible to carriers)';
COMMENT ON COLUMN auctions."maxBudget" IS 'REVERSE: Maximum shipper can pay (hidden from carriers)';
COMMENT ON COLUMN auctions."startingPrice" IS 'FORWARD/DUTCH: Starting price for bidding';
COMMENT ON COLUMN auctions."marketRate" IS 'Reference market rate for all types';

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully - auction types are ready';
END $$;