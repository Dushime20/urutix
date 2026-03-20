-- Add tireAlerts column to trucks table
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS "tireAlerts" jsonb DEFAULT '[]'::jsonb;

