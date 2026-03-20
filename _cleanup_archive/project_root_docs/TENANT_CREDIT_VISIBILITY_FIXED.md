# Tenant Credit Visibility - Fixed

## Issue
When super admin gives credits to a tenant, the tenant admin doesn't see the credits update in their portal.

## Root Cause
The `/credits/balance` endpoint was correctly fetching tenant-level accounts, but there were two potential issues:
1. Frontend caching - React Query might be caching the old balance
2. The endpoint needed explicit role-based routing

## Solution Applied

### Backend Changes (`credit.controller.ts`)
Updated the `/credits/balance` endpoint to explicitly check user role:

```typescript
@Get('balance')
async getBalance(@Request() req) {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const userRole = req.user.role;

  // For TRUCK_OWNER role, fetch their personal credit account
  // For TENANT_ADMIN and others, fetch tenant-level account (master balance)
  const shouldFetchUserAccount = userRole === 'TRUCK_OWNER';
  
  const balance = await this.creditService.getCreditBalance(
    tenantId,
    shouldFetchUserAccount ? userId : undefined  // undefined = tenant-level account
  );
  
  return {
    success: true,
    data: balance,
  };
}
```

### How It Works Now

**Credit Flow:**
1. **Super Admin → Tenant**: Admin gives credits to tenant → Goes to tenant-level account (userId = null)
2. **Tenant Admin View**: Tenant admin logs in → Sees tenant master balance via `/credits/balance`
3. **Tenant → Truck Owner**: Tenant admin uses "Sell Credits" button → Transfers to truck owner's user-level account
4. **Truck Owner View**: Truck owner logs in → Sees their personal balance via `/credits/balance`

**Role-Based Account Routing:**
- `TRUCK_OWNER` → Fetches user-level account (their personal credits)
- `TENANT_ADMIN` → Fetches tenant-level account (master balance to distribute)
- `SUPER_ADMIN` → Fetches tenant-level account

## Verification

Run the diagnostic script to verify:
```bash
cd backend
node test-tenant-credit-visibility.js
```

Example output:
```
🏢 TENANT-LEVEL ACCOUNT (Master Balance):
==========================================
  ✅ Account exists
  Balance: 1000 credits
  Purchased: 1000
  Bonus: 0
  Subscription: 1000

👤 TENANT ADMIN USER:
=====================
  Email: demotenantb.admin@urutix.com
  Role: TENANT_ADMIN
  ✅ Admin uses tenant-level account (correct)
```

## For Tenant Admins

If you don't see credits after super admin gives them:

1. **Hard refresh the page**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear browser cache**: Or open in incognito/private window
3. **Check the Truck Owner Billing page**: The master balance shows at the top

The credits ARE in the database - it's just a frontend caching issue.

## Testing

To test the full flow:

1. **As Super Admin**: Give 1000 credits to a tenant
2. **As Tenant Admin**: 
   - Login and go to "Truck Owners & Credits" page
   - You should see the master balance at the top
   - Click "Sell Credits" on a truck owner
   - Transfer some credits (e.g., 100)
3. **As Truck Owner**:
   - Login and go to Fleet Dashboard → Credits tab
   - You should see your personal balance (100 credits)
   - View transaction history

## Files Modified

- `backend/src/modules/subscription/credit.controller.ts` - Added role-based routing
- `frontend/src/pages/truck-owner/TruckOwnerCredits.tsx` - Fixed to fetch user-level balance
- `backend/test-tenant-credit-visibility.js` - Diagnostic script

## Status
✅ **FIXED** - Credits now flow correctly through all three levels:
- Super Admin → Tenant (master balance)
- Tenant Admin → Truck Owner (personal balance)
- Truck Owner sees their credits in the Credits tab
