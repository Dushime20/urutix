# Partner Plan System Redesign

## Overview

This document explains the evolution of the partner plan system from a fixed-slot, pre-packaged approach to a flexible, credit-based marketplace model.

---

## Old System: Fixed Partner Plans with Slots

### Concept

The tenant admin creates predefined partner plans with fixed credit amounts and limited slots. Truck owners purchase these pre-packaged plans.

### How It Worked

#### 1. Tenant Admin Workflow

**Step 1: Purchase Subscription**
- Tenant admin buys a subscription from system admin (e.g., "Pro Max" - 5000 credits)
- Receives credits in their account

**Step 2: Create Partner Plans**
- Tenant admin creates multiple partner plans from their subscription
- Each plan has:
  - **Name**: e.g., "Basic Plan", "Premium Plan"
  - **Description**: Plan details
  - **Credits per Partner**: Fixed amount (e.g., 1000 credits)
  - **Available Slots**: Limited number (e.g., 3 slots)
  - **Total Credits Allocated**: Credits per Partner × Slots (e.g., 1000 × 3 = 3000)
  - **Price per Credit**: Inherited from parent subscription

**Example:**
```
Tenant Admin Subscription: "Pro Max" - 5000 credits

Partner Plans Created:
┌─────────────────────────────────────────────────┐
│ Plan 1: "Basic"                                 │
│ - Credits: 1000                                 │
│ - Slots: 3                                      │
│ - Total Allocated: 3000 credits                 │
│ - Price: $1.00/credit = $1000 per purchase      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Plan 2: "Premium"                               │
│ - Credits: 2000                                 │
│ - Slots: 1                                      │
│ - Total Allocated: 2000 credits                 │
│ - Price: $1.00/credit = $2000 per purchase      │
└─────────────────────────────────────────────────┘

Remaining Credits: 5000 - 3000 - 2000 = 0
```

#### 2. Truck Owner Workflow

**Step 1: Browse Available Plans**
- View partner plans created by tenant admin
- See plan details, pricing, and available slots

**Step 2: Purchase a Plan**
- Select a plan (e.g., "Basic" - 1000 credits for $1000)
- Complete payment
- Receive fixed amount of credits (1000)

**Step 3: Slot Tracking**
- System tracks purchased slots
- When all slots are filled, plan becomes unavailable
- Example: "Basic" plan (3 slots)
  - Truck Owner 1 purchases → 2 slots remaining
  - Truck Owner 2 purchases → 1 slot remaining
  - Truck Owner 3 purchases → 0 slots remaining (SOLD OUT)

### Limitations of Old System

