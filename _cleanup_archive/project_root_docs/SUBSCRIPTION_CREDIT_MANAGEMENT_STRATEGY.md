# Subscription & Credit Management Strategy for Urutix

## Executive Summary

This document outlines a comprehensive strategy for managing tenant subscriptions with a credit-based system that aligns with your logistics platform's multi-tenant architecture.

---

## 1. BUSINESS MODEL RECOMMENDATION

### Hybrid Subscription + Credit System

**Why This Model?**
- Predictable recurring revenue from subscriptions
- Flexible usage-based billing for variable logistics operations
- Fair pricing that scales with tenant business growth
- Reduces churn by offering multiple value tiers

### Three-Tier Approach

```
┌─────────────────────────────────────────────────────────────┐
│  SUBSCRIPTION TIER → Base Access + Monthly Credits          │
│  CREDIT CONSUMPTION → Pay-per-use for platform features     │
│  TOP-UP CREDITS → Additional credits when needed            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. SUBSCRIPTION TIERS

### Tier 1: STARTER ($99/month)
**Target**: Small fleet operators (1-5 trucks)

**Included Credits**: 500 credits/month
**Features**:
- Up to 5 trucks
- Up to 10 users
- 50 loads/month
- Basic matching algorithm
- Email support
- 5GB storage

**Credit Consumption**:
- Load posting: 5 credits
- Truck matching: 3 credits
- Route optimization: 10 credits
- Document generation: 2 credits
- SMS notification: 1 credit

### Tier 2: PROFESSIONAL ($299/month)
**Target**: Medium fleet operators (6-25 trucks)

**Included Credits**: 2,000 credits/month
**Features**:
- Up to 25 trucks
- Up to 50 users
- 200 loads/month
- AI-powered matching
- Priority support
- 50GB storage
- Advanced analytics
- Broker management
- Insurance tracking

**Credit Consumption**: Same as Starter + 
- AI price suggestions: 15 credits
- Advanced analytics report: 20 credits
- Broker commission processing: 5 credits

### Tier 3: ENTERPRISE ($999/month)
**Target**: Large fleet operators (26+ trucks)

**Included Credits**: 10,000 credits/month
**Features**:
- Unlimited trucks
- Unlimited users
- Unlimited loads
- Full AI suite
- Dedicated support
- 500GB storage
- Custom integrations
- White-label options
- API access
- Multi-region support

**Credit Consumption**: Discounted rates (20% off)

---

## 3. CREDIT SYSTEM DESIGN

### Credit Allocation Model

```typescript
interface CreditTransaction {
  id: string;
  tenantId: string;
  type: 'SUBSCRIPTION_GRANT' | 'PURCHASE' | 'CONSUMPTION' | 'REFUND' | 'BONUS' | 'EXPIRY';
  amount: number; // Positive for grants, negative for consumption
  balance: number; // Running balance after transaction
  description: string;
  metadata: {
    subscriptionId?: string;
    featureUsed?: string;
    loadId?: string;
    expiresAt?: Date;
  };
  createdAt: Date;
}

interface TenantCreditAccount {
  tenantId: string;
  currentBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  subscriptionCredits: number; // Credits from current subscription
  purchasedCredits: number; // Top-up credits
  bonusCredits: number; // Promotional credits
  lastRefreshDate: Date; // When subscription credits were last added
  nextRefreshDate: Date; // When next subscription credits will be added
}
```

### Credit Pricing for Top-Ups

**Pay-as-you-go rates** (when subscription credits run out):
- 100 credits: $15 (15¢ per credit)
- 500 credits: $60 (12¢ per credit) - 20% discount
- 1,000 credits: $100 (10¢ per credit) - 33% discount
- 5,000 credits: $400 (8¢ per credit) - 47% discount

### Credit Expiry Policy

**Subscription Credits**: 
- Expire at end of billing cycle (monthly)
- "Use it or lose it" model encourages engagement

**Purchased Credits**: 
- Valid for 12 months from purchase
- Encourages bulk purchases

**Bonus Credits**: 
- Valid for 3-6 months
- Used for promotions and retention

**Consumption Order** (FIFO with priority):
1. Expiring credits first (within 7 days)
2. Bonus credits
3. Subscription credits
4. Purchased credits (oldest first)

---

## 4. DATABASE SCHEMA

### New Tables Required

```sql
-- Subscription Plans Table
CREATE TABLE subscription_plans (
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
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tenant Subscriptions Table
CREATE TABLE tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, expired, suspended, trial
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- monthly, yearly
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
  UNIQUE(tenant_id, status) WHERE status = 'active'
);

