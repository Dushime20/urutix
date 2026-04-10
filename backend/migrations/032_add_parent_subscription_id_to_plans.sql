-- Migration: Add parent_subscription_id to subscription_plans table
-- This allows tenant admins to create partner plans based on their purchased subscriptions

-- Add parent_subscription_id column
ALTER TABLE subscription_plans
ADD COLUMN parent_subscription_id UUID REFERENCES tenant_subscriptions(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX idx_subscription_plans_parent_subscription_id 
ON subscription_plans(parent_subscription_id);

-- Add comment
COMMENT ON COLUMN subscription_plans.parent_subscription_id IS 'Reference to parent subscription if this is a partner plan created by tenant admin';
