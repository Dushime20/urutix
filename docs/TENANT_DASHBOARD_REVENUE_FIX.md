# Tenant Dashboard Revenue Fix

## Issue

The tenant dashboard endpoint `/api/tenant-dashboard/{tenantId}/summary` was showing `totalRevenue: 0` even though the tenant admin had earned $1000 from partner plan sales.

## Root Cause

The `getTenantMetrics()` method in `TenantDashboardService` was only calculating revenue from **operational payments** (cargo shipments), not from **partner plan sales**.

```typescript
// OLD CODE - Only operational revenue
const totalRevenue = payments.reduce(
  (sum, payment) => sum + (payment.amount || 0),
  0,
);
```

Since there were no completed cargo shipment payments yet, `totalRevenue` was 0.

## Solution

Updated the `getTenantMetrics()` method to include both:
1. **Operational Revenue**: From cargo shipment payments
2. **Partner Sales Revenue**: From truck owners purchasing partner plans

```typescript
// NEW CODE - Both operational and partner sales revenue
const operationalRevenue = payments.reduce(
  (sum, payment) => sum + (payment.amount || 0),
  0,
);
const partnerSalesRevenue = tenantCreditAccount 
  ? Number(tenantCreditAccount.revenueFromPartnerSales) 
  : 0;
const totalRevenue = operationalRevenue + partnerSalesRevenue;
```

## Implementation Details

### 1. Added CreditAccount Repository

**File**: `backend/src/modules/tenant-dashboard/tenant-dashboard.service.ts`

Added import:
```typescript
import { CreditAccount } from '../../entities/credit-account.entity';
```

Added to constructor:
```typescript
@InjectRepository(CreditAccount)
private readonly creditAccountRepository: Repository<CreditAccount>,
```

### 2. Updated getTenantMetrics Method

Fetches tenant-level credit account to get partner sales revenue:
```typescript
// Get tenant-level credit account for partner sales revenue
const tenantCreditAccount = await this.creditAccountRepository.findOne({
  where: {
    tenantId,
    userId: null, // Tenant-level account
  },
});
```

Calculates total revenue from both sources:
```typescript
const operationalRevenue = payments.reduce(
  (sum, payment) => sum + (payment.amount || 0),
  0,
);
const partnerSalesRevenue = tenantCreditAccount 
  ? Number(tenantCreditAccount.revenueFromPartnerSales) 
  : 0;
const totalRevenue = operationalRevenue + partnerSalesRevenue;
```

### 3. Updated Module Imports

**File**: `backend/src/modules/tenant-dashboard/tenant-dashboard.module.ts`

Added `CreditAccount` to TypeORM imports:
```typescript
TypeOrmModule.forFeature([
  Load, Truck, User, Trip, Payment, Bid, 
  CreditAccount,  // Added
  EmailTemplate, BulkEmailLog, Tenant
]),
```

## Revenue Breakdown

### Operational Revenue
- Source: Payments from cargo shipments
- Status: Completed payments only
- Current: $0 (no shipments completed yet)

### Partner Sales Revenue
- Source: Truck owners purchasing partner plans
- Tracked in: Tenant-level credit account
- Current: $1000 (1 truck owner × 1000 credits × $1/credit)

### Total Revenue
- Formula: `operationalRevenue + partnerSalesRevenue`
- Current: $0 + $1000 = $1000

## Expected API Response

### Before Fix
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalRevenue": 0,  // ❌ Wrong
      "totalShipments": 0,
      "activeTrucks": 0,
      ...
    }
  }
}
```

### After Fix
```json
{
  "success": true,
  "data": {
    "metrics": {
      "totalRevenue": 1000,  // ✅ Correct
      "totalShipments": 0,
      "activeTrucks": 0,
      ...
    }
  }
}
```

## Testing

1. **Login as Tenant Admin** (tenantadmin@demo.com)
2. **Call Dashboard API**:
   ```
   GET /api/tenant-dashboard/3174d68f-cb7d-4428-b578-e931d1a3f464/summary?timeRange=7d
   ```
3. **Verify Response**:
   - `totalRevenue` should be 1000 (not 0)
   - This includes $1000 from partner plan sales

4. **Test with More Sales**:
   - Have another truck owner purchase a partner plan
   - `totalRevenue` should increase to 2000

5. **Test with Operational Revenue**:
   - Complete a cargo shipment with payment
   - `totalRevenue` should include both partner sales + shipment payment

## Files Modified

1. `backend/src/modules/tenant-dashboard/tenant-dashboard.service.ts`
   - Added CreditAccount import
   - Added creditAccountRepository to constructor
   - Updated getTenantMetrics() to include partner sales revenue

2. `backend/src/modules/tenant-dashboard/tenant-dashboard.module.ts`
   - Added CreditAccount to TypeORM imports

## Benefits

1. **Accurate Revenue Tracking**: Dashboard now shows all revenue sources
2. **Business Insights**: Tenant admins can see revenue from partner plan sales
3. **Complete Picture**: Combines operational and partner sales revenue
4. **Real-time Updates**: Revenue updates automatically when partners purchase plans

## Future Enhancements

Consider adding separate metrics for:
- `operationalRevenue`: Revenue from cargo shipments
- `partnerSalesRevenue`: Revenue from partner plan sales
- `totalRevenue`: Combined revenue

This would provide more detailed insights into revenue sources.
