-- Add fuelAlerts column to trucks table
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS "fuelAlerts" jsonb DEFAULT '[]'::jsonb;

