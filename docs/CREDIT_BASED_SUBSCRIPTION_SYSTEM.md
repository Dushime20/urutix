# Credit-Based Subscription System

## Overview
A weight-based credit consumption system for a multi-tenant logistics platform where credits are deducted based on cargo weight (tons).

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     SYSTEM ADMIN                             │
│  • Creates subscription plans                                │
│  • Defines credit consumption rules (credits per ton)        │
│  • Sets credit purchase pricing                              │
│  • Sells credits to Tenant Admins                           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ Purchases Credits
                         │ ($0.15 per credit)
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                    TENANT ADMIN                              │
│  • Buys credits from System Admin                           │
│  • Credits deducted: 2 credits per ton                      │
│  • Can resell to Truck Owners with markup                   │
│  • Configures own pricing for truck owners                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ Resells Credits
                         │ (5 credits per ton)
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                    TRUCK OWNER                               │
│  • Buys credits from Tenant Admin                           │
│  • Credits deducted: 5 credits per ton                      │
│  • Uses credits when transporting cargo                     │
└──────────────────────────────────────────────────────────────┘
```

## Subscription Plan Configuration

### Form Fields

#### Basic Information
1. **Plan Name** (required)
   - Example: "Standard Logistics Plan"

2. **Plan Slug** (required)
   - Example: "standard-logistics"

3. **Description** (optional)
   - Example: "Weight-based credit system for logistics operations"

#### Credit Purchase Settings
4. **Price per Credit** (required)
   - What Tenant Admin pays to System Admin per credit
   - Example: $0.15
   - This is the wholesale price

5. **Max Credits Available** (required)
   - Maximum credits tenant can purchase
   - Use -1 for unlimited
   - Example: 100,000 or -1

#### Credit Consumption Rules
6. **Credits per Ton (Tenant Admin)** (required)
   - Credits deducted from tenant per ton of cargo
   - Example: 2 credits/ton
   - This is what tenant pays to system

7. **Credits per Ton (Truck Owner)** (required)
   - Credits deducted from truck owner per ton
   - Example: 5 credits/ton
   - This is what truck owner pays to tenant

8. **Min Credits per Ton** (required)
   - Minimum allowed credits per ton
   - Example: 1
   - Validation boundary

9. **Max Credits per Ton** (required)
   - Maximum allowed credits per ton
   - Example: 100
   - Validation boundary

#### Plan Limits (Existing)
10. **Max Trucks** - Maximum trucks allowed (-1 for unlimited)
11. **Max Users** - Maximum users allowed (-1 for unlimited)
12. **Max Drivers** - Maximum drivers allowed (-1 for unlimited)
13. **Max Loads/Month** - Maximum loads per month (-1 for unlimited)

#### Feature Access (Existing)
- AI Matching
- Advanced Analytics
- Broker Management
- Insurance Tracking
- API Access
- Priority Support

## Credit Flow Example

### Scenario: 10 Ton Cargo Shipment

#### System Admin Configuration
```
Price per Credit: $0.15
Credits per Ton (Tenant): 2
Credits per Ton (Truck Owner): 5
```

#### Step 1: Truck Owner Ships 10 Tons
```
Cargo Weight: 10 tons
Credits Deducted: 10 × 5 = 50 credits
Truck Owner's Cost: 50 credits (from their balance)
```

#### Step 2: Tenant Admin's Cost
```
Cargo Weight: 10 tons
Credits Deducted: 10 × 2 = 20 credits
Tenant's Cost: 20 × $0.15 = $3.00
```

#### Step 3: Profit Calculation
```
Truck Owner Paid: 50 credits
Tenant Admin Cost: 20 credits
Tenant Admin Profit: 50 - 20 = 30 credits

If Tenant sells credits at $0.25 each:
Revenue: 50 × $0.25 = $12.50
Cost: 20 × $0.15 = $3.00
Profit: $12.50 - $3.00 = $9.50
```

## Business Model

### For System Admin

#### Revenue Streams
1. **Credit Sales**
   - Tenant purchases credits at $0.15 each
   - Example: 10,000 credits = $1,500

2. **Usage-Based Revenue**
   - Revenue scales with cargo volume
   - More tons = more credits consumed = more revenue

#### Example Monthly Revenue
```
10 Tenants
Average 1,000 tons/month each
Total: 10,000 tons/month

