-- Parking facilities: location fields, multi-facility tenants, and reservation destination.

ALTER TABLE parking_facility_config
  ADD COLUMN IF NOT EXISTS city VARCHAR(80),
  ADD COLUMN IF NOT EXISTS country VARCHAR(80),
  ADD COLUMN IF NOT EXISTS region VARCHAR(80),
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "parkingManagerId" UUID;

UPDATE parking_facility_config f
SET
  city = COALESCE(f.city, t.city),
  country = COALESCE(f.country, t.country),
  region = COALESCE(f.region, t.state)
FROM tenants t
WHERE f."tenantId" = t.id
  AND (f.city IS NULL OR f.country IS NULL OR f.region IS NULL);

DROP INDEX IF EXISTS uq_parking_facility_tenant;

CREATE INDEX IF NOT EXISTS idx_parking_facility_search
  ON parking_facility_config ("isActive", country, city, "tenantId");

ALTER TABLE parking_reservations
  ADD COLUMN IF NOT EXISTS "parkingFacilityId" UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_parking_reservations_facility'
  ) THEN
    ALTER TABLE parking_reservations
      ADD CONSTRAINT fk_parking_reservations_facility
      FOREIGN KEY ("parkingFacilityId")
      REFERENCES parking_facility_config(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

UPDATE parking_reservations r
SET "parkingFacilityId" = f.id
FROM parking_facility_config f
WHERE r."parkingFacilityId" IS NULL
  AND f."tenantId" = r."tenantId";

UPDATE parking_reservations r
SET "parkingFacilityId" = f.id
FROM parking_facility_config f
WHERE r."parkingFacilityId" IS NULL
  AND f."isDefault" = TRUE;

CREATE INDEX IF NOT EXISTS idx_parking_reservations_facility
  ON parking_reservations ("parkingFacilityId", status);
