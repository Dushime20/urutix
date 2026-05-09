-- Migration: Add Professional Auction Types Support
-- Date: 2026-05-08
-- Description: Add fields to support REVERSE, FORWARD, DUTCH, and SEALED auction types

-- Add new columns to auctions table
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS target_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_budget DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS starting_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS market_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS drop_interval INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS drop_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS bid_visibility VARCHAR(20) DEFAULT 'PUBLIC',
ADD COLUMN IF NOT EXISTS allow_bid_revision BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS selection_criteria JSONB,
ADD COLUMN IF NOT EXISTS auto_extend BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS minimum_bid_increment DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS minimum_bid_decrement DECIMAL(10,2);

-- Update existing REVERSE auctions with proper pricing structure
-- Set target_price from reserve_price and adjust reserve_price from offeredPrice
UPDATE auctions a
SET 
  target_price = a.reserve_price,
  reserve_price = (
    SELECT LEAST(l.offered_price::DECIMAL, a.reserve_price::DECIMAL)
    FROM loads l 
    WHERE l.id = a.load_id
  )
WHERE a.auction_type = 'REVERSE' 
  AND a.target_price IS NULL
  AND EXISTS (SELECT 1 FROM loads l WHERE l.id = a.load_id);

-- Add check constraints for data integrity
ALTER TABLE auctions
DROP CONSTRAINT IF EXISTS check_reverse_pricing;

ALTER TABLE auctions
ADD CONSTRAINT check_reverse_pricing 
  CHECK (
    auction_type != 'REVERSE' OR 
    (target_price IS NOT NULL AND reserve_price IS NOT NULL AND target_price::DECIMAL > reserve_price::DECIMAL)
  );

ALTER TABLE auctions
DROP CONSTRAINT IF EXISTS check_forward_pricing;

ALTER TABLE auctions
ADD CONSTRAINT check_forward_pricing 
  CHECK (
    auction_type != 'FORWARD' OR 
    (starting_price IS NOT NULL AND reserve_price IS NOT NULL AND starting_price::DECIMAL < reserve_price::DECIMAL)
  );

ALTER TABLE auctions
DROP CONSTRAINT IF EXISTS check_dutch_pricing;

ALTER TABLE auctions
ADD CONSTRAINT check_dutch_pricing 
  CHECK (
    auction_type != 'DUTCH' OR 
    (starting_price IS NOT NULL AND reserve_price IS NOT NULL AND 
     starting_price::DECIMAL > reserve_price::DECIMAL AND
     drop_interval IS NOT NULL AND drop_amount IS NOT NULL)
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_auctions_type_status 
  ON auctions(auction_type, status);

CREATE INDEX IF NOT EXISTS idx_auctions_active 
  ON auctions(status, auction_start, auction_end) 
  WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_auctions_bid_visibility 
  ON auctions(bid_visibility) 
  WHERE bid_visibility = 'HIDDEN';

-- Add comments for documentation
COMMENT ON COLUMN auctions.target_price IS 'REVERSE: What shipper wants to pay (visible to carriers)';
COMMENT ON COLUMN auctions.max_budget IS 'REVERSE: Maximum shipper can pay (hidden from carriers)';
COMMENT ON COLUMN auctions.starting_price IS 'FORWARD/DUTCH: Starting price for bidding';
COMMENT ON COLUMN auctions.market_rate IS 'Reference market rate for all types';
COMMENT ON COLUMN auctions.drop_interval IS 'DUTCH: Seconds between price drops';
COMMENT ON COLUMN auctions.drop_amount IS 'DUTCH: Amount to drop each interval';
COMMENT ON COLUMN auctions.bid_visibility IS 'SEALED: PUBLIC, HIDDEN, or ANONYMOUS';
COMMENT ON COLUMN auctions.allow_bid_revision IS 'SEALED: Allow carriers to revise bids before deadline';
COMMENT ON COLUMN auctions.selection_criteria IS 'SEALED: Weighted criteria for winner selection';
COMMENT ON COLUMN auctions.auto_extend IS 'Auto-extend auction if bid placed near end';
COMMENT ON COLUMN auctions.minimum_bid_increment IS 'FORWARD: Minimum amount to increase bid';
COMMENT ON COLUMN auctions.minimum_bid_decrement IS 'REVERSE: Minimum amount to decrease bid';

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'Added % new columns to auctions table', (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_name = 'auctions' 
    AND column_name IN (
      'target_price', 'max_budget', 'starting_price', 'market_rate',
      'drop_interval', 'drop_amount', 'bid_visibility', 'allow_bid_revision',
      'selection_criteria', 'auto_extend', 'minimum_bid_increment', 'minimum_bid_decrement'
    )
  );
END $$;
