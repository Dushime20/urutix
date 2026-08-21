-- Remove seeded / auto-created default parking locations.
-- Drivers must only see locations that a parking reservation manager created with a real city and country.

DO $$
BEGIN
  IF to_regclass('public.parking_facility_config') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE parking_facility_config
    ALTER COLUMN "isDefault" SET DEFAULT FALSE;

  ALTER TABLE parking_facility_config
    ALTER COLUMN "facilityName" SET DEFAULT '';

  UPDATE parking_facility_config
  SET "isDefault" = FALSE, "updatedAt" = NOW()
  WHERE "isDefault" = TRUE;

  UPDATE parking_facility_config
  SET "isActive" = FALSE, "updatedAt" = NOW()
  WHERE (
      id = '00000000-0000-0000-0000-000000000365'
      OR (
        "tenantId" IS NULL
        AND COALESCE(BTRIM(city), '') = ''
        AND COALESCE(BTRIM(country), '') = ''
        AND BTRIM("facilityName") IN ('Nova Parking 365', '')
      )
    );

  IF to_regclass('public.parking_fee_schedules') IS NOT NULL THEN
    DELETE FROM parking_fee_schedules s
    WHERE EXISTS (
      SELECT 1
      FROM parking_facility_config f
      WHERE f.id = s."parkingFacilityId"
        AND f."isActive" = FALSE
        AND COALESCE(BTRIM(f.city), '') = ''
        AND COALESCE(BTRIM(f.country), '') = ''
        AND (
          to_regclass('public.parking_reservations') IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM parking_reservations r WHERE r."parkingFacilityId" = f.id
          )
        )
    );
  END IF;

  DELETE FROM parking_facility_config f
  WHERE f."isActive" = FALSE
    AND COALESCE(BTRIM(f.city), '') = ''
    AND COALESCE(BTRIM(f.country), '') = ''
    AND (
      to_regclass('public.parking_reservations') IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM parking_reservations r WHERE r."parkingFacilityId" = f.id
      )
    );
END $$;
