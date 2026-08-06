-- Migration 067: Backfill missing advancePaymentPercentage on bids
--
-- Legacy bids have requireAdvancePayment = true (default) but NULL percentage,
-- which caused advance-payment-calculation API errors in production logs.
-- Platform default: 70% (aligned with frontend paymentCalculations.ts).

UPDATE bids
SET "advancePaymentPercentage" = 70
WHERE "advancePaymentPercentage" IS NULL
  AND COALESCE("requireAdvancePayment", true) = true;

UPDATE bids
SET "advancePaymentPercentage" = 0
WHERE "advancePaymentPercentage" IS NULL
  AND "requireAdvancePayment" = false;
