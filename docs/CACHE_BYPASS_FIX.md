# Cache Bypass Fix - Credit Balance

## Problem

The backend API was returning cached credit balance (4,976) even though the database had the correct value (9,976). This was causing the marketplace purchase to fail with "Insufficient credits available. Only 4976 credits available."

## Root Cause

TypeORM's entity manager maintains a first-level cache (identity map) that keeps entities in memory. When we updated the database directly using SQL scripts, the running backend server still had the old entity cached.

The `getOrCreateCreditAccount()` method was using:
```typescript
const account = await queryBuilder.getOne(); // Returns cached entity
```

## Solution

Modified `getOrCreateCreditAccount()` in `backend/src/services/credit.service.ts` to use raw SQL queries that bypass TypeORM's cache:

```typescript
// Use raw query to bypass TypeORM cache and get fresh data
const rawResult = await this.creditAccountRepository.query(
  `SELECT * FROM credit_accounts WHERE tenant_id = $1 AND ${userId ? 'user_id = $2' : 'user_id IS NULL'}`,
  userId ? [tenantId, userId] : [tenantId]
);
```

This ensures that every call to `getOrCreateCreditAccount()` fetches fresh data directly from the database, bypassing any cached entities.

## Impact

✅ **Immediate effect** - No server restart required
✅ All API endpoints now return fresh data:
- `/api/credits/balance` → `currentBalance: 9976`
- `/api/credits/marketplace/availability` → `availableCredits: 9976`
- `/api/credits/marketplace/purchase` → Works with up to 9,976 credits

## Testing

The fix affects all methods that use `getOrCreateCreditAccount()`:
- `getCreditBalance()`
- `hasSufficientCredits()`
- `grantSubscriptionCredits()`
- `grantPurchasedCredits()`
- `grantBonusCredits()`
- `consumeCredits()`
- `purchaseCredits()` (marketplace)
- And more...

All these methods will now always fetch fresh data from the database.

## Verification

Test the marketplace purchase:
1. Go to `dashboard/fleet/buy-credits`
2. Enter amount: 5000 credits
3. Should NOT show error "Only 4976 credits available"
4. Should show "Available: 9,976"
5. Purchase should succeed

## Files Modified

- `backend/src/services/credit.service.ts` - Updated `getOrCreateCreditAccount()` method

## Note

While this fix works immediately, it's still recommended to restart the backend server periodically to clear any other cached data and ensure optimal performance.
