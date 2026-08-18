-- Remove fee schedules that were auto-inserted from facility config.
-- Operators should only see schedules they actually created.

UPDATE parking_reservations
SET "feeScheduleId" = NULL
WHERE "feeScheduleId" IN (
  SELECT id FROM parking_fee_schedules
  WHERE description = 'Backfilled from facility fee configuration'
);

DELETE FROM parking_fee_schedules
WHERE description = 'Backfilled from facility fee configuration';
