-- Migration 006: Subscription & Credit Management System (Simplified)
-- Description: Creates tables for subscription plans, tenant subscriptions, credit accounts, and credit transactions
-- Date: 2026-02-13

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  included_credits INTEGER NOT NULL DEFAULT 0,
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, display_order);

-- ============================================================================
-- 2. TENANT SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  auto_renew BOOLEAN DEFAULT true,
  payment_method_id VARCHAR(255),
  last_payment_date TIMESTAMP,
  next_payment_date TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_subscription_status CHECK (status IN ('active', 'cancelled', 'expired', 'suspended', 'trial')),
  CONSTRAINT chk_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_period ON tenant_subscriptions(current_period_end);

-- ============================================================================
-- 3. CREDIT ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  current_balance INTEGER NOT NULL DEFAULT 0,
  subscription_credits INTEGER NOT NULL DEFAULT 0,
  purchased_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  last_refresh_date TIMESTAMP,
  next_refresh_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_positive_balance CHECK (current_balance >= 0),
  CONSTRAINT chk_positive_subscription_credits CHECK (subscription_credits >= 0),
  CONSTRAINT chk_positive_purchased_credits CHECK (purchased_credits >= 0),
  CONSTRAINT chk_positive_bonus_credits CHECK (bonus_credits >= 0)
);

CREATE INDEX IF NOT EXISTS idx_credit_accounts_tenant ON credit_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_accounts_balance ON credit_accounts(current_balance);
CREATE INDEX IF NOT EXISTS idx_credit_accounts_refresh ON credit_accounts(next_refresh_date);

-- ============================================================================
-- 4. CREDIT TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  credit_account_id UUID NOT NULL REFERENCES credit_accounts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  subscription_id UUID REFERENCES tenant_subscriptions(id),
  payment_id UUID,
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_transaction_type CHECK (type IN ('SUBSCRIPTION_GRANT', 'PURCHASE', 'CONSUMPTION', 'REFUND', 'BONUS', 'EXPIRY', 'ADJUSTMENT'))
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_tenant ON credit_transactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_account ON credit_transactions(credit_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference ON credit_transactions(reference_type, reference_id);

-- ============================================================================
-- 5. SUBSCRIPTION PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
  payment_id UUID,
  billing_period_start TIMESTAMP NOT NULL,
  billing_period_end TIMESTAMP NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  credits_granted INTEGER NOT NULL DEFAULT 0,
  invoice_number VARCHAR(50) UNIQUE,
  invoice_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON subscription_payments(subscription_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_payment ON subscription_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_invoice ON subscription_payments(invoice_number);

-- ============================================================================
-- 6. CREDIT PACKAGES TABLE (for top-ups)
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_positive_credits CHECK (credits > 0),
  CONSTRAINT chk_positive_price CHECK (price > 0),
  CONSTRAINT chk_valid_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_credit_packages_slug ON credit_packages(slug);

-- ============================================================================
-- 7. FEATURE CREDIT COSTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS feature_credit_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_code VARCHAR(100) UNIQUE NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  description TEXT,
  credit_cost DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_positive_cost CHECK (credit_cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_feature_credit_costs_code ON feature_credit_costs(feature_code);
CREATE INDEX IF NOT EXISTS idx_feature_credit_costs_active ON feature_credit_costs(is_active);

-- Success message
SELECT 'Subscription & Credit System tables created successfully!' as message;
