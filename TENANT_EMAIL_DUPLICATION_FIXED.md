# Tenant Email Duplication Issue - FIXED

## Problem
The admin dashboard was showing duplicate tenants with the same email address. Investigation revealed:
- 7 tenants with email `isdeborah47@gmail.com`
- 2 tenants with email `dkubui@gmail.com`
- Total of 13 tenants in database, but 9 duplicates

## Root Cause
The `tenants` table had no unique constraint on the `contactEmail` column, allowing multiple tenants to be created with the same email address.

## Solution Implemented

### 1. Database Migration
**File**: `urutix/backend/migrations/017_add_unique_constraint_tenant_email.sql`

The migration:
- Identifies all duplicate emails
- Keeps the best tenant for each email (prefers ACTIVE status, then most recent)
- Marks duplicates by appending `_duplicate_<id>` to their email
- Adds a UNIQUE constraint to prevent future duplicates
- Creates an index for better query performance

### 2. Entity Update
**File**: `urutix/backend/src/entities/tenant.entity.ts`

Added `unique: true` to the `contactEmail` column:
```typescript
@Column({ nullable: true, unique: true })
contactEmail?: string;
```

### 3. Backend Validation
**File**: `urutix/backend/src/services/tenant-management.service.ts`

Added validation in `updateTenant` method to check for duplicate emails before updating:
```typescript
if (updates.contactEmail !== undefined && updates.contactEmail !== tenant.contactEmail) {
  const existingTenant = await this.tenantRepository.findOne({
    where: { contactEmail: updates.contactEmail },
  });
  
  if (existingTenant && existingTenant.id !== tenantId) {
    throw new BadRequestException(
      `A tenant with email ${updates.contactEmail} already exists`
    );
  }
}
```

### 4. Frontend Deduplication
**File**: `urutix/frontend/src/pages/AdminTenants.tsx`

Added client-side deduplication logic that:
- Groups tenants by email (case-insensitive)
- Keeps only the best tenant per email (prefers ACTIVE, then most recent)
- Logs how many duplicates were removed

This provides immediate relief while the database is being cleaned up.

## How to Apply the Fix

### Step 1: Run the Migration
```bash
cd urutix/backend
node run-unique-email-migration.js
```

This will:
- Mark duplicate emails with `_duplicate_<id>` suffix
- Add the unique constraint
- Show which tenants need manual review

### Step 2: Review Marked Duplicates
The script will list all tenants marked as duplicates. For each:
1. Decide if the tenant should be kept or deleted
2. If keeping, update with a unique email
3. If deleting, use the admin dashboard to deactivate

### Step 3: Restart Backend
```bash
npm run start:dev
```

The entity changes will be picked up automatically.

### Step 4: Clear Frontend Cache
Users should clear their browser cache or do a hard refresh (Ctrl+Shift+R) to see the deduplicated list.

## Files Created

1. `urutix/backend/check-duplicate-tenant-emails.js` - Diagnostic script
2. `urutix/backend/migrations/017_add_unique_constraint_tenant_email.sql` - Migration
3. `urutix/backend/run-unique-email-migration.js` - Migration runner
4. `urutix/TENANT_EMAIL_DUPLICATION_FIXED.md` - This documentation

## Files Modified

1. `urutix/backend/src/entities/tenant.entity.ts` - Added unique constraint
2. `urutix/backend/src/services/tenant-management.service.ts` - Added validation
3. `urutix/frontend/src/pages/AdminTenants.tsx` - Added deduplication logic

## Testing

### Test Duplicate Prevention
```bash
# Try to create two tenants with same email
# Should fail on the second attempt
```

### Verify Constraint
```bash
cd urutix/backend
node check-duplicate-tenant-emails.js
```

Should show no duplicates (except those marked with `_duplicate_` suffix).

## Manual Cleanup Required

After running the migration, you'll need to manually review and update tenants with emails like:
- `isdeborah47@gmail.com_duplicate_<id>`
- `dkubui@gmail.com_duplicate_<id>`

Options:
1. Update with correct unique email
2. Deactivate if it's a true duplicate
3. Merge data into the kept tenant if needed

## Prevention

Going forward:
- Database constraint prevents duplicate emails at DB level
- Entity validation prevents duplicates at application level
- Backend validation provides clear error messages
- Frontend deduplication handles any edge cases

## Status
✅ **COMPLETE** - Duplicate tenant emails are now prevented and existing duplicates are handled gracefully.