Credits Consumed: 10,000 × 2 = 20,000 credits
Revenue: 20,000 × $0.15 = $3,000/month
```

### For Tenant Admin

#### Revenue Streams
1. **Credit Markup**
   - Buy at $0.15, sell at $0.25
   - Markup: $0.10 per credit

2. **Volume-Based Profit**
   - More truck owners = more volume = more profit

#### Example Monthly Profit
```
50 Truck Owners
Average 100 tons/month each
Total: 5,000 tons/month

Truck Owner Credits: 5,000 × 5 = 25,000 credits
Tenant Cost: 5,000 × 2 = 10,000 credits

If selling at $0.25/credit:
Revenue: 25,000 × $0.25 = $6,250
Cost: 10,000 × $0.15 = $1,500
Profit: $6,250 - $1,500 = $4,750/month
```

### For Truck Owner

#### Cost Structure
1. **Per-Ton Pricing**
   - Pay 5 credits per ton
   - Predictable costs based on cargo weight

2. **Example Cost**
```
Monthly Volume: 100 tons
Credits Needed: 100 × 5 = 500 credits
Cost (at $0.25/credit): 500 × $0.25 = $125/month
```

## Credit Consumption Logic

### When Cargo is Shipped

```typescript
function deductCredits(cargoWeight: number, userRole: string, plan: SubscriptionPlan) {
  let creditsPerTon: number;
  
  if (userRole === 'TENANT_ADMIN') {
    creditsPerTon = plan.creditsPerTonTenant; // 2
  } else if (userRole === 'TRUCK_OWNER') {
    creditsPerTon = plan.creditsPerTonTruckOwner; // 5
  }
  
  // Validate against limits
  if (creditsPerTon < plan.minCreditsPerTon || creditsPerTon > plan.maxCreditsPerTon) {
    throw new Error('Credits per ton out of allowed range');
  }
  
  const totalCredits = cargoWeight * creditsPerTon;
  
  // Check balance
  if (userBalance < totalCredits) {
    throw new Error('Insufficient credits');
  }
  
  // Deduct credits
  userBalance -= totalCredits;
  
  return {
    creditsDeducted: totalCredits,
    remainingBalance: userBalance
  };
}
```

### Example Usage

```typescript
// Truck Owner ships 15 tons
const result = deductCredits(15, 'TRUCK_OWNER', plan);
// creditsDeducted: 75 (15 × 5)
// remainingBalance: userBalance - 75

// Tenant Admin's cost for same shipment
const tenantCost = deductCredits(15, 'TENANT_ADMIN', plan);
// creditsDeducted: 30 (15 × 2)
// Tenant's profit: 75 - 30 = 45 credits
```

## Database Schema Updates

### subscription_plans Table
```sql
ALTER TABLE subscription_plans
DROP COLUMN price_monthly,
DROP COLUMN price_yearly,
DROP COLUMN included_credits,
ADD COLUMN price_per_credit DECIMAL(10,4) DEFAULT 0.15,
ADD COLUMN total_credits INTEGER DEFAULT -1,
ADD COLUMN credits_per_ton_tenant DECIMAL(10,2) DEFAULT 2.0,
ADD COLUMN credits_per_ton_truck_owner DECIMAL(10,2) DEFAULT 5.0,
ADD COLUMN min_credits_per_ton DECIMAL(10,2) DEFAULT 1.0,
ADD COLUMN max_credits_per_ton DECIMAL(10,2) DEFAULT 100.0;
```

### credit_transactions Table
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'deduction', 'refund'
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  cargo_weight DECIMAL(10,2), -- For deduction transactions
  credits_per_ton DECIMAL(10,2), -- Rate used for deduction
  reference_id UUID, -- Cargo/Load ID
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### credit_balances Table
```sql
CREATE TABLE credit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  current_balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_consumed INTEGER NOT NULL DEFAULT 0,
  last_purchase_date TIMESTAMP,
  last_consumption_date TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### System Admin
