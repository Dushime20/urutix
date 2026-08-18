-- Parking reservation fees (ISO 4217 currency, snapshot invoicing) and payment lifecycle.

DO $$ BEGIN
  CREATE TYPE parking_reservation_payment_status_enum AS ENUM (
    'NOT_APPLICABLE',
    'DUE',
    'PENDING_VERIFICATION',
    'PAID',
    'OVERDUE',
    'WAIVED',
    'CANCELLED',
    'REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE parking_reservation_payment_method_enum AS ENUM (
    'CREDIT_TRANSFER',
    'CARD',
    'CASH',
    'MOBILE_MONEY',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE parking_reservation_activity_action_enum ADD VALUE IF NOT EXISTS 'PAYMENT_REQUESTED';
  ALTER TYPE parking_reservation_activity_action_enum ADD VALUE IF NOT EXISTS 'PAYMENT_SUBMITTED';
  ALTER TYPE parking_reservation_activity_action_enum ADD VALUE IF NOT EXISTS 'PAYMENT_RECEIVED';
  ALTER TYPE parking_reservation_activity_action_enum ADD VALUE IF NOT EXISTS 'PAYMENT_WAIVED';
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_notificationtype_enum') THEN
    ALTER TYPE "public"."notifications_notificationtype_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_PAYMENT_DUE';
    ALTER TYPE "public"."notifications_notificationtype_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_PAYMENT_RECEIVED';
  END IF;
END $$;

ALTER TABLE parking_facility_config
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS "monthlyRatePerSpace" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reservationFee" NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "taxPercent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "paymentDueDays" INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS "feeNotes" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "paymentInstructions" TEXT NULL;

DO $$ BEGIN
  ALTER TABLE parking_facility_config
    ADD CONSTRAINT chk_parking_fee_currency CHECK (currency ~ '^[A-Z]{3}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE parking_facility_config
    ADD CONSTRAINT chk_parking_fee_rates CHECK (
      "monthlyRatePerSpace" >= 0
      AND "reservationFee" >= 0
      AND "taxPercent" >= 0
      AND "taxPercent" <= 100
      AND "paymentDueDays" >= 1
      AND "paymentDueDays" <= 90
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE parking_reservations
  ADD COLUMN IF NOT EXISTS "paymentStatus" parking_reservation_payment_status_enum NOT NULL DEFAULT 'NOT_APPLICABLE',
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NULL,
  ADD COLUMN IF NOT EXISTS "occupancyAmount" NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS "reservationFeeAmount" NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS "subtotalAmount" NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS "taxPercent" NUMERIC(5,2) NULL,
  ADD COLUMN IF NOT EXISTS "taxAmount" NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS "totalAmountDue" NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS "invoiceNumber" VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS "paymentDueAt" TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS "paidAmount" NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS "paymentMethod" parking_reservation_payment_method_enum NULL,
  ADD COLUMN IF NOT EXISTS "paymentReference" VARCHAR(80) NULL,
  ADD COLUMN IF NOT EXISTS "paymentNotes" TEXT NULL,
  ADD COLUMN IF NOT EXISTS "feeSnapshot" JSONB NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_parking_reservations_invoice
  ON parking_reservations ("invoiceNumber")
  WHERE "invoiceNumber" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_parking_reservations_payment_status
  ON parking_reservations ("paymentStatus", "paymentDueAt");
