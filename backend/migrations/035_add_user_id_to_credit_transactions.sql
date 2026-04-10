-- Migration 035: Add user_id column to credit_transactions table
-- This allows tracking which user a credit transaction belongs to

-- Add user_id column to credit_transactions
ALTER TABLE credit_transactions 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add index for user_id
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id 
ON credit_transactions(user_id);

-- Add foreign key constraint to users table
ALTER TABLE credit_transactions
ADD CONSTRAINT fk_credit_transactions_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Add comment
COMMENT ON COLUMN credit_transactions.user_id IS 'User ID for user-level credit transactions (NULL for tenant-level transactions)';
