# Credit Balance System Explanation

## Overview
The credit balance system tracks operational credits and financial revenue separately for different user roles.

## Credit Account Types

### 1. Tenant-Level Account (No User ID)
- **Purpose**: Tracks tenant-wide financial metrics and revenue
- **Fields**:
  - `currentBalance`: 0 (not used for tenant-level)
  - `subscriptionCredits`: 0 (not used for tenant-level)
  - `revenueFromPartnerSales`: Total revenue from partner plan sales
  - `totalPartnersSold`: Number of truck owners who purchased partner plans
  - `creditsAllocatedToPartners`: Total credits allocated across all partner plans
  - `creditsAvailableForAllocation`: Remaining credits that can be allocated

### 2. Tenant Admin User Account
- **Purpose**: Tracks operational credits for the tenant admin
- **Fields**:
  - `currentBalance`: Total operational credits available
  - `subscriptionCredits`: Credits from subscription purchase
  - `purchasedCredits`: Credits from direct purchases
  - `bonusCredits`: Promotional or bonus credits
  - `lifetimeEarned`: Total credits ever received
  - `lifetimeSpent`: Total credits consumed

### 3. Truck Owner User Account
- **Purpose**: Tracks operational credits for truck owners
- **Fields**: Same as tenant admin (operational credits only)

## How Fields Are Calculated

### For Tenant Admin (`/api/credits/balance` - no userId)

#### Operational Credits (from subscription):
```
currentBalance = subscriptionCredits + purchasedCredits + bonusCredits - consumed
subscriptionCredits = Credits granted when purchasing subscription from system admin
purchasedCredits = Credits from direct credit purchases
lifetimeEarned = Total of all credits ever granted
lifetimeSpent = Total of all credits consumed for operations
```

#### Revenue Tracking (from partner plan sales):
```
revenueFromPartnerSales = Sum of (creditCostPerPartner × pricePerCredit) for each sale
totalPartnersSold = Count of truck owners who purchased partner plans
creditsAllocatedToPartners = Sum of creditCostPerPartner for all sales
creditsAvailableForAllocation = currentBalance - creditsAllocatedToPartners
```

### For Truck Owner (`/api/credits/balance` with userId)

```
currentBalance = subscriptionCredits - consumed
subscriptionCredits = creditCostPerPartner from partner plan purchase
lifetimeEarned = Total credits from partner plan purchases
lifetimeSpent = Credits consumed when transporting cargo
```

## Credit Flow Example

### Step 1: Tenant Admin Purchases Subscription
- System Admin creates "Pro Max" plan: 5000 credits @ $1/credit
- Tenant Admin purchases → Pays $5000
- **Result**:
  - Tenant Admin Account: `currentBalance = 5000`, `subscriptionCredits = 5000`

### Step 2: Tenant Admin Creates Partner Plan
- Creates "Simple" partner plan:
  - Total Credits (allocation): 3000 credits
  - Credit Cost Per Partner: 1000 credits
  - Available Slots: 3
  - Price Per Credit: $1 (inherited from parent)
- **Result**:
  - No credits moved yet (just plan creation)
  - Tenant Admin still has 5000 credits available

### Step 3: Truck Owner Purchases Partner Plan
- Truck Owner 5 purchases "Simple" plan → Pays $1000
- **Result**:
  - Truck Owner Account: `currentBalance = 1000`, `subscriptionCredits = 1000`
  - Tenant-Level Account (revenue tracking):
    - `revenueFromPartnerSales = $1000`
    - `totalPartnersSold = 1`
    - `creditsAllocatedToPartners = 1000`
  - Tenant Admin Account (operational):
    - `currentBalance = 5000` (unchanged - revenue is separate)
    - `creditsAvailableForAllocation = 5000 - 1000 = 4000`

### Step 4: Truck Owner Transports Cargo
- Cargo: 10 tons, creditsPerTonTruckOwner = 50
- Credits consumed: 10 × 50 = 500 credits
- **Result**:
  - Truck Owner Account: `currentBalance = 500`, `lifetimeSpent = 500`

## Important Distinctions

### Operational Credits vs Financial Revenue

**Operational Credits** (currentBalance):
- Used for platform operations (cargo transport, features)
- Consumed when services are used
- Tracked in user-level credit accounts

**Financial Revenue** (revenueFromPartnerSales):
- Money earned from selling partner plans
- NOT operational credits
- Tracked in tenant-level credit account
- Separate from operational credit balance

### Allocated vs Consumed

**Allocated Credits**:
- Reserved for partner plans
- Reduces available allocation capacity
- Does NOT reduce operational credit balance
- Example: 1000 credits allocated to truck owner

**Consumed Credits**:
- Actually used for operations
- Reduces operational credit balance
- Tracked in lifetimeSpent
- Example: 500 credits consumed for cargo transport

## API Response Example

### Tenant Admin Balance Response
```json
{
  "currentBalance": 5000,           // Operational credits available
  "subscriptionCredits": 5000,      // From subscription purchase
  "purchasedCredits": 0,
  "bonusCredits": 0,
  "lifetimeEarned": 5000,
  "lifetimeSpent": 0,
  "revenueFromPartnerSales": 1000,  // Revenue from partner sales
  "totalPartnersSold": 1,           // Number of truck owners
  "creditsAllocatedToPartners": 1000, // Credits allocated to partners
  "creditsAvailableForAllocation": 4000 // 5000 - 1000
}
```

### Truck Owner Balance Response
```json
{
  "currentBalance": 500,            // Operational credits remaining
  "subscriptionCredits": 1000,      // From partner plan purchase
  "purchasedCredits": 0,
  "bonusCredits": 0,
  "lifetimeEarned": 1000,
  "lifetimeSpent": 500              // Consumed for cargo transport
}
```

## Current Issue

The response showing all zeros for tenant admin indicates:
1. ✅ Tenant admin has 5000 operational credits (fixed)
2. ❌ Revenue tracking shows 0 because:
   - Truck owner was granted 3000 credits instead of 1000
   - This happened before the fix in Task 24
   - Revenue tracking was called with wrong amount

## Solution

Run the credit fix script to correct truck owner's balance from 3000 to 1000, which will properly track the revenue.
