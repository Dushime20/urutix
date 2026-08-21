-- Each parking reservation manager can own their own location.
-- Do not force one facility per tenant; that made new managers inherit another manager's queue.

-- Each parking reservation manager owns only the locations they created.
-- City is not unique and is not an access key: many managers can operate in Kigali,
-- and each one sees only requests for their own facility.

DROP INDEX IF EXISTS uq_parking_facility_tenant;

UPDATE parking_facility_config
SET
  "parkingManagerId" = NULL,
  "isActive" = FALSE,
  "isDefault" = FALSE,
  "updatedAt" = NOW()
WHERE id = '00000000-0000-0000-0000-000000000365';

DROP INDEX IF EXISTS uq_parking_facility_manager;
