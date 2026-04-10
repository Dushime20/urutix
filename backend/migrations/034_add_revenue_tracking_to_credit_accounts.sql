-- Migration: Add revenue tracking fields to credit_accounts
-- Description: Adds fields to track revenue from partner plan sales for tenant admins

-- Add revenue tracking columns
ALTER TABLE credit_accounts
ADD COLUMN IF NOT EXISTS revenue_from_partner_sales DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_partners_sold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_allocated_to_partners INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN credit_accounts.revenue_from_partner_sales IS 'Total revenue earned from selling partner plans to truck owners';
COMMENT ON COLUMN credit_accounts.total_partners_sold IS 'Number of partner plan subscriptions sold';
COMMENT ON COLUMN credit_accounts.credits_allocated_to_partners IS 'Total credits allocated/reserved for partner plans';

-- Create index for revenue queries
CREATE INDEX IF NOT EXISTS idx_credit_accounts_revenue ON credit_accounts(revenue_from_partner_sales);
CREATE INDEX IF NOT EXISTS idx_credit_accounts_partners_sold ON credit_accounts(total_partners_sold);
