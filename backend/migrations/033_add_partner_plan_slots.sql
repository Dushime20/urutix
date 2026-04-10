-- Migration: Add credit_cost_per_partner and available_slots to subscription_plans
-- This supports the slot-based partner plan allocation model

-- Add credit_cost_per_partner column (credits required per partner slot)
ALTER TABLE subscription_plans
ADD COLUMN credit_cost_per_partner INTEGER DEFAULT 0;

-- Add available_slots column (number of partners who can purchase this plan)
ALTER TABLE subscription_plans
ADD COLUMN available_slots INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN subscription_plans.credit_cost_per_partner IS 'Credits required per partner slot (e.g., 1000 credits per partner)';
COMMENT ON COLUMN subscription_plans.available_slots IS 'Number of partners who can purchase this plan (e.g., 4 slots)';

-- Note: total_credits will be calculated as credit_cost_per_partner × available_slots
-- This represents the total credit allocation for this partner plan