#### 1. **Inflexibility**
- Truck owners must choose from predefined packages
- Cannot buy custom amounts (e.g., can't buy 1500 credits if only 1000 or 2000 plans exist)

#### 2. **Slot Management Overhead**
- Tenant admin must predict demand and set appropriate slot limits
- Plans can sell out, blocking new truck owners
- Requires creating multiple plans for different credit amounts

#### 3. **Credit Allocation Complexity**
- Tenant admin must pre-allocate credits to plans
- Unused slots = wasted credit allocation
- Example: If "Premium" plan (2000 credits, 1 slot) doesn't sell, those 2000 credits are locked

#### 4. **Limited Scalability**
- Each new truck owner requires an available slot
- Tenant admin must constantly monitor and create new plans
- Cannot easily accommodate varying truck owner needs

#### 5. **Revenue Tracking Issues**
- Revenue tied to specific plans rather than overall credit sales
- Difficult to track which credits are actually being used vs. allocated

---

## New System: Flexible Credit Marketplace

### Concept

Tenant admin sets a minimum purchase amount, and truck owners can buy any amount of credits (above the minimum) directly from the tenant admin's available balance. No pre-packaged plans or slots.

### How It Works

#### 1. Tenant Admin Workflow

**Step 1: Purchase Subscription**
- Tenant admin buys a subscription from system admin (e.g., "Pro Max" - 5000 credits)
- Receives credits in their account

**Step 2: Configure Credit Sales Settings**
- Set **Minimum Purchase Amount**: e.g., 500 credits
- Set **Price per Credit**: e.g., $1.00/credit (inherited from subscription or custom)
- Set **Maximum Purchase Limit** (optional): e.g., 2000 credits per transaction
- Enable/Disable credit sales

**Example:**
```
Tenant Admin Configuration:
┌─────────────────────────────────────────────────┐
│ Available Credits: 5000                         │
│ Minimum Purchase: 500 credits                   │
│ Maximum Purchase: 2000 credits (optional)       │
│ Price per Credit: $1.00                         │
│ Sales Status: ENABLED                           │
└─────────────────────────────────────────────────┘
```

#### 2. Truck Owner Workflow

**Step 1: View Credit Marketplace**
- See tenant admin's available credits
- View pricing and purchase limits

**Step 2: Choose Custom Amount**
- Enter desired credit amount (e.g., 750, 1200, 1850)
- Must be ≥ minimum purchase amount
- Must be ≤ maximum purchase limit (if set)
- Must be ≤ tenant admin's available balance

**Step 3: Complete Purchase**
- Review total cost (credits × price per credit)
- Complete payment
- Receive exact amount of credits purchased

**Example Purchases:**
```
Truck Owner 1: Buys 750 credits for $750
Truck Owner 2: Buys 1200 credits for $1200
Truck Owner 3: Buys 1500 credits for $1500
Truck Owner 4: Buys 600 credits for $600

Total Sold: 4050 credits
Tenant Admin Remaining: 5000 - 4050 = 950 credits
```

#### 3. Dynamic Availability

**Real-time Balance Tracking:**
- System shows tenant admin's current available credits
- Updates in real-time as purchases are made
- Truck owners can only buy up to available balance

**Example:**
```
Initial State:
Tenant Admin Balance: 5000 credits available

After Truck Owner 1 purchases 1200 credits:
Tenant Admin Balance: 3800 credits available

After Truck Owner 2 purchases 2000 credits:
Tenant Admin Balance: 1800 credits available

After Truck Owner 3 tries to purchase 2500 credits:
❌ ERROR: Only 1800 credits available
```

### Advantages of New System

#### 1. **Maximum Flexibility**
- Truck owners buy exactly what they need
- No forced packages or tiers
- Can purchase any amount within limits

#### 2. **No Slot Management**
- No need to predict demand
- No "sold out" scenarios (only limited by available credits)
- Unlimited truck owners can purchase (as long as credits available)

#### 3. **Simplified Administration**
- Tenant admin only sets minimum/maximum and price
- No need to create multiple plans
- No credit pre-allocation required

#### 4. **Better Credit Utilization**
- All credits can be sold (no locked allocations)
- No wasted credits in unsold plan slots
- More efficient use of tenant admin's subscription

#### 5. **Transparent Marketplace**
- Clear visibility of available credits
- Simple pricing model
- Easy to understand for truck owners

#### 6. **Scalability**
- Can serve unlimited truck owners
- Only limited by tenant admin's credit balance
- Easy to scale up (tenant admin buys more credits)

#### 7. **Accurate Revenue Tracking**
- Direct tracking of credits sold
- Clear revenue per credit sold
- Simple accounting and reporting

---

## Comparison Table

| Feature | Old System (Fixed Plans) | New System (Credit Marketplace) |
|---------|-------------------------|--------------------------------|
| **Plan Creation** | Required - Multiple plans | Not required - Single configuration |
| **Credit Amounts** | Fixed packages only | Any amount (within limits) |
| **Slot Management** | Required - Limited slots | Not required - No slots |
| **Availability** | Can sell out | Only limited by balance |
| **Flexibility** | Low - Predefined options | High - Custom amounts |
| **Admin Overhead** | High - Manage multiple plans | Low - Set min/max once |
| **Credit Allocation** | Pre-allocated to plans | Dynamic from available balance |
| **Scalability** | Limited by slots | Unlimited (balance-limited) |
| **Truck Owner Experience** | Choose from packages | Choose custom amount |
| **Revenue Tracking** | Per-plan tracking | Direct credit sales tracking |

---

## Migration Strategy

### Phase 1: Maintain Backward Compatibility
- Keep existing partner plans functional
- Add new credit marketplace alongside
- Allow tenant admins to choose which system to use

### Phase 2: Gradual Transition
- Encourage new tenant admins to use credit marketplace
- Provide migration tools for existing partner plans
- Show benefits of new system in UI

### Phase 3: Full Migration (Optional)
- Convert existing partner plans to credit marketplace settings
- Deprecate old partner plan creation
- Maintain existing subscriptions until expiry

---

## Implementation Considerations

### Database Changes

**New Table: `credit_marketplace_settings`**
```sql
CREATE TABLE credit_marketplace_settings (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  tenant_admin_user_id UUID NOT NULL,
  min_purchase_amount INTEGER NOT NULL DEFAULT 500,
  max_purchase_amount INTEGER,
  price_per_credit DECIMAL(10, 2) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Modified: `subscription_plans` table**
```sql
-- Add flag to distinguish between old partner plans and new marketplace
ALTER TABLE subscription_plans 
ADD COLUMN is_marketplace_plan BOOLEAN DEFAULT false;
```

### API Endpoints

**New Endpoints:**
```
POST   /api/credits/marketplace/configure    - Configure marketplace settings
GET    /api/credits/marketplace/settings     - Get marketplace settings
GET    /api/credits/marketplace/availability - Get available credits
POST   /api/credits/marketplace/purchase     - Purchase custom amount
GET    /api/credits/marketplace/history      - Purchase history
```

**Modified Endpoints:**
```
GET    /api/subscriptions/available-plans    - Include marketplace option
```

### Frontend Changes

**Tenant Admin Dashboard:**
- New "Credit Marketplace" section
- Configure minimum/maximum purchase amounts
- Set pricing
- View sales analytics
- Track available credits

**Truck Owner Dashboard:**
- New "Buy Credits" page
- Input field for custom credit amount
- Real-time price calculation
- Available balance display
- Purchase history

---

## Business Logic

### Credit Purchase Flow

```
1. Truck Owner enters desired amount (e.g., 1200 credits)
   ↓
2. System validates:
   ✓ Amount ≥ minimum purchase (500)
   ✓ Amount ≤ maximum purchase (2000) [if set]
   ✓ Amount ≤ tenant admin available balance
   ↓
3. Calculate total cost: 1200 × $1.00 = $1200
   ↓
4. Process payment
   ↓
5. Transfer credits:
   - Deduct 1200 from tenant admin balance
   - Add 1200 to truck owner balance
   ↓
6. Record transaction:
   - Credit transaction for truck owner (GRANT)
   - Credit transaction for tenant admin (TRANSFER_OUT)
   - Revenue tracking for tenant admin
   ↓
7. Update balances and notify both parties
```

### Revenue Tracking

**For Tenant Admin:**
```javascript
{
  revenue_from_credit_sales: totalAmount,      // $1200
  total_credits_sold: creditAmount,            // 1200 credits
  total_truck_owners_served: uniqueCount,      // Number of unique buyers
  average_purchase_amount: avgCredits,         // Average credits per purchase
  total_transactions: transactionCount         // Number of purchases
}
```

---

## Conclusion

The new credit marketplace system provides:
- **Greater flexibility** for truck owners
- **Reduced complexity** for tenant admins
- **Better credit utilization** overall
- **Improved scalability** for growth
- **Clearer revenue tracking** and reporting

This redesign transforms the partner plan system from a rigid, slot-based model to a dynamic, market-driven approach that better serves both tenant admins and truck owners.

---

*Document Version: 1.0*  
*Last Updated: April 11, 2026*  
*Author: Urutix Development Team*
