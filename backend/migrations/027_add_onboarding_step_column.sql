-- Migration: Add onboardingStep column to tenants table
-- This migration adds the onboardingStep column as integer type to match the entity definition

-- Add onboardingStep column as integer (matching entity definition)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER DEFAULT 1;

-- Update existing tenants to have default onboarding step
UPDATE tenants 
SET "onboardingStep" = 1
WHERE "onboardingStep" IS NULL;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_tenants_onboarding_step ON tenants("onboardingStep");

-- Add comment for documentation
COMMENT ON COLUMN tenants."onboardingStep" IS 'Current step in the onboarding process (1-5)';
