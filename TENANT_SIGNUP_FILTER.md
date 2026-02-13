# Tenant Signup Filter - Active Tenants Only

## Summary
Updated the signup/registration page to only show ACTIVE tenants in the company selection dropdown.

## Changes Made

### 1. Auth.tsx - Tenant Filtering Logic
**Location:** `urutix/frontend/src/pages/Auth.tsx`

**What Changed:**
- Modified the `active-tenants` query to filter tenants by status
- Only tenants with status `ACTIVE` or `active` are now shown in the dropdown
- Added console logging to track filtering:
  - Total tenants fetched
  - Active tenants available for signup

**Code:**
```typescript
// Filter to only show ACTIVE tenants
const activeTenants = allTenants.filter((tenant: Tenant) => {
  const status = tenant.status?.toUpperCase();
  return status === 'ACTIVE' || status === 'active';
});
```

### 2. UI Improvements

#### For CARGO_OWNER Users:
- Added "(Active companies only)" label next to the company selection field
- Added empty state message when no active tenants are available:
  - Yellow warning box
  - Message: "No active companies available"
  - Instruction: "Please contact support to activate a company account."

#### For TRUCK_OWNER Users:
- Same improvements as CARGO_OWNER
- Consistent filtering and messaging

### 3. User Experience

**Before:**
- All tenants (active, inactive, pending, suspended) were shown in dropdown
- Users could select inactive tenants and potentially face issues

**After:**
- Only ACTIVE tenants are shown
- Clear indication that only active companies are available
- Helpful message if no active tenants exist
- Better user guidance

## Benefits

1. **Security:** Prevents users from signing up with inactive/suspended tenants
2. **Data Integrity:** Ensures only valid, active tenants can onboard new users
3. **User Experience:** Clear messaging about tenant availability
4. **Admin Control:** Admins can control which tenants are available for signup by managing tenant status

## Testing

To test this feature:

1. **Create a tenant** in admin panel and set status to PENDING or INACTIVE
2. **Go to signup page** - The tenant should NOT appear in dropdown
3. **Activate the tenant** in admin panel (set status to ACTIVE)
4. **Refresh signup page** - The tenant should now appear in dropdown
5. **Suspend the tenant** - It should disappear from signup dropdown

## Related Files

- `urutix/frontend/src/pages/Auth.tsx` - Main signup/login page
- `urutix/frontend/src/pages/AdminTenants.tsx` - Admin tenant management
- `urutix/backend/src/modules/auth/tenant.controller.ts` - Tenant API endpoints

## Status Mapping

The system recognizes these status values as ACTIVE:
- `ACTIVE` (uppercase)
- `active` (lowercase)

All other statuses are filtered out:
- `PENDING_ACTIVATION`
- `SUSPENDED`
- `DEACTIVATED`
- `INACTIVE`

## Future Enhancements

Possible improvements:
1. Add backend API parameter to filter by status (more efficient)
2. Show tenant status badge in admin panel
3. Add bulk tenant activation feature
4. Email notifications when tenant is activated
