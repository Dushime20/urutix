-- Migration 029: Add user_id column to tenant_subscriptions
-- Description: Adds user_id column to track which tenant admin purchased the subscription
-- Date: 2026-04-09

-- Add user_id column to tenant_subscriptions table
ALTER TABLE tenant_subscriptions 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint to users table
ALTER TABLE tenant_subscriptions
ADD CONSTRAINT fk_tenant_subscriptions_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_user_id 
ON tenant_subscriptions(user_id);

-- Add comment for documentation
COMMENT ON COLUMN tenant_subscriptions.user_id IS 'ID of the tenant admin who purchased the subscription';

-- Success message
SELECT 'user_id column added to tenant_subscriptions table successfully!' as message;