-- Credit Accounts Table
CREATE TABLE credit_accounts (
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
  CONSTRAINT positive_balance CHECK (current_balance >= 0)
);

-- Credit Transactions Table
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  credit_account_id UUID NOT NULL REFERENCES credit_accounts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- SUBSCRIPTION_GRANT, PURCHASE, CONSUMPTION, REFUND, BONUS, EXPIRY
  amount INTEGER NOT NULL, -- Positive for credits added, negative for consumed
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(50), -- load, truck, route, document, etc.
  reference_id UUID,
  subscription_id UUID REFERENCES tenant_subscriptions(id),
  payment_id UUID REFERENCES payments(id),
  expires_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_credit_transactions_tenant (tenant_id, created_at DESC),
  INDEX idx_credit_transactions_type (type, created_at DESC)
);

-- Subscription Payments Table (extends payments)
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES tenant_subscriptions(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  billing_period_start TIMESTAMP NOT NULL,
  billing_period_end TIMESTAMP NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  credits_granted INTEGER NOT NULL DEFAULT 0,
  invoice_number VARCHAR(50) UNIQUE,
  invoice_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_subscription_payments_subscription (subscription_id, created_at DESC)
);

-- Credit Pricing Table (for top-ups)
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  credits INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Feature Credit Costs Table
CREATE TABLE feature_credit_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_code VARCHAR(100) UNIQUE NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  description TEXT,
  base_cost INTEGER NOT NULL,
  plan_multipliers JSONB DEFAULT '{}', -- {"starter": 1.0, "professional": 1.0, "enterprise": 0.8}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up core subscription infrastructure

**Tasks**:
1. Create database migrations for all new tables
2. Create TypeORM entities for subscription models
3. Seed initial subscription plans
4. Seed feature credit costs
5. Create credit package offerings

**Deliverables**:
- Migration files
- Entity files
- Seed data scripts

### Phase 2: Subscription Service (Week 3-4)
**Goal**: Build subscription management logic

**Tasks**:
1. Create SubscriptionService with methods:
   - `createSubscription(tenantId, planId, billingCycle)`
   - `upgradeSubscription(subscriptionId, newPlanId)`
   - `downgradeSubscription(subscriptionId, newPlanId)`
   - `cancelSubscription(subscriptionId, reason)`
   - `renewSubscription(subscriptionId)`
   - `handleTrialExpiry(subscriptionId)`

2. Create CreditService with methods:
   - `getCreditBalance(tenantId)`
   - `grantCredits(tenantId, amount, type, metadata)`
   - `consumeCredits(tenantId, amount, feature, referenceId)`
   - `purchaseCredits(tenantId, packageId, paymentId)`
   - `refundCredits(tenantId, amount, reason)`
   - `expireCredits(tenantId)`
   - `getCreditHistory(tenantId, filters)`

3. Create scheduled jobs:
   - Daily: Check and expire old credits
   - Daily: Refresh subscription credits on billing cycle
   - Daily: Send low credit warnings
   - Weekly: Generate usage reports

**Deliverables**:
- SubscriptionService
- CreditService
- Scheduled job handlers

### Phase 3: Payment Integration (Week 5)
**Goal**: Connect subscriptions to payment processing

**Tasks**:
1. Integrate with payment gateway (Stripe/PayPal/Mobile Money)
2. Create webhook handlers for:
   - Successful payment → Grant credits
   - Failed payment → Suspend subscription
   - Refund → Deduct credits
3. Generate invoices automatically
4. Send payment receipts

**Deliverables**:
- Payment gateway integration
- Webhook handlers
- Invoice generation service

### Phase 4: Frontend UI (Week 6-7)
**Goal**: Build tenant-facing subscription management

**Tasks**:
1. Subscription selection page (during onboarding)
2. Billing dashboard showing:
   - Current plan details
   - Credit balance with breakdown
   - Usage statistics
   - Billing history
   - Upcoming renewal
3. Plan upgrade/downgrade flow
4. Credit purchase page
5. Invoice download
6. Payment method management

**Deliverables**:
- Subscription selection UI
- Billing dashboard
- Credit purchase flow
- Payment management UI

### Phase 5: Admin Controls (Week 8)
**Goal**: Build super admin subscription management

**Tasks**:
1. Admin subscription overview dashboard
2. Manual subscription creation/modification
3. Credit adjustment tools (grant/deduct)
4. Subscription analytics
5. Revenue reporting
6. Refund processing

