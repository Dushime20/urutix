-- Migration 007: Credit Pricing Rules System
-- Description: Creates table for dynamic credit pricing based on weight, distance, time, etc.
-- Date: 2026-02-13

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREDIT PRICING RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'weight', 'distance', 'time', 'flat'
  unit VARCHAR(20) NOT NULL, -- 'ton', 'km', 'hour', 'trip'
  credit_cost DECIMAL(10,2) NOT NULL,
  
  -- Optional: Plan-specific pricing
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
  
  -- Optional: Tenant-specific pricing (overrides plan)
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Tiered pricing support
  min_value DECIMAL(10,2), -- e.g., 0 tons
  max_value DECIMAL(10,2), -- e.g., 10 tons
  
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority rules apply first
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_positive_cost CHECK (credit_cost >= 0),
  CONSTRAINT chk_valid_rule_type CHECK (rule_type IN ('weight', 'distance', 'time', 'flat'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON credit_pricing_rules(rule_type, is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_plan ON credit_pricing_rules(plan_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_tenant ON credit_pricing_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON credit_pricing_rules(priority DESC);

-- Add calculation_details column to credit_transactions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credit_transactions' AND column_name = 'calculation_details'
  ) THEN
    ALTER TABLE credit_transactions 
    ADD COLUMN calculation_details JSONB DEFAULT '{}';
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE credit_pricing_rules IS 'Defines dynamic pricing rules for credit consumption based on various factors';
COMMENT ON COLUMN credit_pricing_rules.rule_type IS 'Type of pricing rule: weight, distance, time, or flat';
COMMENT ON COLUMN credit_pricing_rules.unit IS 'Unit of measurement: ton, km, hour, trip';
COMMENT ON COLUMN credit_pricing_rules.credit_cost IS 'Cost in credits per unit';
COMMENT ON COLUMN credit_pricing_rules.plan_id IS 'If set, rule applies only to specific subscription plan';
COMMENT ON COLUMN credit_pricing_rules.tenant_id IS 'If set, rule applies only to specific tenant (highest priority)';
COMMENT ON COLUMN credit_pricing_rules.min_value IS 'Minimum value for tiered pricing (null = no minimum)';
COMMENT ON COLUMN credit_pricing_rules.max_value IS 'Maximum value for tiered pricing (null = no maximum)';
COMMENT ON COLUMN credit_pricing_rules.priority IS 'Higher priority rules are evaluated first';

-- Success message
SELECT 'Credit Pricing Rules table created successfully!' as message;
