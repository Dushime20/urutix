-- Migration 040: Prevent duplicate active payments per trip per payer
-- 
-- Business rules enforced at DB level:
--   1. Only ONE active (pending/processing/completed) TRIP_PAYMENT per (tripId, payerId)
--   2. Only ONE active ADVANCE per (tripId, payerId)
--   3. Only ONE active FINAL per (tripId, payerId)
--
-- This is the last line of defence against race conditions.
-- Application layer checks are in:
--   - TripCompletionService.handleTripCompletion()
--   - PaymentsService.createPayment()

-- Unique partial indexes. On databases that already have duplicate active
-- rows, skip the index instead of aborting the whole migration chain.
-- Migration 066 rebuilds the ADVANCE index with a lender-payment exclusion.
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_trip_payer_trip_payment_active
    ON payments ("tripId", "payerId")
    WHERE "paymentType" = 'trip_payment'
      AND status IN ('pending', 'processing', 'completed');
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Skipping uq_payment_trip_payer_trip_payment_active — duplicate rows exist';
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_trip_payer_advance_active
    ON payments ("tripId", "payerId")
    WHERE "paymentType" = 'advance'
      AND status IN ('pending', 'processing', 'completed');
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Skipping uq_payment_trip_payer_advance_active — duplicate rows exist';
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_trip_payer_final_active
    ON payments ("tripId", "payerId")
    WHERE "paymentType" = 'final'
      AND status IN ('pending', 'processing', 'completed', 'escrow');
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'Skipping uq_payment_trip_payer_final_active — duplicate rows exist';
END $$;
