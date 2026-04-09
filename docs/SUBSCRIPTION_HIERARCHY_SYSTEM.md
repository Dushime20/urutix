# Subscription Hierarchy System

## Overview
The platform implements a multi-tier subscription system where subscriptions flow from System Admin → Tenant Admin → Truck Owners.

## Subscription Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     SYSTEM ADMIN                            │
│  Creates subscription plans with pricing & credit economics │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Purchases Subscription
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    TENANT ADMIN                             │
│  - Subscribes to a plan from System Admin                  │
│  - Gets included credits + ability to purchase more         │
│  - Can resell subscriptions to their truck owners           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Offers Subscription
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    TRUCK OWNER                              │
│  - Subscribes to plan offered by their Tenant Admin        │
│  - Uses credits for platform operations                     │
│  - Can purchase additional credits from Tenant Admin        │
└─────────────────────────────────────────────────────────────┘
```

## Tier 1: System Admin Creates Plans

### Location
`/admin/subscription-plans`

### Form Fields

#### Basic Information
1. **Plan Name** (required)
   - Display name for the plan
   - Example: "Starter", "Professional", "Enterprise"

2. **Plan Slug** (required)
   - URL-friendly identifier
   - Example: "starter", "professional", "enterprise"

3. **Description** (optional)
   - Brief description of the plan
   - Example: "Perfect for small fleets getting started"

#### Pricing Structure
4. **Monthly Price** (required)
   - Subscription cost per month
   - Example: $49.99

5. **Yearly Price** (optional)
   - Subscription cost per year
   - Example: $499.99 (saves $100)

6. **Included Credits** (required)
   - Credits included with subscription
   - Example: 100 credits

#### Credit Economics (NEW)
7. **Price per Credit** (required)
   - Cost when tenant purchases additional credits
   - Example: $0.15 per credit
   - This is what Tenant Admin pays to System Admin

8. **Total Available Credits** (required)
   - Maximum credits tenant can purchase
   - Use -1 for unlimited
   - Example: 10,000 credits or -1

#### Plan Limits
9. **Max Trucks** (required)
   - Maximum trucks allowed
   - Use -1 for unlimited

10. **Max Users** (required)
    - Maximum users allowed
    - Use -1 for unlimited

11. **Max Drivers** (required)
    - Maximum drivers allowed
    - Use -1 for unlimited

12. **Max Loads/Month** (required)
    - Maximum loads per month
    - Use -1 for unlimited

#### Feature Access (Checkboxes)
13. **AI Matching** - Enable AI-powered load matching
14. **Advanced Analytics** - Enable advanced reporting
15. **Broker Management** - Enable broker features
16. **Insurance Tracking** - Enable insurance management
17. **API Access** - Enable API integration
18. **Priority Support** - Enable priority customer support

#### Settings
19. **Plan is Active** (checkbox)
    - Whether plan is visible to tenants

20. **Display Order** (number)
    - Sort order for plan display

### Example Plan Configuration

#### Starter Plan
```
Plan Name: Starter
Plan Slug: starter
Description: Perfect for small fleets getting started with digital logistics
Monthly Price: $49.99
Yearly Price: $499.99
Included Credits: 100

Credit Economics:
  Price per Credit: $0.15
  Total Available Credits: 5,000

Plan Limits:
  Max Trucks: 5
  Max Users: 3
  Max Drivers: 5
  Max Loads/Month: 50

Features:
  ☐ AI Matching
  ☐ Advanced Analytics
  ☐ Broker Management
  ☑ Insurance Tracking
  ☐ API Access
  ☐ Priority Support

Settings:
  ☑ Plan is Active
  Display Order: 1
```

#### Professional Plan
```
Plan Name: Professional
Plan Slug: professional
Description: Advanced features for growing logistics operations
Monthly Price: $149.99
Yearly Price: $1499.99
Included Credits: 500

Credit Economics:
  Price per Credit: $0.12
  Total Available Credits: 25,000

Plan Limits:
  Max Trucks: 25
  Max Users: 10
  Max Drivers: 25
  Max Loads/Month: 500

Features:
  ☑ AI Matching
  ☑ Advanced Analytics
  ☑ Broker Management
  ☑ Insurance Tracking
  ☑ API Access
  ☑ Priority Support

Settings:
  ☑ Plan is Active
  Display Order: 2
```

#### Enterprise Plan
```
Plan Name: Enterprise
Plan Slug: enterprise
Description: Complete solution for large-scale logistics operations
Monthly Price: $499.99
Yearly Price: $4999.99
Included Credits: 2,000

Credit Economics:
  Price per Credit: $0.10
  Total Available Credits: -1 (Unlimited)

Plan Limits:
  Max Trucks: -1 (Unlimited)
  Max Users: -1 (Unlimited)
  Max Drivers: -1 (Unlimited)
  Max Loads/Month: -1 (Unlimited)

Features:
  ☑ AI Matching
  ☑ Advanced Analytics
  ☑ Broker Management
  ☑ Insurance Tracking
  ☑ API Access
  ☑ Priority Support

Settings:
  ☑ Plan is Active
  Display Order: 3
```

## Tier 2: Tenant Admin Purchases Subscription

### Location
`/tenant-admin/purchase-credits` or `/tenant-admin/subscription-plans`

### What Tenant Admin Gets
1. **Subscription Access**
   - Access to all features in their plan
   - Included credits (e.g., 100, 500, 2000)
   - Ability to manage their fleet within limits

2. **Credit Purchase Ability**
   - Can buy additional credits at the defined price
   - Example: If price per credit is $0.15, they pay $15 for 100 credits
   - Limited by Total Available Credits (unless unlimited)

3. **Resale Capability**
   - Can create sub-plans for their truck owners
   - Can set their own pricing (markup)
   - Manages their own credit economy

### Example Transaction
```
Tenant Admin subscribes to Professional Plan:
  - Pays: $149.99/month
  - Gets: 500 included credits
  - Can purchase: Up to 25,000 additional credits at $0.12 each
  - Total potential spend: $149.99 + (25,000 × $0.12) = $3,149.99
