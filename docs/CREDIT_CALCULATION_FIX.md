# Credit Calculation Fix - Partner Plan Purchases

## Problem Summary

When truck owners purchased partner plans, they were receiving incorrect credit amounts. The system was granting the total plan allocation instead of the per-partner credit amount.

### Example Issue:
- **Partner Plan Configuration:**
  - Credit Cost Per Partner: 1,000 credits
  - Available Slots: 3
  - Total Credits (allocation): 3,000 credits (1,000 × 3)

- **What Should Happen:**
  - Truck owner purchases the plan
  - Receives: 1,000 credits

- **What Was Happening:**
  - Truck owner purchases the plan
  - Receives: 3,000 credits ❌

## Root Cause

In `backend/src/services/subscription.service.ts`, the `purchaseSubscription` method was using `plan.totalCredits` when granting credits:

```typescript
// OLD CODE (INCORRECT)
if (plan.totalCredits > 0) {
  await this.creditService.grantSubscriptionCredits(
    data.tenantId,
    plan.totalCredits,  // ❌ This is the total allocation, not per-partner
    subscription.id,
    subscription.currentPeriodEnd,
    data.userId,
  );
}
```

## Solution

Updated the `purchaseSubscription` method to use `creditCostPerPartner` for partner plans:

```typescript
// NEW CODE (CORRECT)
// Determine credits to grant based on plan type
const creditsToGrant = plan.creditCostPerPartner || plan.totalCredits;

if (creditsToGrant > 0) {
  await this.creditService.grantSubscriptionCredits(
    data.tenantId,
    creditsToGrant,  // ✅ Uses creditCostPerPartner for partner plans
    subscription.id,
    subscription.currentPeriodEnd,
    data.userId,
  );
}
```

## Credit Account Fields Explained

### How Credits Are Calculated:

1. **`currentBalance`**
   - Formula: `lifetimeEarned - lifetimeSpent`
   - Increases when credits are granted
   - Decreases when credits are consumed
   - Shows available credits right now

2. **`subscriptionCredits`**
   - Tracks credits received from subscriptions only
   - Increases when subscription credits are granted
   - Separate from purchased credits or bonus credits

3. **`lifetimeEarned`**
   - Total credits ever received (all sources)
   - Increases when any credits are granted
   - Never decreases
   - Historical record of all credits received

4. **`lifetimeSpent`**
   - Total credits ever consumed
   - Increases when credits are used for cargo operations
   - Never decreases
   - Historical record of all credits used

### Credit Flow Example:

**Truck Owner Purchases Partner Plan (1,000 credits):**
```
currentBalance: 0 → 1,000
subscriptionCredits: 0 → 1,000
lifetimeEarned: 0 → 1,000
lifetimeSpent: 0 (no change)
```

**Truck Owner Transports 10 tons of cargo (2 credits/ton = 20 credits):**
```
currentBalance: 1,000 → 980
subscriptionCredits: 1,000 (no change)
lifetimeEarned: 1,000 (no change)
lifetimeSpent: 0 → 20
```

## Data Fix Applied

A script was created and executed to fix existing incorrect credit balances:

**File:** `backend/fix-truck-owner-credits.js`

**Results:**
- Found 1 truck owner with incorrect credits
- Email: truckowner5@demo.com
- Corrected from 3,000 credits to 1,000 credits ✅

## Files Modified

1. **backend/src/services/subscription.service.ts**
   - Updated `purchaseSubscription` method
   - Now uses `creditCostPerPartner` for partner plans

2. **backend/fix-truck-owner-credits.js** (new)
   - Script to fix existing incorrect credit balances
   - Can be run again if needed

## Testing

To verify the fix works correctly:

1. **Create a new partner plan:**
   - Credit Cost Per Partner: 500
   - Available Slots: 2
   - Total Credits: 1,000

2. **Have a truck owner purchase the plan**

3. **Check their credit account:**
   ```
   GET /api/credits/tenant/users/balances?role=TRUCK_OWNER
   ```

4. **Expected Result:**
   ```json
   {
     "currentBalance": 500,
     "subscriptionCredits": 500,
     "lifetimeEarned": 500,
     "lifetimeSpent": 0
   }
   ```

## Prevention

The fix ensures that:
- ✅ Regular plans grant `totalCredits` to tenant admins
- ✅ Partner plans grant `creditCostPerPartner` to truck owners
- ✅ Credit calculations are accurate and consistent
- ✅ No hardcoded values are used

## Related Endpoints

- `POST /api/subscriptions/purchase` - Purchase subscription
- `GET /api/credits/account` - Get user's credit account
- `GET /api/credits/tenant/users/balances` - Get all tenant user balances
- `POST /api/credits/consume` - Consume credits for cargo operations

## Date
April 10, 2026
