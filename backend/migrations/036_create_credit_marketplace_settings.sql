-- Migration 036: Create Credit Marketplace Settings Table
-- This enables the new flexible credit marketplace system where truck owners can buy custom amounts

CREATE TABLE IF NOT EXISTS credit_marketplace_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Purchase limits
  min_purchase_amount INTEGER NOT NULL DEFAULT 500,
  max_purchase_amount INTEGER, -- NULL means no maximum
  
  -- Pricing
  price_per_credit DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  
  -- Status
  is_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  settings_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_tenant_marketplace UNIQUE(tenant_id),
  CONSTRAINT positive_min_purchase CHECK (min_purchase_amount > 0),
  CONSTRAINT positive_max_purchase CHECK (max_purchase_amount IS NULL OR max_purchase_amount > 0),
  CONSTRAINT max_greater_than_min CHECK (max_purchase_amount IS NULL OR max_purchase_amount >= min_purchase_amount),
  CONSTRAINT positive_price CHECK (price_per_credit > 0)
);

-- Add index for faster lookups
CREATE INDEX idx_marketplace_tenant ON credit_marketplace_settings(tenant_id);
CREATE INDEX idx_marketplace_enabled ON credit_marketplace_settings(is_enabled) WHERE is_enabled = true;

-- Add column to subscription_plans to distinguish marketplace vs old partner plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS is_marketplace_plan BOOLEAN DEFAULT false;

-- Add column to credit_accounts to track marketplace sales
ALTER TABLE credit_accounts
ADD COLUMN IF NOT EXISTS revenue_from_marketplace_sales DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_credits_sold_marketplace INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_marketplace_transactions INTEGER DEFAULT 0;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_marketplace_settings_updated_at
  BEFORE UPDATE ON credit_marketplace_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_settings_updated_at();

-- Add comments
COMMENT ON TABLE credit_marketplace_settings IS 'Configuration for tenant admin credit marketplace where truck owners can purchase custom credit amounts';
COMMENT ON COLUMN credit_marketplace_settings.min_purchase_amount IS 'Minimum credits a truck owner must purchase';
COMMENT ON COLUMN credit_marketplace_settings.max_purchase_amount IS 'Maximum credits per transaction (NULL = unlimited)';
COMMENT ON COLUMN credit_marketplace_settings.price_per_credit IS 'Price per credit in the tenant currency';
COMMENT ON COLUMN credit_marketplace_settings.is_enabled IS 'Whether the marketplace is currently accepting purchases';
