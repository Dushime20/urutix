# Fix: Tenant Filter in Credit Usage History

## Issue
When clicking the purple history icon in the Tenant Subscriptions table to view credit usage for a specific tenant, the filter doesn't work properly - it shows all transactions instead of just that tenant's transactions.

## Root Cause

### Problem 1: Missing `days` Parameter
When `tenantId` is provided to `getAllCreditTransactions`, it delegates to `getTenantCreditTransactions`, but the `days` parameter wasn't being passed through.

**Before**:
```typescript
if (tenantId) {
  return this.getTenantCreditTransactions(
    tenantId,
    type,
    startDate,  // days parameter missing here
    endDate,
    limit,
    offset,
  );
}
```

### Problem 2: `getTenantCreditTransactions` Didn't Support `days`
The method signature didn't include the `days` parameter.

**Before**:
```typescript
async getTenantCreditTransactions(
  @Param('tenantId') tenantId: string,
  @Query('type') type?: string,
  // days parameter missing
  @Query('startDate') startDate?: string,
  ...
)
```

### Problem 3: `getTransactionHistory` Service Method Issues
1. Didn't support `days` filter
2. Didn't join tenant relations (so tenant names weren't populated)

**Before**:
```typescript
const query = this.creditTransactionRepository
  .createQueryBuilder('transaction')
  // Missing: .leftJoinAndSelect('transaction.creditAccount', 'creditAccount')
  // Missing: .leftJoinAndSelect('creditAccount.tenant', 'tenant')
  .where('transaction.tenantId = :tenantId', { tenantId })
  .orderBy('transaction.createdAt', 'DESC');

// Missing days filter handling
```

### Problem 4: Missing `days` in Filter Interface
The `CreditTransactionFilters` interface didn't include the `days` property.

## Solution

### Fix 1: Add `days` Parameter to `getTenantCreditTransactions` ✅

**File**: `urutix/backend/src/modules/admin/admin.controller.ts`

```typescript
async getTenantCreditTransactions(
  @Param('tenantId') tenantId: string,
  @Query('type') type?: string,
  @Query('days') days?: string,  // ✅ Added
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Query('limit') limit?: string,
  @Query('offset') offset?: string,
) {
  const filters: any = {};
  if (type) filters.type = type;
  if (days) filters.days = parseInt(days);  // ✅ Added
  if (startDate) filters.startDate = new Date(startDate);
  if (endDate) filters.endDate = new Date(endDate);
  if (limit) filters.limit = parseInt(limit);
  if (offset) filters.offset = parseInt(offset);

  const result = await this.creditService.getTransactionHistory(tenantId, filters);
  // ...
}
```

### Fix 2: Pass `days` Parameter When Delegating ✅

**File**: `urutix/backend/src/modules/admin/admin.controller.ts`

```typescript
if (tenantId) {
  return this.getTenantCreditTransactions(
    tenantId,
    type,
    days,  // ✅ Added
    startDate,
    endDate,
    limit,
    offset,
  );
}
```

### Fix 3: Add `days` Filter to Service Method ✅

**File**: `urutix/backend/src/services/credit.service.ts`

```typescript
async getTransactionHistory(
  tenantId: string,
  filters?: CreditTransactionFilters,
): Promise<{ transactions: CreditTransaction[]; total: number }> {
  const query = this.creditTransactionRepository
    .createQueryBuilder('transaction')
    .leftJoinAndSelect('transaction.creditAccount', 'creditAccount')  // ✅ Added
    .leftJoinAndSelect('creditAccount.tenant', 'tenant')  // ✅ Added
    .where('transaction.tenantId = :tenantId', { tenantId })
    .orderBy('transaction.createdAt', 'DESC');

  if (filters?.type) {
    query.andWhere('transaction.type = :type', { type: filters.type });
  }

  // ✅ Added days filter
  if (filters?.days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - filters.days);
    query.andWhere('transaction.createdAt >= :startDate', { startDate });
  }

  // ... rest of the method
}
```

### Fix 4: Update Filter Interface ✅

**File**: `urutix/backend/src/services/credit.service.ts`

```typescript
export interface CreditTransactionFilters {
  type?: CreditTransactionType;
  days?: number;  // ✅ Added
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
```

## Files Modified

