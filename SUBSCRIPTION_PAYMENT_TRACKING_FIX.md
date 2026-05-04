# Subscription Payment Tracking Fix

## Issue
The admin subscriptions page at `/admin/subscriptions` had a "REVENUE" column that was showing `$0.00` for all subscriptions, even though payments had been made.

## Root Cause
The backend `getAllSubscriptions()` method in `subscription.service.ts` was not calculating the paid amount from the payments table. It was just returning `totalRevenue: 0` as a hardcoded value.

## Solution

### Backend Changes (`backend/src/services/subscription.service.ts`)

1. **Added Payment Calculation Logic**:
   - Query the `payments` table to sum all completed subscription payments
   - Filter by `tenantId`, `paymentType = 'subscription'`, `status = 'completed'`
   - Match payments to subscriptions using JSONB metadata: `metadata->>'subscriptionId'`
   - Use `COALESCE(SUM(payment.amount), 0)` to handle null values

2. **Added Total Amount Calculation**:
   - Calculate expected total based on plan pricing
   - For credit-based plans: `pricePerCredit × credits`
   - For fixed-price plans: `priceMonthly` or `priceYearly` based on billing cycle

3. **Enhanced Response Data**:
   ```typescript
   {
     ...sub,
     tenantName: sub.tenant?.name || 'Unknown',
     creditBalance,
     totalRevenue: paidAmount,  // Now shows actual paid amount
     paidAmount,                 // Explicit paid amount field
     totalAmount,                // Expected total amount
   }
   ```

### Frontend Changes (`frontend/src/pages/admin/TenantSubscriptions.tsx`)

1. **Updated Interface**:
   - Added `paidAmount: number` field
   - Added `totalAmount: number` field

2. **Updated Table Headers**:
   - Changed "Revenue" to "Paid Amount" and "Total Amount" (2 separate columns)
   - Updated colspan from 8 to 9 for empty state

3. **Updated Table Body**:
   - Display paid amount in green: `${subscription.paidAmount.toFixed(2)}`
   - Display total amount in blue: `${subscription.totalAmount.toFixed(2)}`

4. **Enhanced Details Modal**:
   - Shows "Paid Amount" (green)
   - Shows "Total Amount" (blue)
   - Shows "Outstanding" (orange) = Total - Paid
   - Provides complete financial overview

## Technical Details

### JSONB Query Syntax
The key fix was using the correct PostgreSQL JSONB query syntax:

**Before (incorrect)**:
```typescript
.andWhere('payment.metadata::jsonb @> :metadata', { 
  metadata: JSON.stringify({ subscriptionId: sub.id }) 
})
```

**After (correct)**:
```typescript
.andWhere("payment.metadata->>'subscriptionId' = :subscriptionId", { 
  subscriptionId: sub.id 
})
```

### Payment Metadata Structure
When subscriptions are purchased, payments are created with this metadata:
```typescript
metadata: {
  planId: data.planId,
  planName: plan.name,
  subscriptionId: subscription.id,
  creditsGranted: creditsToGrant,
}
```

## Result
- ✅ "Paid Amount" column now shows actual payments received
- ✅ "Total Amount" column shows expected subscription cost
- ✅ Admin can see payment status at a glance
- ✅ Details modal shows outstanding balance
- ✅ All data is calculated from real database records (no hardcoded values)

## Files Modified
1. `backend/src/services/subscription.service.ts` - Added payment calculation logic
2. `frontend/src/pages/admin/TenantSubscriptions.tsx` - Updated UI to display payment data

## Testing
After deployment, verify:
1. Navigate to `/admin/subscriptions`
2. Check that "Paid Amount" shows actual payment amounts (not $0.00)
3. Check that "Total Amount" shows expected subscription costs
4. Click "View Details" on a subscription to see the complete financial breakdown
5. Verify "Outstanding" amount = Total - Paid

## Deployment
Changes have been pushed to `merge-superdashboard-into-dev` branch.

To deploy on production server:
```bash
cd ~/urutix-smart-logistics
git pull origin merge-superdashboard-into-dev
docker-compose -f docker-compose.production.yml up -d --build
```
