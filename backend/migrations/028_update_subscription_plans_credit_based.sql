-- Migration 028: Update Subscription Plans to Credit-Based System
-- Description: Converts subscription plans from monthly/yearly pricing to credit-based consumption model
-- Date: 2026-04-09

-- ============================================================================
-- 1. MAKE LEGACY COLUMNS NULLABLE
-- ============================================================================

-- Make old pricing columns nullable for backward compatibility
ALTER TABLE subscription_plans 
ALTER COLUMN price_monthly DROP NOT NULL;

ALTER TABLE subscription_plans 
ALTER COLUMN included_credits DROP NOT NULL;

-- ============================================================================
-- 2. ADD NEW CREDIT-BASED COLUMNS
-- ============================================================================

-- Add price per credit column (what tenant pays system admin per credit)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS price_per_credit DECIMAL(10,4) DEFAULT 0.15;

-- Add total credits available for purchase (-1 for unlimited)
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT -1;

-- Add credits consumed per ton for tenant admin
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS credits_per_ton_tenant DECIMAL(10,2) DEFAULT 2.0;

-- Add credits consumed per ton for truck owner
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS credits_per_ton_truck_owner DECIMAL(10,2) DEFAULT 5.0;

-- ============================================================================
-- 2. MIGRATE EXISTING DATA (if any)
-- ============================================================================

-- Update existing plans with default credit values
UPDATE subscription_plans 
SET 
  price_per_credit = 0.15,
  total_credits = -1,
  credits_per_ton_tenant = 2.0,
  credits_per_ton_truck_owner = 5.0
WHERE price_per_credit IS NULL;

-- ============================================================================
-- 3. DROP OLD PRICING COLUMNS (optional - commented out for safety)
-- ============================================================================

-- Uncomment these lines after verifying the migration works correctly
-- ALTER TABLE subscription_plans DROP COLUMN IF EXISTS price_monthly;
-- ALTER TABLE subscription_plans DROP COLUMN IF EXISTS price_yearly;
-- ALTER TABLE subscription_plans DROP COLUMN IF EXISTS included_credits;

-- ============================================================================
-- 4. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscription_plans_price_per_credit 
ON subscription_plans(price_per_credit);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_credits_per_ton 
ON subscription_plans(credits_per_ton_tenant, credits_per_ton_truck_owner);

-- ============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN subscription_plans.price_per_credit IS 'Price tenant pays system admin per credit (wholesale price)';
COMMENT ON COLUMN subscription_plans.total_credits IS 'Maximum credits tenant can purchase (-1 for unlimited)';
COMMENT ON COLUMN subscription_plans.credits_per_ton_tenant IS 'Credits deducted from tenant per ton of cargo';
COMMENT ON COLUMN subscription_plans.credits_per_ton_truck_owner IS 'Credits deducted from truck owner per ton of cargo';

-- Success message
SELECT 'Subscription plans table updated to credit-based system successfully!' as message;