**Deliverables**:
- Admin subscription management UI
- Credit adjustment tools
- Analytics dashboard

### Phase 6: Credit Consumption Integration (Week 9-10)
**Goal**: Integrate credit consumption across platform features

**Tasks**:
1. Add credit checks before feature usage:
   - Load posting
   - Truck matching
   - Route optimization
   - Document generation
   - SMS notifications
   - AI features
2. Show credit cost before action
3. Handle insufficient credits gracefully
4. Track feature usage analytics

**Deliverables**:
- Credit middleware/guards
- Feature usage tracking
- Insufficient credit handling

---

## 6. CREDIT CONSUMPTION STRATEGY

### Feature Credit Costs (Recommended)

```typescript
const FEATURE_COSTS = {
  // Core Features
  LOAD_POST: 5,
  LOAD_EDIT: 2,
  LOAD_DELETE: 0, // Free
  
  // Matching & Discovery
  TRUCK_MATCH_BASIC: 3,
  TRUCK_MATCH_AI: 10,
  LOAD_SEARCH: 1,
  
  // Route & Optimization
  ROUTE_OPTIMIZATION: 10,
  MULTI_STOP_ROUTE: 15,
  ROUTE_TRACKING: 5,
  
  // Documents
  DOCUMENT_GENERATE: 2,
  DOCUMENT_SIGN: 3,
  CONTRACT_TEMPLATE: 5,
  
  // Communications
  SMS_NOTIFICATION: 1,
  EMAIL_NOTIFICATION: 0, // Free
  PUSH_NOTIFICATION: 0, // Free
  
  // AI Features
  PRICE_SUGGESTION: 15,
  DEMAND_FORECAST: 20,
  RISK_ASSESSMENT: 10,
  
  // Analytics
  BASIC_REPORT: 5,
  ADVANCED_ANALYTICS: 20,
  CUSTOM_REPORT: 30,
  
  // Broker Features
  BROKER_COMMISSION_CALC: 5,
  BROKER_PERFORMANCE: 10,
  
  // Insurance
  INSURANCE_QUOTE: 10,
  CLAIM_PROCESSING: 15,
  
  // API Access
  API_CALL: 0.1, // 10 calls = 1 credit
};
```

### Credit Consumption Flow

```typescript
// Example: Before posting a load
async function postLoad(tenantId: string, loadData: any) {
  // 1. Check credit balance
  const balance = await creditService.getCreditBalance(tenantId);
  const cost = FEATURE_COSTS.LOAD_POST;
  
  if (balance < cost) {
    throw new InsufficientCreditsError(
      `Insufficient credits. Required: ${cost}, Available: ${balance}`
    );
  }
  
  // 2. Show cost to user (in UI before action)
  // "This action will cost 5 credits. Continue?"
  
  // 3. Perform action
  const load = await loadRepository.save(loadData);
  
  // 4. Consume credits
  await creditService.consumeCredits(
    tenantId,
    cost,
    'LOAD_POST',
    load.id,
    { loadTitle: load.title }
  );
  
  // 5. Return result
  return load;
}
```

---

## 7. BUSINESS RULES

### Subscription Management

1. **Trial Period**: 14 days free trial with 100 credits
2. **Grace Period**: 7 days after payment failure before suspension
3. **Downgrade**: Takes effect at end of current billing cycle
4. **Upgrade**: Takes effect immediately with prorated credit
5. **Cancellation**: Access continues until end of paid period
6. **Reactivation**: Can reactivate within 30 days without data loss

### Credit Management

1. **Negative Balance**: Not allowed - block feature usage
2. **Low Credit Warning**: Alert at 20% remaining
3. **Zero Credits**: Show upgrade prompt or purchase options
4. **Refunds**: Credits refunded to account, not cash
5. **Credit Transfer**: Not allowed between tenants
6. **Unused Credits**: Subscription credits expire monthly

### Fair Usage Policy

1. **API Rate Limiting**: Based on subscription tier
2. **Bulk Operations**: May require additional credits
3. **Abuse Prevention**: Monitor unusual consumption patterns
4. **Credit Fraud**: Automatic suspension on suspicious activity

---

## 8. PRICING PSYCHOLOGY

### Value Communication

**Don't say**: "5 credits per load"
**Do say**: "Post unlimited loads - each posting uses 5 credits from your monthly allowance"

**Don't say**: "You're out of credits"
**Do say**: "You've used all 500 monthly credits! Upgrade to Professional for 4x more credits"

### Upgrade Triggers

