# Tenants Endpoint - onboardingStep Column Fix

## Issue
The `/api/tenants` and `/api/admin/tenant-management` endpoints were returning 500 errors with the message:
```
column tenant.onboardingStep does not exist
```

## Root Cause
The `onboardingStep` column was missing from the `tenants` table in the database, even though it was defined in the Tenant entity (`backend/src/entities/tenant.entity.ts`).

The entity expected:
```typescript
@Column({ type: 'integer', default: 1 })
onboardingStep: number;
```

But the database table did not have this column.

## Solution

### 1. Created Migration
Created migration file: `backend/migrations/027_add_onboarding_step_column.sql`

```sql
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS "onboardingStep" INTEGER DEFAULT 1;

UPDATE tenants 
SET "onboardingStep" = 1
WHERE "onboardingStep" IS NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_onboarding_step ON tenants("onboardingStep");
```

### 2. Ran Migration
Executed the migration using `backend/run-migration.js`:
```bash
node run-migration.js
```

Result:
- Column added successfully as INTEGER type
- Default value set to 1
- Index created for efficient querying
- All existing tenants updated with default value

### 3. Verified Schema
Created verification script `backend/verify-tenant-columns.js` to confirm:
- All 41 expected columns exist in the database
- `onboardingStep` column is type INTEGER with default value 1
- SELECT queries work correctly

## Testing

### Verification Scripts Created
1. `backend/check-tenant-schema.js` - Checks onboarding columns and enum types
2. `backend/run-migration.js` - Runs the migration and verifies column creation
3. `backend/verify-tenant-columns.js` - Comprehensive column verification

### Test Results
```
✅ Found 41 columns in database
✅ All expected columns exist!
✅ onboardingStep column details:
  - Type: integer
  - Nullable: YES
  - Default: 1
✅ Query successful! Sample data:
  - ID: 797356c8-dcb6-48ab-9969-e0b373dde1ae
  - Name: Uruti-X Default
  - onboardingStep: 1
```

## Next Steps

### Required Action
**RESTART THE BACKEND SERVER** for the changes to take effect:
```bash
# Stop the current backend process
# Then restart it
cd backend
npm start
```

### Endpoints to Test
After restarting the backend, test these endpoints:

1. **Get All Tenants** (Admin)
   ```
   GET http://localhost:3005/api/admin/tenant-management
   Headers: Authorization: Bearer <admin_token>
   ```
   Expected: 200 OK with list of tenants including onboardingStep

2. **Get Tenants** (General)
   ```
   GET http://localhost:3005/api/tenants
   Headers: Authorization: Bearer <token>
   ```
   Expected: 200 OK with tenant data

## Files Modified
- `backend/migrations/027_add_onboarding_step_column.sql` (created)
- `backend/run-migration.js` (created)
- `backend/check-tenant-schema.js` (created)
- `backend/verify-tenant-columns.js` (created)

## Database Changes
- Added `onboardingStep` column to `tenants` table
- Type: INTEGER
- Default: 1
- Nullable: YES
- Index: `idx_tenants_onboarding_step`

## Notes
- The column uses camelCase (`onboardingStep`) to match TypeORM entity conventions
- All existing tenants were updated with default value 1
- The column is nullable to allow for flexibility
- An index was added for query performance

## Related Issues
- Previous error: "column tenant.onboardingStep does not exist"
- Affected endpoints: `/api/tenants`, `/api/admin/tenant-management`
- Related to Task 7 in context transfer

## Status
✅ Migration completed successfully
✅ Column verified in database
⏳ Awaiting backend restart to test endpoints
