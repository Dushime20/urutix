-- Capacity marketplace: leftover truck space as inventory
CREATE TABLE IF NOT EXISTS "capacity_offers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" uuid NOT NULL,
  "ownerId" uuid NOT NULL,
  "truckId" uuid NOT NULL,
  "tripId" uuid,
  "origin" jsonb NOT NULL,
  "destination" jsonb NOT NULL,
  "departureAt" TIMESTAMPTZ NOT NULL,
  "arrivalAt" TIMESTAMPTZ NOT NULL,
  "nameplateWeightKg" numeric(12,2) NOT NULL,
  "nameplateVolumeM3" numeric(12,2) NOT NULL,
  "listedWeightKg" numeric(12,2) NOT NULL,
  "listedVolumeM3" numeric(12,2) NOT NULL,
  "remainingWeightKg" numeric(12,2) NOT NULL,
  "remainingVolumeM3" numeric(12,2) NOT NULL,
  "allocatedWeightKg" numeric(12,2) NOT NULL DEFAULT 0,
  "allocatedVolumeM3" numeric(12,2) NOT NULL DEFAULT 0,
  "floorPrice" numeric(15,2) NOT NULL DEFAULT 0,
  "pricePerTonne" numeric(15,2),
  "pricePerM3" numeric(15,2),
  "currencyCode" character varying(3) NOT NULL DEFAULT 'USD',
  "commissionRate" numeric(5,2) NOT NULL DEFAULT 8.00,
  "compatibleCargoTypes" jsonb NOT NULL DEFAULT '["GENERAL"]',
  "generalCargoOnly" boolean NOT NULL DEFAULT true,
  "allowMixing" boolean NOT NULL DEFAULT true,
  "bookingMode" character varying(16) NOT NULL DEFAULT 'INSTANT',
  "status" character varying(24) NOT NULL DEFAULT 'OPEN',
  "notes" text,
  "loadIds" jsonb NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "PK_capacity_offers" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_capacity_offers_owner"
  ON "capacity_offers" ("tenantId", "ownerId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_capacity_offers_status"
  ON "capacity_offers" ("tenantId", "status", "departureAt");
CREATE INDEX IF NOT EXISTS "IDX_capacity_offers_truck"
  ON "capacity_offers" ("truckId", "status");

CREATE TABLE IF NOT EXISTS "capacity_bookings" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" uuid NOT NULL,
  "offerId" uuid NOT NULL,
  "cargoOwnerId" uuid NOT NULL,
  "loadId" uuid,
  "tripId" uuid,
  "weightKg" numeric(12,2) NOT NULL,
  "volumeM3" numeric(12,2) NOT NULL DEFAULT 0,
  "cargoType" character varying(32) NOT NULL DEFAULT 'GENERAL',
  "title" character varying(200),
  "freightAmount" numeric(15,2) NOT NULL,
  "commissionRate" numeric(5,2) NOT NULL,
  "commissionAmount" numeric(15,2) NOT NULL,
  "currencyCode" character varying(3) NOT NULL DEFAULT 'USD',
  "commissionStatus" character varying(16) NOT NULL DEFAULT 'PENDING',
  "freightPaymentId" uuid,
  "commissionPaymentId" uuid,
  "status" character varying(24) NOT NULL DEFAULT 'REQUESTED',
  "rejectionReason" text,
  "origin" jsonb,
  "destination" jsonb,
  "pickupDate" TIMESTAMPTZ,
  "deliveryDate" TIMESTAMPTZ,
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "PK_capacity_bookings" PRIMARY KEY ("id"),
  CONSTRAINT "FK_capacity_bookings_offer" FOREIGN KEY ("offerId") REFERENCES "capacity_offers"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IDX_capacity_bookings_owner"
  ON "capacity_bookings" ("tenantId", "cargoOwnerId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_capacity_bookings_offer"
  ON "capacity_bookings" ("offerId", "status");
CREATE INDEX IF NOT EXISTS "IDX_capacity_bookings_status"
  ON "capacity_bookings" ("tenantId", "status");