1. **80% Credit Usage**: "You're using your plan efficiently! Consider upgrading for more credits"
2. **Feature Locked**: "This AI feature is available on Professional plan"
3. **Limit Reached**: "You've reached your 50 loads/month limit. Upgrade for unlimited loads"

### Retention Strategies

1. **Loyalty Bonus**: 10% bonus credits after 6 months
2. **Annual Discount**: 2 months free on yearly plans
3. **Referral Credits**: 500 bonus credits per referral
4. **Volume Discounts**: Enterprise custom pricing

---

## 9. MONITORING & ANALYTICS

### Key Metrics to Track

**Revenue Metrics**:
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (CLV)
- Churn Rate

**Usage Metrics**:
- Average credits consumed per tenant
- Most used features (by credits)
- Credit purchase frequency
- Credit expiry rate

**Conversion Metrics**:
- Trial to paid conversion rate
- Upgrade rate (Starter → Professional → Enterprise)
- Credit top-up conversion rate
- Cancellation reasons

### Dashboards Needed

1. **Tenant Billing Dashboard**: Current plan, credits, usage, invoices
2. **Admin Revenue Dashboard**: MRR, ARR, churn, upgrades
3. **Admin Usage Dashboard**: Feature usage, credit consumption patterns
4. **Admin Subscription Dashboard**: Active subscriptions, trials, cancellations

---

## 10. MIGRATION STRATEGY

### For Existing Tenants

**Option A: Grandfather Existing Tenants**
- Keep current free access for 3 months
- Gradually introduce credit system
- Offer special "early adopter" pricing

**Option B: Immediate Migration**
- Assign all existing tenants to Starter plan
- Grant 3 months free
- Require payment method after trial

**Recommended: Hybrid Approach**
1. Month 1: Announce subscription system, show credit usage (no charges)
2. Month 2: Soft launch - optional subscription with benefits
3. Month 3: Require subscription selection, offer discounts
4. Month 4: Full enforcement

---

## 11. TECHNICAL CONSIDERATIONS

### Performance

- Cache credit balances (Redis) - refresh every 5 minutes
- Batch credit transactions for bulk operations
- Async credit consumption (don't block user actions)
- Index credit_transactions table properly

### Security

- Encrypt payment method details
- PCI compliance for credit card handling
- Audit all credit adjustments
- Rate limit credit purchase attempts

### Scalability

- Partition credit_transactions by tenant_id
- Archive old transactions (> 1 year)
- Use read replicas for analytics queries
- Queue-based credit processing for high volume

---

## 12. RECOMMENDED NEXT STEPS

### Immediate Actions (This Week)

1. **Stakeholder Approval**: Review this strategy with business team
2. **Pricing Validation**: Validate pricing with target customers
3. **Technical Planning**: Assign development team and timeline
4. **Legal Review**: Ensure terms of service cover subscriptions

### Short Term (Next 2 Weeks)

1. Create database migrations
2. Build core subscription entities
3. Implement basic credit service
4. Set up payment gateway sandbox

### Medium Term (Next 2 Months)

1. Complete all 6 implementation phases
2. Internal testing with test tenants
3. Beta launch with select customers
4. Gather feedback and iterate

### Long Term (3-6 Months)

1. Full production launch
2. Monitor metrics and optimize pricing
3. Add advanced features (usage analytics, predictive billing)
4. Explore enterprise custom plans

---

## 13. SUCCESS CRITERIA

### Technical Success
- ✅ Zero downtime during migration
- ✅ < 100ms credit balance check latency
- ✅ 99.9% payment processing success rate
- ✅ Accurate credit accounting (zero discrepancies)

### Business Success
- ✅ 70%+ trial to paid conversion
- ✅ < 5% monthly churn rate
- ✅ 30%+ upgrade rate within 6 months
- ✅ $50K+ MRR within 3 months

### User Success
- ✅ Clear understanding of credit system (< 10% support tickets)
- ✅ Easy upgrade/downgrade process
- ✅ Transparent billing and invoicing
- ✅ Fair and predictable costs

---

## CONCLUSION

This subscription + credit system provides:
- **Predictable revenue** through monthly subscriptions
- **Fair usage-based pricing** through credits
- **Scalability** as tenants grow their business
- **Flexibility** with multiple tiers and top-up options
- **Retention** through value-aligned pricing

The hybrid model ensures small operators can start affordably while large enterprises pay proportionally to their usage, creating a sustainable and scalable business model for Urutix.

---

**Document Version**: 1.0  
**Last Updated**: February 13, 2026  
**Author**: Senior Product Strategist  
**Status**: Pending Approval