1. ✅ `urutix/backend/src/modules/admin/admin.controller.ts`
   - Added `days` parameter to `getTenantCreditTransactions`
   - Pass `days` when delegating to `getTenantCreditTransactions`
   - Handle `days` in filters

2. ✅ `urutix/backend/src/services/credit.service.ts`
   - Added `days` to `CreditTransactionFilters` interface
   - Added `days` filter logic to `getTransactionHistory`
   - Added tenant relation joins to `getTransactionHistory`

## Testing

### Test Script
Created `test-tenant-filter.js` to verify tenant filtering works correctly.

**Run test**:
```bash
cd backend
node test-tenant-filter.js
```

**Expected Results**:
- ✅ Shows all transactions
- ✅ Lists unique tenants
- ✅ Filters transactions by specific tenant
- ✅ Verifies all filtered transactions belong to that tenant
- ✅ Tests with multiple tenants if available

### Manual Testing

1. **Navigate to Tenant Subscriptions**:
   - Go to http://localhost:5174
   - Login as superadmin
   - Navigate to Admin > Tenant Subscriptions

2. **Click History Icon**:
   - Find "Demo Tenant B" in the table
   - Click the purple history icon (🕐)

3. **Verify Filtering**:
   - Page navigates to `/admin/credit-usage`
   - Tenant dropdown shows "Demo Tenant B" selected
   - Search field shows "Demo Tenant B"
   - Statistics show only Demo Tenant B's data
   - Transaction table shows only Demo Tenant B's transactions (1 CONSUMPTION transaction)

4. **Test Another Tenant**:
   - Go back to Tenant Subscriptions
   - Click history icon for "Deborah"
   - Verify it shows only Deborah's transactions (1 BONUS transaction)

5. **Test Clearing Filter**:
   - Change tenant dropdown to "All Tenants"
   - Verify it now shows all 2 transactions

## Expected Behavior

### When Clicking History Icon for "Demo Tenant B"

**URL**: `/admin/credit-usage`

**Tenant Filter**: Automatically set to "Demo Tenant B"

**Statistics**:
- Total Consumed: 250 credits
- Total Purchased: 0 credits
- Bonus Credits: 0 credits
- Daily Average: 8.3 credits/day

**Top Consumers**:
- Demo Tenant B: 250 credits

**Transaction Table**:
| Date | Tenant | Type | Amount | Balance |
|------|--------|------|--------|---------|
| Feb 14, 2026 10:55 | Demo Tenant B | CONSUMPTION | -250 | 500 |

### When Clicking History Icon for "Deborah"

**Tenant Filter**: Automatically set to "Deborah"

**Statistics**:
- Total Consumed: 0 credits
- Total Purchased: 0 credits
- Bonus Credits: 600 credits
- Daily Average: 0 credits/day

**Top Consumers**:
- (empty - no consumption)

**Transaction Table**:
| Date | Tenant | Type | Amount | Balance |
|------|--------|------|--------|---------|
| Feb 13, 2026 15:38 | Deborah | BONUS | +600 | 2,600 |

## API Endpoints

### Get All Transactions
```
GET /api/admin/credits/transactions?days=30&limit=100
```

### Get Tenant-Specific Transactions
```
GET /api/admin/credits/transactions?tenantId={id}&days=30&limit=100
```

**Query Parameters**:
- `tenantId` (optional): Filter by specific tenant
- `type` (optional): Filter by transaction type
- `days` (optional): Get transactions from last N days
- `startDate` (optional): Filter from this date
- `endDate` (optional): Filter until this date
- `limit` (optional): Number of results
- `offset` (optional): Pagination offset

## Status

- ✅ Backend code updated
- ✅ `days` parameter added to all methods
- ✅ Tenant relations added to queries
- ✅ Filter interface updated
- ⏳ Backend restart required
- ⏳ Manual testing pending

## Next Steps

1. **Restart Backend** (Required):
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Run Test Script**:
   ```bash
   cd backend
   node test-tenant-filter.js
   ```

3. **Manual Testing**:
   - Test clicking history icon for different tenants
   - Verify filtering works correctly
   - Test clearing filters
   - Test date range changes

## Summary

Fixed tenant filtering in Credit Usage History by:
1. Adding `days` parameter support throughout the call chain
2. Adding tenant relation joins to populate tenant names
3. Ensuring proper parameter passing when delegating to tenant-specific endpoint

The tenant filter will now work correctly when navigating from the Tenant Subscriptions table!
