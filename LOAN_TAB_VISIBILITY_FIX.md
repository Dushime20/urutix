# Loan Requests Tab Visibility Fix

## Issue
The "Loan Requests" tab was visible in the Fleet Dashboard's Financial section for truck owners, but only cargo owners should be able to request loans from lenders.

## Solution
Updated the tab visibility logic in `UnifiedFinancialManagement.tsx` to check the **user's role** instead of the URL path. The "Loan Requests" tab now only shows for:
- ✅ Cargo Owners (`user.role === 'CARGO_OWNER'`)
- ✅ Lenders (`user.role === 'LENDER'`)
- ❌ Truck Owners/Fleet Owners - **HIDDEN**

## Changes Made

**File**: `frontend/src/pages/dashboard/financial/UnifiedFinancialManagement.tsx`

### Key Changes:
1. **Added `useAuth` hook import** to access user role
2. **Changed visibility logic** from path-based to role-based checking

### Before:
```typescript
// Path-based checking (INCORRECT - doesn't work for all routes)
...((location.pathname.includes("/cargo-owner") || location.pathname.includes("/lender")) ? [{
  id: "loans" as TabType,
  label: "Loan Requests",
  icon: DollarSign,
  description: "Manage cargo-based loan requests",
}] : []),
```

### After:
```typescript
// Role-based checking (CORRECT - works regardless of route)
...((user?.role === 'CARGO_OWNER' || user?.role === 'LENDER') ? [{
  id: "loans" as TabType,
  label: "Loan Requests",
  icon: DollarSign,
  description: "Manage cargo-based loan requests",
}] : []),
```

## Why Role-Based is Better

### Path-Based Issues:
- ❌ Cargo owners accessing `/dashboard/financial` wouldn't see the tab
- ❌ Different routes for same user role caused inconsistency
- ❌ Hard to maintain as routes change

### Role-Based Benefits:
- ✅ Works on any route (`/dashboard/financial`, `/cargo-owner/financial`, etc.)
- ✅ Consistent behavior based on user permissions
- ✅ Easier to maintain and understand
- ✅ Aligns with backend role-based access control

## Tab Visibility Matrix

| Tab | Cargo Owner | Truck Owner (Fleet) | Lender | General Dashboard |
|-----|-------------|---------------------|--------|-------------------|
| Overview | ✅ | ✅ | ✅ | ✅ |
| Payments | ✅ | ✅ | ✅ | ✅ |
| Expenses | ✅ | ✅ | ✅ | ✅ |
| Payment | ✅ | ❌ | ❌ | ❌ |
| Cost Analysis | ❌ | ✅ | ❌ | ❌ |
| Payment Methods | ✅ | ✅ | ✅ | ❌ |
| **Loan Requests** | **✅** | **❌** | **✅** | **❌** |

## Business Logic Enforced

### Cargo Owners Can:
- ✅ View loan requests tab (on any financial route)
- ✅ Request loans from lenders
- ✅ View their loan history
- ✅ Make repayments

### Truck Owners Cannot:
- ❌ See loan requests tab (on any route)
- ❌ Request loans (business rule: only cargo owners can request)
- ✅ Still receive payments from lenders (when cargo owner's loan is approved)

### Lenders Can:
- ✅ View loan requests tab (on any financial route)
- ✅ See all loan requests assigned to them
- ✅ Approve/reject loan requests
- ✅ Track loan repayments

## Testing

### Test Case 1: Truck Owner (Fleet Dashboard)
1. Login as truck owner (role: `TRUCK_OWNER` or `FLEET_OWNER`)
2. Navigate to `/dashboard/fleet/financial`
3. **Expected**: "Loan Requests" tab should NOT be visible
4. **Visible tabs**: Overview, Payments, Expenses, Cost Analysis, Payment Methods

### Test Case 2: Cargo Owner (Dashboard)
1. Login as cargo owner (role: `CARGO_OWNER`)
2. Navigate to `/dashboard/financial`
3. **Expected**: "Loan Requests" tab SHOULD be visible
4. **Visible tabs**: Overview, Payments, Expenses, Payment Methods, Loan Requests

### Test Case 3: Cargo Owner (Cargo Owner Route)
1. Login as cargo owner (role: `CARGO_OWNER`)
2. Navigate to `/cargo-owner/financial`
3. **Expected**: "Loan Requests" tab SHOULD be visible
4. **Visible tabs**: Overview, Payments, Expenses, Payment, Payment Methods, Loan Requests

### Test Case 4: Lender
1. Login as lender (role: `LENDER`)
2. Navigate to `/lender/financial` or `/dashboard/financial`
3. **Expected**: "Loan Requests" tab SHOULD be visible
4. **Visible tabs**: Overview, Payments, Expenses, Payment Methods, Loan Requests

## Related Files

- `frontend/src/pages/dashboard/financial/UnifiedFinancialManagement.tsx` - Main file updated
- `frontend/src/contexts/AuthContext.tsx` - Provides user role via useAuth hook
- `frontend/src/pages/EnhancedLoanRequestsPage.tsx` - Loan requests page (unchanged)
- `backend/src/modules/loans/loans.service.ts` - Backend validation (already enforces cargo owner only)

## Backend Validation

The backend already enforces this business rule:

```typescript
// Only cargo owners can create loan requests
if (user.role !== UserRole.CARGO_OWNER) {
  throw new ForbiddenException('Only cargo owners can request loans');
}
```

This frontend change provides better UX by hiding the tab entirely for users who cannot use it.

## Impact

- ✅ Improved UX - Truck owners won't see a tab they can't use
- ✅ Clearer interface - Only relevant tabs shown per role
- ✅ Consistent with business rules - Only cargo owners request loans
- ✅ Works on all routes - Role-based checking is route-agnostic
- ✅ No breaking changes - Existing functionality preserved
- ✅ Backend validation still in place - Double layer of security

## Status

✅ **COMPLETE** - Loan Requests tab is now properly hidden from truck owners based on user role

**Date**: April 24, 2026

**Tested**: No TypeScript errors

**Fix Applied**: Changed from path-based to role-based visibility checking
