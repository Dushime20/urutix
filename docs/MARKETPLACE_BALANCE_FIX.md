# Credit Marketplace Balance Fix

## Issue Summary

The tenant admin was seeing "Only 4,976 credits available" in the marketplace when trying to purchase credits, but they had purchased 2 subscriptions of 5,000 credits each (total 10,000 credits).

## Root Cause

The `lifetime_spent` field in the credit account was incorrectly showing 5,024 credits instead of the actual 24 credits consumed. This was caused by:

1. **Old Partner Plan System**: When the old partner plan system was in use, credits were being "allocated" to partners and incorrectly deducted from the tenant admin's balance
2. **Missing Transaction Records**: There was a phantom 5,000 credit deduction that appeared in `lifetime_spent` but had no corresponding transaction record
3. **Incorrect Balance Calculation**: The current balance was calculated as `lifetime_earned - lifetime_spent = 10,000 - 5,024 = 4,976` instead of the correct `10,000 - 24 = 9,976`

## Investigation Results

### Before Fix:
```
Tenant Admin Account:
- Lifetime Earned: 10,000 credits (2 subscriptions × 5,000)
- Lifetime Spent: 5,024 credits ❌ WRONG
- Current Balance: 4,976 credits ❌ WRONG
- Subscription Credits: 10,000 credits

Actual Transactions:
- Bid 1: -8 credits (Raw material, 4 tons × 2 credits/ton)
- Bid 2: -16 credits (Industrial material, 8 tons × 2 credits/ton)
- Total Actual Spent: 24 credits ✅ CORRECT

Discrepancy: 5,024 - 24 = 5,000 phantom credits
```

### After Fix:
```
Tenant Admin Account:
- Lifetime Earned: 10,000 credits (2 subscriptions × 5,000)
- Lifetime Spent: 24 credits ✅ CORRECT
- Current Balance: 9,976 credits ✅ CORRECT
- Subscription Credits: 10,000 credits

Available for Marketplace: 9,976 credits ✅
```

## Fix Applied

Updated the credit account to reflect only actual consumption:

```sql
UPDATE credit_accounts
SET 
  lifetime_spent = 24,           -- Only actual consumption
  current_balance = 9976          -- 10,000 - 24
WHERE tenant_id = '3174d68f-cb7d-4428-b578-e931d1a3f464' 
  AND user_id = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';
```

## Impact

- ✅ Tenant admin now has correct balance: 9,976 credits
- ✅ Marketplace availability now shows correct amount
- ✅ Truck owners can now purchase up to 9,976 credits from the marketplace
- ✅ All calculations are now based on actual transactions

## Prevention

The new Credit Marketplace system prevents this issue by:

1. **No Pre-Allocation**: Credits are NOT deducted from tenant admin until they're actually sold
2. **Transfer on Purchase**: Credits are only transferred when truck owner completes payment
3. **Clear Transaction Trail**: Every credit movement creates a transaction record
4. **Separate Tracking**: Marketplace sales are tracked separately from operational consumption

## Files Modified

- `backend/fix-marketplace-balance.js` - Script to fix the balance
- `backend/check-marketplace-balance.js` - Diagnostic script
- `backend/check-all-transactions.js` - Transaction analysis script

## Verification

Run the diagnostic script to verify the fix:

```bash
cd backend
node check-marketplace-balance.js
```

Expected output:
```
✅ Marketplace is checking account for user: 007eb9d5-a71b-42be-8c9e-1c968dd97c71
   This user has 9976 credits available
```

## Related Documentation

- [Credit Marketplace Quick Start](./CREDIT_MARKETPLACE_QUICK_START.md)
- [Credit Marketplace Implementation](./CREDIT_MARKETPLACE_IMPLEMENTATION.md)
- [Partner Plan System Redesign](./PARTNER_PLAN_SYSTEM_REDESIGN.md)
