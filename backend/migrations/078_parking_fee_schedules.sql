-- Versioned parking fee schedules, snapshots, and contract/payment rules.

DO $$ BEGIN
  CREATE TYPE parking_fee_schedule_status_enum AS ENUM (
    'DRAFT', 'SCHEDULED', 'ACTIVE', 'EXPIRED', 'ARCHIVED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE parking_reservation_fee_type_enum AS ENUM ('FIXED', 'PERCENTAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE parking_fee_application_enum AS ENUM (
    'PER_RESERVATION', 'PER_SPACE', 'PERCENT_OF_SUBTOTAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE parking_payment_frequency_enum AS ENUM (
    'ONE_TIME', 'MONTHLY', 'QUARTERLY', 'ANNUAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE parking_payment_due_type_enum AS ENUM (
    'IMMEDIATELY', 'BEFORE_RESERVATION', 'ON_INVOICE_DATE', 'DAYS_AFTER_INVOICE', 'DAYS_BEFORE_START'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE parking_late_fee_type_enum AS ENUM ('NONE', 'FIXED', 'PERCENTAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS parking_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "parkingFacilityId" UUID NOT NULL REFERENCES parking_facility_config(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  "spaceType" VARCHAR(80) NOT NULL DEFAULT 'TRUCK_SPACE',
  "vehicleType" VARCHAR(80) NOT NULL DEFAULT 'TRUCK',
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status parking_fee_schedule_status_enum NOT NULL DEFAULT 'DRAFT',
  version INTEGER NOT NULL DEFAULT 1,
  "monthlyRatePerSpace" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "dailyRate" NUMERIC(12,2) NULL,
  "weeklyRate" NUMERIC(12,2) NULL,
  "longTermRate" NUMERIC(12,2) NULL,
  "reservationFeeType" parking_reservation_fee_type_enum NOT NULL DEFAULT 'FIXED',
  "reservationFeeValue" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "reservationFeeApplication" parking_fee_application_enum NOT NULL DEFAULT 'PER_RESERVATION',
  "taxEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "taxName" VARCHAR(80) NOT NULL DEFAULT 'VAT',
  "taxPercent" NUMERIC(5,2) NOT NULL DEFAULT 0,
  "paymentFrequency" parking_payment_frequency_enum NOT NULL DEFAULT 'ONE_TIME',
  "paymentDueType" parking_payment_due_type_enum NOT NULL DEFAULT 'DAYS_AFTER_INVOICE',
  "paymentDueDays" INTEGER NOT NULL DEFAULT 7,
  "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
  "lateFeeType" parking_late_fee_type_enum NOT NULL DEFAULT 'NONE',
  "lateFeeValue" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "autoRenewal" BOOLEAN NOT NULL DEFAULT FALSE,
  "minContractMonths" INTEGER NOT NULL DEFAULT 1,
  "maxContractMonths" INTEGER NOT NULL DEFAULT 12,
  "minSpaces" INTEGER NOT NULL DEFAULT 1,
  "maxSpaces" INTEGER NOT NULL DEFAULT 100,
  "cancellationAllowed" BOOLEAN NOT NULL DEFAULT TRUE,
  "cancellationNoticeDays" INTEGER NOT NULL DEFAULT 0,
  "cancellationFeeType" parking_late_fee_type_enum NOT NULL DEFAULT 'NONE',
  "cancellationFeeValue" NUMERIC(12,2) NOT NULL DEFAULT 0,
  "refundEligible" BOOLEAN NOT NULL DEFAULT FALSE,
  "earlyTerminationAllowed" BOOLEAN NOT NULL DEFAULT TRUE,
  "effectiveFrom" DATE NOT NULL DEFAULT CURRENT_DATE,
  "effectiveUntil" DATE NULL,
  "feeNotes" TEXT NULL,
  "paymentInstructions" TEXT NULL,
  "changeLog" JSONB NULL,
  "createdByUserId" UUID NULL,
  "updatedByUserId" UUID NULL,
  "activatedByUserId" UUID NULL,
  "activatedAt" TIMESTAMPTZ NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_parking_fee_schedule_currency CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT chk_parking_fee_schedule_rates CHECK (
    "monthlyRatePerSpace" >= 0
    AND COALESCE("dailyRate", 0) >= 0
    AND COALESCE("weeklyRate", 0) >= 0
    AND COALESCE("longTermRate", 0) >= 0
    AND "reservationFeeValue" >= 0
    AND "taxPercent" >= 0 AND "taxPercent" <= 100
    AND "paymentDueDays" >= 0 AND "paymentDueDays" <= 90
    AND "gracePeriodDays" >= 0 AND "gracePeriodDays" <= 30
    AND "lateFeeValue" >= 0
    AND "minContractMonths" >= 1
    AND "maxContractMonths" >= "minContractMonths"
    AND "minSpaces" >= 1
    AND "maxSpaces" >= "minSpaces"
    AND "cancellationNoticeDays" >= 0
    AND "cancellationFeeValue" >= 0
  ),
  CONSTRAINT chk_parking_fee_schedule_dates CHECK (
    "effectiveUntil" IS NULL OR "effectiveUntil" >= "effectiveFrom"
  )
);

CREATE INDEX IF NOT EXISTS idx_parking_fee_schedules_lookup
  ON parking_fee_schedules ("parkingFacilityId", "spaceType", "vehicleType", status, "effectiveFrom");

CREATE INDEX IF NOT EXISTS idx_parking_fee_schedules_status_dates
  ON parking_fee_schedules (status, "effectiveFrom", "effectiveUntil");

ALTER TABLE parking_reservations
  ADD COLUMN IF NOT EXISTS "feeScheduleId" UUID NULL REFERENCES parking_fee_schedules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_parking_reservations_fee_schedule
  ON parking_reservations ("feeScheduleId");
