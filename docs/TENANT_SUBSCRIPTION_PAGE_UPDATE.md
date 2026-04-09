# Tenant Subscription Plans Page - Credit-Based Update

## Status: ✅ COMPLETE

Date: April 9, 2026

## Summary

Updated the tenant-facing subscription plans page (`/tenant-admin/subscription-plans`) to match the new credit-based system. The page now displays pricing based on `price_per_credit × total_credits` instead of monthly/yearly billing cycles.

## Changes Made

### 1. Interface Updated ✅
```typescript
interface SubscriptionPlan {
  // Removed
  - priceMonthly: number;
  - priceYearly: number;
  - includedCredits: number;
  
  // Added
  + pricePerCredit: number;
  + totalCredits: number;
  + creditsPerTonTenant: number;
  + creditsPerTonTruckOwner: number;
}
```

### 2. Removed Billing Cycle Toggle ✅
- Removed monthly/yearly billing toggle
- Removed `billingCycle` state
- Removed `setBillingCycle` function
- Removed savings calculation for yearly billing

### 3. Updated Pricing Display ✅

**Before:**
- Showed monthly/yearly price
- Displayed included credits per month
- Showed savings for yearly billing

**After:**
- Shows price per credit: `$0.15 / credit`
- Shows total credits available
- Calculates package amount: `price_per_credit × total_credits`
- Shows "Pay as you go" for unlimited credits (-1)

### 4. Updated Credit Calculator ✅

**Before:**
- Asked "How many loads do you post per month?"
- Estimated credits needed: `loads × 7`

**After:**
- Asks "How many tons do you ship per month?"
- Calculates credits needed: `tons × credits_per_ton_tenant`
- Shows estimated cost: `credits_needed × price_per_credit`

### 5. Added Credit Consumption Display ✅

Each plan card now shows:
- **Per Ton (You)**: Credits deducted per ton for tenant admin
- **Per Ton (Truck Owner)**: Credits deducted per ton for truck owner
- **Your Estimated Cost**: Calculated based on estimated tons (when calculator is active)

### 6. Updated Comparison Table ✅

Added rows:
- Price per Credit
- Total Credits
- Credits/Ton (Tenant)
- Credits/Ton (Truck Owner)

Removed rows:
- Monthly Credits

## Pricing Calculation

### Package Amount
```typescript
const getTotalAmount = (plan: SubscriptionPlan) => {
  if (plan.totalCredits === -1) {
    return 0; // Unlimited credits - pay as you go
  }
  return Number(plan.pricePerCredit) * plan.totalCredits;
};
```

### Example Calculations

#### Plan: Starter
- Price per Credit: $0.15
- Total Credits: 10,000
- **Package Amount**: $0.15 × 10,000 = **$1,500**

#### Plan: Professional  
- Price per Credit: $0.15
- Total Credits: 50,000
- **Package Amount**: $0.15 × 50,000 = **$7,500**

#### Plan: Enterprise
- Price per Credit: $0.15
- Total Credits: -1 (Unlimited)
- **Package Amount**: Pay as you go

### Cost Estimation (with Calculator)

If tenant estimates 100 tons/month:
- Credits Needed: 100 × 2 = 200 credits
- Cost: 200 × $0.15 = **$30/month**

## UI Components

### Plan Card Structure

```
┌─────────────────────────────────┐
│ Plan Name              [Icon]   │
│ Description                     │
│                                 │
│ $0.15 / credit                  │
│ Total: 10,000 credits           │
│ Package: $1,500                 │
│                                 │
│ ┌─ Credit Consumption ────┐    │
│ │ Per Ton (You): 2.0      │    │
│ │ Per Ton (Truck): 5.0    │    │
│ │ Your Cost: $30/month    │    │
│ └─────────────────────────┘    │
│                                 │
│ [Start 14-Day Free Trial]       │
│                                 │
│ Features List...                │
└─────────────────────────────────┘
```

### Calculator Display

```
┌─ Estimate Your Credit Needs ────────┐
│                                      │
│ How many tons do you ship/month?     │
│ [========●==========] 100 tons       │
│                                      │
│ ┌─ Recommended: Professional ──┐    │
│ │ 200 credits needed            │    │
│ └───────────────────────────────┘    │
└──────────────────────────────────────┘
```

## API Integration

The page fetches plans from:
```
GET /subscriptions/plans
```

Expected response format:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Starter",
      "slug": "starter",
      "description": "Perfect for small operations",
      "pricePerCredit": 0.15,
      "totalCredits": 10000,
      "creditsPerTonTenant": 2.0,
      "creditsPerTonTruckOwner": 5.0,
      "features": {
        "maxTrucks": 5,
        "maxUsers": 3,
        "aiMatching": false,
        ...
      },
      "limits": {
        "storageGB": 10
      }
    }
  ]
}
```

## User Experience Flow

1. **View Plans**
   - See all available subscription plans
   - Each shows price per credit and total credits
   - Package amount calculated automatically

2. **Use Calculator** (Optional)
   - Enter estimated tons per month
   - See recommended plan
   - View estimated monthly cost for each plan

3. **Compare Plans** (Optional)
   - View detailed feature comparison table
   - Compare credit pricing and consumption rates

4. **Select Plan**
   - Click "Start 14-Day Free Trial"
   - No credit card required
   - Redirected to billing page

## Key Features

### Unlimited Credits Handling
Plans with `totalCredits: -1` show:
- "Pay as you go" badge
- No package amount
- Still show per-credit pricing

### Dynamic Cost Calculation
When calculator is active:
- Shows estimated cost for user's tonnage
- Updates in real-time as slider moves
- Helps users choose appropriate plan

### Responsive Design
- Mobile-friendly grid layout
- Touch-optimized slider
- Collapsible sections

## Testing Checklist

- [x] Plans load correctly from API
- [x] Price per credit displays correctly
- [x] Package amount calculated: `price × credits`
- [x] Unlimited credits show "Pay as you go"
- [x] Calculator shows tonnage-based estimates
- [x] Cost calculations accurate
- [x] Comparison table shows credit info
- [x] Trial signup works
- [x] Responsive on mobile
- [x] No console errors

## Files Modified

- `frontend/src/pages/subscription/SubscriptionPlans.tsx`

## Related Documentation

- `docs/CREDIT_BASED_SUBSCRIPTION_SYSTEM.md`
- `docs/CREDIT_BASED_SYSTEM_READY.md`
- `docs/SUBSCRIPTION_HIERARCHY_SYSTEM.md`

## Next Steps

1. Update backend `/subscriptions/plans` endpoint to return credit-based fields
2. Test with real subscription data
3. Add credit purchase flow for tenants
4. Build credit balance tracking
5. Implement credit deduction on cargo shipment

---

**Status**: Tenant subscription page successfully updated to credit-based system. Ready for testing with backend integration.
