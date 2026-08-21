ALTER TABLE parking_fee_schedules
  ADD COLUMN IF NOT EXISTS "longTermMonths" INTEGER NULL;
