-- Migration 088: Create shipment_reservations if missing
-- Date: 2026-09-07
--
-- Root cause:
--   GET /api/availability/trucks → 500 Internal Server Error
--   QueryFailedError: relation "shipment_reservations" does not exist
--
-- Why:
--   AvailabilityService.getBusyTruckIds() loads ACTIVE ShipmentReservation rows
--   before listing trucks. The entity and 000_base_schema.sql define the table,
--   but production uses migrate.js and never received a numbered SQL migration.
--   DBs that already ran 000_base_schema before this table was added never got it
--   (CREATE TABLE IF NOT EXISTS in 000 is a no-op once that file is marked applied).
--
-- Fully idempotent — safe if the table already exists from 000_base_schema.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('ACTIVE', 'RELEASED', 'REPLACED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TypeORM default enum name if enumName is omitted on the entity.
DO $$ BEGIN
  CREATE TYPE shipment_reservations_status_enum AS ENUM ('ACTIVE', 'RELEASED', 'REPLACED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS shipment_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "tripId" UUID NOT NULL,
  "cargoId" UUID NOT NULL,
  "truckId" UUID NOT NULL,
  "driverId" UUID,
  "pickupDateTime" TIMESTAMPTZ NOT NULL,
  "deliveryDateTime" TIMESTAMPTZ NOT NULL,
  status reservation_status NOT NULL DEFAULT 'ACTIVE',
  "statusReason" VARCHAR,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipment_reservations_truck
  ON shipment_reservations("truckId", status, "pickupDateTime", "deliveryDateTime");
CREATE INDEX IF NOT EXISTS idx_shipment_reservations_driver
  ON shipment_reservations("driverId", status, "pickupDateTime", "deliveryDateTime");
CREATE INDEX IF NOT EXISTS idx_shipment_reservations_tenant
  ON shipment_reservations("tenantId", status);

DO $$
BEGIN
  CREATE UNIQUE INDEX idx_shipment_reservations_active_trip
    ON shipment_reservations("tripId")
    WHERE status <> 'REPLACED';
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN unique_violation THEN NULL;
END $$;
