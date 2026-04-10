# Credit Account Data Fix

## Date: April 10, 2026

## Issue Discovered
The tenant admin's credit account had inconsistent data:
- `lifetime_spent` showed 32 credits, but only 8 credits were actually spent
- `current_balance` was 4,968 instead of the correct 4,992
- This caused confusion about how many credits were being deducted

## Root Cause
The account had incorrect values from previous testing or data seeding. The `lifetime_spent` and `current_balance` fields were not matching the actual transaction history.

## Investigation Results

### Transaction History
Only ONE bid acceptance transaction for tenant admin:
- **Time**: 2026-04-10 20:47:48
- **Amount**: -8 credits
- **Description**: "Bid accepted for 'Raw material' (4 tons × 2 credits/ton)"
- **Calculation**: 4 tons × 2 credits/ton = 8 credits ✓

### Database Inconsistency
**Before Fix**:
- Lifetime Earned: 5,000 credits
- Lifetime Spent: 32 credits (WRONG - should be 8)
- Current Balance: 4,968 credits (WRONG - should be 4,992)
- Calculation: 5,000 - 32 = 4,968 ✓ (internally consistent but wrong values)

**After Fix**:
- Lifetime Earned: 5,000 credits
- Lifetime Spent: 8 credits ✓
- Current Balance: 4,992 credits ✓
- Calculation: 5,000 - 8 = 4,992 ✓

## Fix Applied

### 1. Recalculated `lifetime_spent`
```sql
-- Calculate actual spent from transactions
SELECT SUM(ABS(amount)) FROM credit_transactions
WHERE user_id = '007eb9d5-a71b-42be-8c9e-1c968dd97c71'
  AND type = 'CONSUMPTION';
-- Result: 8 credits

-- Update account
UPDATE credit_accounts
SET lifetime_spent = 8
WHERE user_id = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';
```

### 2. Recalculated `current_balance`
```sql
-- Calculate correct balance
-- current_balance = lifetime_earned - lifetime_spent
-- 5000 - 8 = 4992

UPDATE credit_accounts
SET current_balance = 4992
WHERE user_id = '007eb9d5-a71b-42be-8c9e-1c968dd97c71';
```

## Verification

### Tenant Admin (tenantadmin@demo.com)
- ✅ Lifetime Earned: 5,000 credits
- ✅ Lifetime Spent: 8 credits
- ✅ Current Balance: 4,992 credits
- ✅ Calculation: 5,000 - 8 =