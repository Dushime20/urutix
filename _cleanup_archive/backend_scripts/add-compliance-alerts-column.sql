-- Add complianceAlerts column to trucks table
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS "complianceAlerts" jsonb DEFAULT '[]'::jsonb;

