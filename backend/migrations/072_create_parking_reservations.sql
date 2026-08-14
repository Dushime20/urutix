-- Nova Parking 365 reservation module: facility capacity, reservations, activity, role, and notification enums.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
    ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_MANAGER';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_MANAGER';
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE parking_reservation_status_enum AS ENUM (
    'PENDING_REVIEW',
    'UNDER_REVIEW',
    'ADDITIONAL_INFORMATION_REQUIRED',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED',
    'COMPLETED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE parking_reservation_activity_action_enum AS ENUM (
    'RESERVATION_CREATED',
    'RESERVATION_ASSIGNED',
    'RESERVATION_REASSIGNED',
    'REVIEW_STARTED',
    'INFORMATION_REQUESTED',
    'INFORMATION_RECEIVED',
    'RESERVATION_APPROVED',
    'RESERVATION_REJECTED',
    'RESERVATION_CANCELLED',
    'NOTE_ADDED',
    'STATUS_CHANGED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_notificationtype_enum') THEN
    ALTER TYPE "public"."notifications_notificationtype_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_SUBMITTED';
    ALTER TYPE "public"."notifications_notificationtype_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_ASSIGNED';
    ALTER TYPE "public"."notifications_notificationtype_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_INFO_REQUIRED';
    ALTER TYPE "public"."notifications_notificationtype_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_APPROVED';
    ALTER TYPE "public"."notifications_notificationtype_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_REJECTED';
    ALTER TYPE "public"."notifications_notificationtype_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION_CANCELLED';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_category_enum') THEN
    ALTER TYPE "public"."notifications_category_enum" ADD VALUE IF NOT EXISTS 'PARKING';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_notificationcategory_enum') THEN
    ALTER TYPE "public"."notifications_notificationcategory_enum" ADD VALUE IF NOT EXISTS 'PARKING';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_entitytype_enum') THEN
    ALTER TYPE "public"."notifications_entitytype_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_entity_type_enum') THEN
    ALTER TYPE "public"."notifications_entity_type_enum" ADD VALUE IF NOT EXISTS 'PARKING_RESERVATION';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS parking_facility_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NULL,
  "facilityName" VARCHAR(160) NOT NULL DEFAULT 'Nova Parking 365',
  "totalCapacity" INTEGER NOT NULL DEFAULT 700,
  "allowPastStartDates" BOOLEAN NOT NULL DEFAULT FALSE,
  "isDefault" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_parking_facility_capacity CHECK ("totalCapacity" > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_parking_facility_default
  ON parking_facility_config ("isDefault")
  WHERE "isDefault" = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_parking_facility_tenant
  ON parking_facility_config ("tenantId")
  WHERE "tenantId" IS NOT NULL;

INSERT INTO parking_facility_config (id, "facilityName", "totalCapacity", "allowPastStartDates", "isDefault")
SELECT '00000000-0000-0000-0000-000000000365', 'Nova Parking 365', 700, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM parking_facility_config WHERE "isDefault" = TRUE);

CREATE TABLE IF NOT EXISTS parking_reservation_sequences (
  year INTEGER PRIMARY KEY,
  "lastNumber" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS parking_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reservationReference" VARCHAR(30) NOT NULL,
  "tenantId" UUID NOT NULL,
  "companyName" VARCHAR(200) NOT NULL,
  "mcNumber" VARCHAR(40) NOT NULL,
  "usdotNumber" VARCHAR(40) NOT NULL,
  "companyPhone" VARCHAR(40) NOT NULL,
  email VARCHAR(180) NOT NULL,
  "driverFirstName" VARCHAR(80) NOT NULL,
  "driverLastName" VARCHAR(80) NOT NULL,
  "truckSpacesRequested" INTEGER NOT NULL,
  "contractMonths" INTEGER NOT NULL,
  "requestedStartDate" DATE NOT NULL,
  "contractEndDate" DATE NOT NULL,
  status parking_reservation_status_enum NOT NULL DEFAULT 'PENDING_REVIEW',
  "customerNotes" TEXT NULL,
  "internalNotes" TEXT NULL,
  "agreementAccepted" BOOLEAN NOT NULL DEFAULT TRUE,
  signature TEXT NOT NULL,
  "signedAt" TIMESTAMPTZ NULL,
  "submittedByUserId" UUID NULL,
  "assignedToUserId" UUID NULL,
  "assignedAt" TIMESTAMPTZ NULL,
  "assignedByUserId" UUID NULL,
  "reviewedByUserId" UUID NULL,
  "reviewedAt" TIMESTAMPTZ NULL,
  "approvedByUserId" UUID NULL,
  "approvedAt" TIMESTAMPTZ NULL,
  "rejectedByUserId" UUID NULL,
  "rejectedAt" TIMESTAMPTZ NULL,
  "rejectionReason" TEXT NULL,
  "cancellationReason" TEXT NULL,
  "cancelledByUserId" UUID NULL,
  "cancelledAt" TIMESTAMPTZ NULL,
  "informationRequested" TEXT NULL,
  "informationResponse" TEXT NULL,
  "informationRespondedAt" TIMESTAMPTZ NULL,
  "possibleDuplicate" BOOLEAN NOT NULL DEFAULT FALSE,
  "duplicateOfReferences" JSONB NULL,
  "idempotencyKey" VARCHAR(80) NULL,
  "submitterIpHash" VARCHAR(64) NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_parking_spaces CHECK ("truckSpacesRequested" > 0),
  CONSTRAINT chk_parking_months CHECK ("contractMonths" > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_parking_reservations_reference
  ON parking_reservations ("reservationReference");

CREATE UNIQUE INDEX IF NOT EXISTS uq_parking_reservations_idempotency
  ON parking_reservations ("idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_parking_reservations_tenant_status
  ON parking_reservations ("tenantId", status, "createdAt");

CREATE INDEX IF NOT EXISTS idx_parking_reservations_email_status
  ON parking_reservations (email, status);

CREATE INDEX IF NOT EXISTS idx_parking_reservations_assigned
  ON parking_reservations ("assignedToUserId", status);

CREATE INDEX IF NOT EXISTS idx_parking_reservations_start
  ON parking_reservations ("requestedStartDate", status);

CREATE INDEX IF NOT EXISTS idx_parking_reservations_submitter
  ON parking_reservations ("submittedByUserId");

CREATE TABLE IF NOT EXISTS parking_reservation_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reservationId" UUID NOT NULL REFERENCES parking_reservations(id) ON DELETE CASCADE,
  action parking_reservation_activity_action_enum NOT NULL,
  "actorUserId" UUID NULL,
  "actorRole" VARCHAR(80) NULL,
  "actorLabel" VARCHAR(180) NULL,
  "previousStatus" parking_reservation_status_enum NULL,
  "newStatus" parking_reservation_status_enum NULL,
  metadata JSONB NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_reservation_activities_reservation
  ON parking_reservation_activities ("reservationId", "createdAt");

INSERT INTO roles ("name", "description", "is_system")
SELECT 'PARKING_RESERVATION_MANAGER', 'Parking reservation officer access', TRUE
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'PARKING_RESERVATION_MANAGER');
