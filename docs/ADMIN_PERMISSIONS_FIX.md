# Admin Permissions Fix

## Issue
The ADMIN role user (`admin@urutix.com`) was getting a 403 Forbidden error when accessing `/api/admin/tenant-management`:

```json
{
  "message": "Insufficient permissions. Required one of: admin:view_all_tenants",
  "error": "Forbidden",
  "statusCode": 403
}
```

## Root Cause
The permission system was only checking for `SUPER_ADMIN` role to bypass permission checks, but not for `ADMIN` role, even though `ADMIN` has wildcard permissions `['*']` in the `ROLE_PERMISSION_DEFAULTS`.

## Solution
Updated two files to properly handle ADMIN role permissions:

### 1. `backend/src/utils/permission-helper.ts`
Added checks for:
- `ADMIN` role alongside `SUPER_ADMIN` in all permission methods
- Wildcard (`*`) permission in permission arrays

**Changes:**
```typescript
// Before
if (roleName === 'SUPER_ADMIN') {
    return true;
}

// After
if (roleName === 'SUPER_ADMIN' || roleName === 'ADMIN') {
    return true;
}

// Also added wildcard check
if (rolePermissions.includes('*')) {
    return true;
}
```

### 2. `backend/src/guards/permission.guard.ts`
Added `ADMIN` role check in permission bypass logic:

**Changes:**
```typescript
// Before
if (user.role === 'SUPER_ADMIN') {
  return true;
}

// After
if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
  return true;
}
```

## Affected Methods
The following methods now properly handle ADMIN role:

1. `roleHasPermission()` - Checks if role has a specific permission
2. `roleHasAnyPermission()` - Checks if role has any of the specified permissions
3. `roleHasAllPermissions()` - Checks if role has all specified permissions
4. `PermissionGuard.canActivate()` - Main guard method

## Testing
To verify the fix:

1. Log in as admin:
   - Email: `admin@urutix.com`
   - Password: `Admin@123456`

2. Access tenant management:
   ```
   GET http://localhost:3005/api/admin/tenant-management
   ```

3. Expected result: ✅ 200 OK with tenant data

## Role Permissions Summary

| Role | Permissions | Bypass Check |
|------|-------------|--------------|
| SUPER_ADMIN | `['*']` | ✅ Yes |
| ADMIN | `['*']` | ✅ Yes (Fixed) |
| TENANT_ADMIN | Limited | ❌ No |
| Other Roles | Limited | ❌ No |

## Impact
- ✅ ADMIN users can now access all admin endpoints
- ✅ Tenant management endpoints work for ADMIN role
- ✅ All other admin features accessible
- ✅ No breaking changes to existing functionality
- ✅ Wildcard permissions properly recognized

## Files Modified
1. `backend/src/utils/permission-helper.ts`
2. `backend/src/guards/permission.guard.ts`

## Deployment Notes
- No database migrations required
- No configuration changes needed
- Changes take effect immediately after restart
- Backward compatible with existing permissions

## Related Endpoints
All these endpoints now work for ADMIN role:

- `GET /api/admin/tenant-management` - List all tenants
- `GET /api/admin/tenant-management/:id` - Get tenant details
- `PUT /api/admin/tenant-management/:id` - Update tenant
- `POST /api/admin/tenant-management/:id/status` - Update tenant status
- `GET /api/admin/tenant-management/:id/health` - Get tenant health
- `GET /api/admin/tenant-management/:id/resources` - Get resource usage
- All other admin endpoints with permission guards

## Status
✅ **FIXED** - ADMIN role now has full system access as intended.
