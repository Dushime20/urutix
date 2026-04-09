-- Migration 030: Add user_id column to credit_accounts
-- Description: Adds user_id column to support user-level credit tracking
-- Date: 2026-04-09

-- Add user_id column to credit_accounts table
ALTER TABLE credit_accounts 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add foreign key constraint to users table
ALTER TABLE credit_accounts
ADD CONSTRAINT fk_credit_accounts_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_credit_accounts_user_id 
ON credit_accounts(user_id);

-- Create unique index for tenant_id and user_id combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_accounts_tenant_user 
ON credit_accounts(tenant_id, user_id) 
WHERE user_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN credit_accounts.user_id IS 'ID of the user for user-level credit accounts (NULL for tenant-level accounts)';

-- Success message
SELECT 'user_id column added to credit_accounts table successfully!' as message;
