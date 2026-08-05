-- Migration 066: Exclude lender disbursement payments from ADVANCE uniqueness
--
-- Root cause (production):
--   PaymentsService.createPayment historically hardcoded paymentType = 'advance'
--   even for lender disbursements (which pass paymentType = trip_payment).
--   Retries then hit uq_payment_trip_payer_advance_active.
--
-- Application fix: honour paymentType + idempotent lender payment reuse.
-- This migration is defence-in-depth + data repair.

-- 1a) Cancel lender ADVANCE rows that would collide with an existing trip_payment
UPDATE payments p
SET
  status = 'cancelled',
  "failureReason" = 'Superseded: mis-typed lender advance conflicted with trip_payment',
  metadata = COALESCE(p.metadata, '{}'::jsonb) || jsonb_build_object(
    'cancelledReason', 'Mis-typed lender ADVANCE cancelled during migration 066',
    'cancelledAt', NOW()::text
  )
WHERE p."paymentType" = 'advance'
  AND (p.metadata->>'isLenderPayment') = 'true'
  AND p."deleted_at" IS NULL
  AND p.status IN ('pending', 'processing', 'completed')
  AND EXISTS (
    SELECT 1 FROM payments x
    WHERE x."tripId" = p."tripId"
      AND x."payerId" = p."payerId"
      AND x."paymentType" = 'trip_payment'
      AND x.status IN ('pending', 'processing', 'completed')
      AND x."deleted_at" IS NULL
      AND x.id <> p.id
  );

-- 1b) Reclassify remaining mis-typed lender ADVANCE rows
UPDATE payments
SET "paymentType" = 'trip_payment'
WHERE "paymentType" = 'advance'
  AND (metadata->>'isLenderPayment') = 'true'
  AND "deleted_at" IS NULL;

-- 2) Rebuild unique index excluding lender disbursements
DROP INDEX IF EXISTS uq_payment_trip_payer_advance_active;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_trip_payer_advance_active
  ON payments ("tripId", "payerId")
  WHERE "paymentType" = 'advance'
    AND status IN ('pending', 'processing', 'completed')
    AND COALESCE(metadata->>'isLenderPayment', 'false') <> 'true';
