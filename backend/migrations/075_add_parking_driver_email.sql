-- Driver notification email for parking reservations (separate from company email).

ALTER TABLE parking_reservations
  ADD COLUMN IF NOT EXISTS "driverEmail" VARCHAR(180);

UPDATE parking_reservations
SET "driverEmail" = email
WHERE "driverEmail" IS NULL OR BTRIM("driverEmail") = '';

ALTER TABLE parking_reservations
  ALTER COLUMN "driverEmail" SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_parking_reservations_driver_email
  ON parking_reservations ("driverEmail");