```

## Tier 3: Truck Owner Subscribes

### Location
Truck owner portal (to be implemented)

### What Truck Owner Gets
1. **Sub-subscription from Tenant**
   - Plan created by their Tenant Admin
   - Credits allocated by Tenant Admin
   - Features enabled by Tenant Admin

2. **Credit Usage**
   - Uses credits for platform operations
   - Can purchase more from Tenant Admin
   - Tenant Admin sets the price (can markup)

### Example Transaction
```
Truck Owner subscribes to Tenant's "Basic Fleet" plan:
  - Pays: $29.99/month (to Tenant Admin)
  - Gets: 50 credits
  - Can purchase: Additional credits at $0.20 each (Tenant's markup)
  
Tenant Admin's Economics:
  - Charges Truck Owner: $29.99
  - Allocates: 50 credits (cost to tenant: 50 × $0.12 = $6)
  - Profit: $29.99 - $6 = $23.99 per truck owner
```

## Credit Economics Flow

### System Admin → Tenant Admin
```
System Admin sets:
  Price per Credit: $0.15
  
Tenant Admin purchases 1,000 credits:
  Cost: 1,000 × $0.15 = $150
  
System Admin receives: $150
Tenant Admin gets: 1,000 credits
```

### Tenant Admin → Truck Owner
```
Tenant Admin sets:
  Price per Credit: $0.25 (markup of $0.10)
  
Truck Owner purchases 100 credits:
  Cost: 100 × $0.25 = $25
  
Tenant Admin receives: $25
Tenant Admin's cost: 100 × $0.15 = $15
Tenant Admin's profit: $25 - $15 = $10
```

## Revenue Model

### For System Admin
1. **Subscription Revenue**
   - Monthly/Yearly subscription fees from tenants
   - Example: 100 tenants × $149.99 = $14,999/month

2. **Credit Sales Revenue**
   - Additional credit purchases by tenants
   - Example: 100 tenants × 1,000 credits × $0.15 = $15,000

3. **Total Potential Revenue**
   - Subscriptions + Credit Sales
   - Recurring + Usage-based model

### For Tenant Admin
1. **Subscription Revenue**
   - Monthly fees from truck owners
   - Example: 50 truck owners × $29.99 = $1,499.50/month

2. **Credit Sales Revenue**
   - Credit purchases by truck owners (with markup)
   - Example: 50 owners × 100 credits × $0.10 markup = $500

3. **Total Revenue**
   - $1,499.50 + $500 = $1,999.50/month

4. **Costs**
   - Subscription to System Admin: $149.99
   - Credit purchases: Variable based on usage

5. **Profit**
   - Revenue - Costs = Profit margin

## Database Schema

### subscription_plans Table
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  included_credits INTEGER NOT NULL DEFAULT 0,
  price_per_credit DECIMAL(10,4),      -- NEW
  total_credits INTEGER,                -- NEW (-1 for unlimited)
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### tenant_subscriptions Table
```sql
CREATE TABLE tenant_subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(50) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  credits_purchased INTEGER DEFAULT 0,   -- Track additional credits
  credits_remaining INTEGER,              -- Track available credits
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### System Admin
- `GET /admin/subscription-plans` - List all plans
- `POST /admin/subscription-plans` - Create new plan
- `PATCH /admin/subscription-plans/:id` - Update plan
- `DELETE /admin/subscription-plans/:id` - Delete plan

### Tenant Admin
- `GET /subscriptions/plans` - View available plans
- `POST /subscriptions` - Subscribe to a plan
- `POST /credits/purchase` - Purchase additional credits
- `GET /credits/balance` - Check credit balance

### Truck Owner
- `GET /truck-owner/plans` - View tenant's plans
- `POST /truck-owner/subscribe` - Subscribe to tenant's plan
- `POST /truck-owner/credits/purchase` - Buy credits from tenant

## Implementation Status

### Completed
- [x] System Admin can create subscription plans
- [x] User-friendly form with all fields
- [x] Price per credit field
- [x] Total credits field
- [x] Feature toggles and limits
- [x] Plan display with new fields

### Pending
- [ ] Backend API to save pricePerCredit and totalCredits
- [ ] Tenant Admin subscription purchase flow
- [ ] Tenant Admin credit purchase with pricing
- [ ] Truck Owner subscription system
- [ ] Credit allocation and tracking
- [ ] Revenue reporting and analytics

## Next Steps

1. **Update Backend Entity**
   - Add `pricePerCredit` column to subscription_plans table
   - Add `totalCredits` column to subscription_plans table
   - Update SubscriptionPlan entity

2. **Create Migration**
   ```sql
   ALTER TABLE subscription_plans 
   ADD COLUMN price_per_credit DECIMAL(10,4),
   ADD COLUMN total_credits INTEGER DEFAULT -1;
   ```

3. **Implement Credit Purchase**
   - Create endpoint for tenant to purchase credits
   - Calculate cost based on pricePerCredit
   - Track purchases in tenant_subscriptions

4. **Build Truck Owner Portal**
   - Create subscription plans for truck owners
   - Implement credit allocation
   - Build purchase flow

## Date
April 9, 2026
