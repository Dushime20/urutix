-- Add insuranceAlerts column to trucks table
-- This column stores insurance records as JSONB

ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS "insuranceAlerts" jsonb DEFAULT '[]'::jsonb;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'trucks' AND column_name = 'insuranceAlerts';