```
POST /admin/subscription-plans
Body: {
  name: "Standard Plan",
  slug: "standard",
  pricePerCredit: 0.15,
  totalCredits: -1,
  creditsPerTonTenant: 2,
  creditsPerTonTruckOwner: 5,
  minCreditsPerTon: 1,
  maxCreditsPerTon: 100,
  features: {...}
}
```

### Tenant Admin
```
POST /credits/purchase
Body: {
  amount: 1000,
  planId: "uuid"
}
Response: {
  creditsAdded: 1000,
  cost: 150.00,
  newBalance: 1500
}
```

### Truck Owner
```
POST /cargo/ship
Body: {
  cargoId: "uuid",
  weight: 10
}
Response: {
  creditsDeducted: 50,
  remainingBalance: 450,
  costBreakdown: {
    weight: 10,
    creditsPerTon: 5,
    totalCredits: 50
  }
}
```

### Credit Balance Check
```
GET /credits/balance
Response: {
  currentBalance: 500,
  totalPurchased: 1000,
  totalConsumed: 500,
  lastPurchase: "2026-04-09T10:00:00Z"
}
```

## Validation Rules

### Credit Purchase
1. Tenant cannot exceed `totalCredits` limit (if not -1)
2. Minimum purchase: 10 credits
3. Must have valid payment method
4. Plan must be active

### Credit Deduction
1. User must have sufficient balance
2. Credits per ton must be within min/max range
3. Cargo weight must be positive
4. Transaction must be logged

### Credit Refund
1. Only for cancelled shipments
2. Must be within 24 hours
3. Credits returned to balance
4. Transaction logged as refund

## UI Components

### Admin Form (Completed)
- ✅ Removed: Monthly/Yearly pricing
- ✅ Removed: Included credits
- ✅ Added: Price per credit
- ✅ Added: Total credits
- ✅ Added: Credits per ton (tenant)
- ✅ Added: Credits per ton (truck owner)
- ✅ Added: Min/Max credits per ton
- ✅ Added: Example calculation display

### Tenant Dashboard (To Build)
- Credit balance widget
- Purchase credits button
- Credit usage history
- Cost per ton calculator

### Truck Owner Dashboard (To Build)
- Credit balance display
- Purchase credits from tenant
- Shipment cost estimator
- Usage analytics

## Example Plan Configurations

### Basic Plan
```
Name: Basic Logistics
Price per Credit: $0.15
Max Credits: 50,000
Credits/Ton (Tenant): 2
Credits/Ton (Truck Owner): 5
Min/Max: 1-100
```

### Premium Plan
```
Name: Premium Logistics
Price per Credit: $0.12
Max Credits: 200,000
Credits/Ton (Tenant): 1.5
Credits/Ton (Truck Owner): 4
Min/Max: 0.5-100
```

### Enterprise Plan
```
Name: Enterprise Logistics
Price per Credit: $0.10
Max Credits: -1 (Unlimited)
Credits/Ton (Tenant): 1
Credits/Ton (Truck Owner): 3
Min/Max: 0.1-100
```

## Implementation Checklist

### Backend
- [ ] Update subscription_plans table schema
- [ ] Create credit_transactions table
- [ ] Create credit_balances table
- [ ] Update SubscriptionPlan entity
- [ ] Create CreditTransaction entity
- [ ] Create CreditBalance entity
- [ ] Implement credit purchase endpoint
- [ ] Implement credit deduction logic
- [ ] Implement credit refund logic
- [ ] Add validation middleware

### Frontend
- [x] Update admin subscription form
- [x] Remove pricing fields
- [x] Add credit configuration fields
- [x] Add example calculations
- [ ] Build tenant credit purchase UI
- [ ] Build truck owner credit purchase UI
- [ ] Build credit balance widgets
- [ ] Build usage analytics

### Testing
- [ ] Test credit purchase flow
- [ ] Test credit deduction on shipment
- [ ] Test insufficient balance handling
- [ ] Test refund logic
- [ ] Test validation rules
- [ ] Test multi-tenant isolation

## Date
April 9, 2026
