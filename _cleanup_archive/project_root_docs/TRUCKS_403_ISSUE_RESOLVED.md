# Trucks 403 Forbidden Error - RESOLVED ✅

## Problem Summary
Truck owner users were getting a 403 Forbidden error when trying to access the trucks endpoint, even though they had the `truck:view` permission assigned to their role.

## Root Cause Analysis

### Issue 1: Permission Name Format Mismatch
**The Core Problem**: The permissions table had inconsistent naming conventions:
- Some permissions used human-readable names like "View Trucks"
- Some permissions used resource:action format like "cargo:create"
- The `@RequirePermissions` decorator was using resource:action format like `truck:view`
- The `PermissionService.getRolePermissions()` method was querying the `name` column, which returned "View Trucks" instead of "truck:view"
- The permission check failed because "View Trucks" ≠ "truck:view"

### Issue 2: Database Column Name Mismatch (Already Fixed)
- Fleet service was checking `truck.deletedAt` (camelCase) but database column is `deleted_at` (snake_case)
- Fixed by changing to `.andWhere('truck.deleted_at IS NULL')`

### Issue 3: JWT Token Property Mismatch (Already Fixed)
- JWT strategy was setting `user.id` but PermissionsGuard expected `user.userId`
- Fixed by setting both `user.id` and `user.userId` in JWT strategy

## Solution Implemented

### Fix: Updated PermissionService to Use resource:action Format

Modified `urutix/backend/src/services/permissionService.ts`:

1. **Added helper method** `getPermissionIdByName()`:
   - Converts permission names from resource:action format to permission IDs
   - Handles both "resource:action" and fallback to name column

2. **Updated `getRolePermissions()` method**:
   - Changed from: `SELECT p.name FROM permissions p ...`
   - Changed to: `SELECT p.resource, p.action FROM permissions p ...`
   - Returns permissions as `${resource}:${action}` format

3. **Updated `getUserSpecificPermissions()` method**:
   - Changed from: `SELECT p.name ...`
   - Changed to: `SELECT p.resource, p.action ...`
   - Constructs permission names as `${resource}:${action}`

4. **Updated SUPER_ADMIN permissions**:
   - Changed from: `SELECT name FROM permissions ...`
   - Changed to: `SELECT resource, action FROM permissions ...`
   - Returns all permissions in resource:action format

5. **Updated all permission lookup methods**:
   - `grantRolePermission()` - Uses new helper
   - `revokeRolePermission()` - Uses new helper
   - `grantUserPermission()` - Uses new helper
   - `revokeUserPermission()` - Uses new helper
   - `denyUserPermission()` - Uses new helper

## Verification

### Test Results
✅ **Login**: Truck owner successfully logs in
✅ **JWT Token**: Contains all 14 permissions including `truck:view`
✅ **Permission Check**: PermissionService correctly identifies `truck:view` permission
✅ **Trucks Endpoint**: Returns trucks without 403 error
✅ **Data**: Truck owner can see their trucks

### Test Command
```bash
node urutix/backend/test-trucks-fix-verification.js
```

### Expected Output
```
✅ Login successful!
✅ Trucks fetched successfully!
✅ TEST PASSED: Trucks endpoint is working correctly!
```

## Files Modified

1. **urutix/backend/src/services/permissionService.ts**
   - Added `getPermissionIdByName()` helper method
   - Updated `getRolePermissions()` to use resource:action format
   - Updated `getUserSpecificPermissions()` to use resource:action format
   - Updated SUPER_ADMIN permission query
   - Updated all permission lookup methods to use helper

2. **urutix/backend/src/modules/fleet/fleet.service.ts** (Previously Fixed)
   - Changed `truck.deletedAt IS NULL` to `truck.deleted_at IS NULL`

3. **urutix/backend/src/modules/auth/jwt.strategy.ts** (Previously Fixed)
   - Added `userId` property to JWT user object

## Deployment Steps

1. **Build the backend**:
   ```bash
   npm run build --prefix urutix/backend
   ```

2. **Restart the backend**:
   ```bash
   # Kill all node processes
   Get-Process node | Stop-Process -Force
   
   # Start backend
   npm run start:dev --prefix urutix/backend
   ```

3. **Clear browser cache**:
   - Open browser console (F12)
   - Run: `localStorage.clear(); sessionStorage.clear();`
   - Log out and log back in

4. **Test the fix**:
   ```bash
   node urutix/backend/test-trucks-fix-verification.js
   ```

## Summary

The 403 Forbidden error was caused by a permission name format mismatch in the PermissionService. The service was returning human-readable permission names from the database, but the permission guard was checking for resource:action format names. By updating the PermissionService to construct permission names in the resource:action format, the permission check now works correctly and truck owners can access their trucks without errors.

**Status**: ✅ RESOLVED - Truck owners can now successfully view their trucks
