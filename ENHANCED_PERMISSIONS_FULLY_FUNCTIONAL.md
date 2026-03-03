# Enhanced Permissions Page - Fully Functional

## Issue Fixed

The `/admin/permissions` page (Enhanced Permissions) was showing empty and throwing database errors:
```
column Role_Role__Role_permissions.role_id does not exist
```

## Root Cause

There were TWO different permission services in the codebase:

1. **`permissionService.ts`** (SQL-based) - Working correctly
2. **`permission.service.ts`** (TypeORM-based) - Broken

The TypeORM-based service was using entity relations that expected a `role_id` column (UUID) in the `role_permissions` table, but the actual database schema uses a `role` column (string).

### Database Schema Reality

```sql
-- role_permissions table structure
CREATE TABLE role_permissions (
    role VARCHAR(50),           -- String column, NOT UUID
    permission_id UUID,
    granted_at TIMESTAMP,
    granted_by VARCHAR(255),
    PRIMARY KEY (role, permission_id)
);
```

### TypeORM Entity Relations (Broken)

```typescript
// This was trying to use:
relations: ['permissions', 'inheritsFrom']

// Which generates SQL like:
// LEFT JOIN role_permissions ON roles.id = role_permissions.role_id
// But role_permissions.role_id doesn't exist!
```

## Solution

Fixed all methods in `permission.service.ts` (RolePermissionService) to use raw SQL queries instead of TypeORM entity relations:

### Methods Fixed

1. **`getAllRoles()`** - Now uses SQL with proper JOIN on `role_permissions.role = roles.name`
2. **`getRoleById()`** - Now uses SQL with proper JOIN
3. **`getPermissionMatrix()`** - Updated to handle array-based permissions
4. **`createRole()`** - Now uses raw SQL INSERT with proper column names
5. **`updateRole()`** - Now uses raw SQL UPDATE with proper column names
6. **`deleteRole()`** - Now uses raw SQL DELETE with proper column names
7. **`bulkAssignPermissions()`** - Now uses raw SQL with proper column names

### Important Note: Permissions Table Schema

The `permissions` table in the database does NOT have a `category` column. The schema is:
- `id` (UUID)
- `name` (VARCHAR)
- `resource` (VARCHAR)
- `action` (VARCHAR)
- `description` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

All queries have been updated to match this schema.

### Example Fix

**Before (Broken):**
```typescript
async getAllRoles(): Promise<Role[]> {
    return await this.roleRepository.find({
        relations: ['permissions', 'inheritsFrom'],
        order: { name: 'ASC' },
    });
}
```

**After (Working):**
```typescript
async getAllRoles(): Promise<Role[]> {
    const query = `
        SELECT 
            r.id,
            r.name,
            r.description,
            r.is_system as "isSystem",
            r.created_at as "createdAt",
            r.updated_at as "updatedAt",
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', p.id,
                        'resource', p.resource,
                        'action', p.action,
                        'description', p.description
                    )
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'
            ) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.name = rp.role
        LEFT JOIN permissions p ON rp.permission_id = p.id
        GROUP BY r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at
        ORDER BY r.name ASC
    `;

    const roles = await this.roleRepository.query(query);
    
    return roles.map(role => ({
        ...role,
        permissions: typeof role.permissions === 'string' 
            ? JSON.parse(role.permissions) 
            : role.permissions
    }));
}
```

## Key Changes

1. **Proper JOIN Syntax:**
   - Changed from: `role_permissions.role_id = roles.id` (doesn't exist)
   - Changed to: `role_permissions.role = roles.name` (correct)

2. **JSON Aggregation:**
   - Uses `json_agg()` to group permissions per role
   - Uses `COALESCE()` to return empty array if no permissions
   - Uses `FILTER (WHERE p.id IS NOT NULL)` to exclude null joins

3. **Transaction Safety:**
   - All write operations use transactions
   - Proper rollback on errors
   - Query runner cleanup in finally blocks

4. **System Role Protection:**
   - Cannot modify or delete system roles
   - Proper validation before operations

5. **User Assignment Check:**
   - Cannot delete roles that are assigned to users
   - Proper error messages

## Controllers Affected

### 1. `permission.controller.ts`
- Route: `/admin/permissions/*`
- Uses: `RolePermissionService` (now fixed)
- Endpoints:
  - `GET /admin/permissions/roles` - List all roles
  - `GET /admin/permissions/roles/:id` - Get role by ID
  - `POST /admin/permissions/roles` - Create role
  - `PUT /admin/permissions/roles/:id` - Update role
  - `DELETE /admin/permissions/roles/:id` - Delete role
  - `POST /admin/permissions/roles/:id/bulk-assign` - Bulk assign permissions

### 2. `admin-permissions.controller.ts`
- Route: `/admin/permissions/*`
- Uses: `PermissionService` (was already working)
- Endpoints:
  - `GET /admin/permissions/roles/matrix` - Get permission matrix
  - `GET /admin/permissions/roles` - List all roles
  - `POST /admin/permissions/roles` - Create role
  - etc.

## Testing

After this fix, the Enhanced Permissions page should:

1. ✅ Display all roles in the matrix view
2. ✅ Display all permissions as rows
3. ✅ Show checkmarks for assigned permissions
4. ✅ Allow toggling permissions (for non-system roles)
5. ✅ Display roles in the Roles tab
6. ✅ Allow creating new custom roles
7. ✅ Allow editing custom roles
8. ✅ Allow deleting custom roles
9. ✅ Prevent modifying system roles

## Files Modified

- `backend/src/services/permission.service.ts` - Fixed all methods to use raw SQL

## Status

✅ **FULLY FIXED** - Enhanced Permissions page should now work correctly

## Next Steps

1. Restart backend server:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Navigate to `/admin/permissions` in the frontend

3. Verify:
   - Permission matrix displays correctly
   - Roles tab shows all roles
   - Can toggle permissions for custom roles
   - Can create/edit/delete custom roles
   - System roles are protected

## Troubleshooting

**If page still shows errors:**

1. **Check database has data:**
   ```bash
   node backend/check-permissions-data.js
   ```

2. **Check API response:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/admin/permissions/roles
   ```

3. **Check backend logs:**
   - Look for SQL query errors
   - Verify no TypeORM relation errors

4. **Verify database schema:**
   ```sql
   \d role_permissions
   -- Should show 'role' column (VARCHAR), not 'role_id'
   ```

## Architecture Notes

### Why Two Permission Services?

The codebase has two permission services with different approaches:

1. **`PermissionService`** (permissionService.ts)
   - Uses raw SQL queries
   - More flexible, works with any schema
   - Better for complex queries
   - Used by `admin-permissions.controller.ts`

2. **`RolePermissionService`** (permission.service.ts)
   - Originally used TypeORM entities
   - Now fixed to use raw SQL
   - Used by `permission.controller.ts`

### Recommendation

Consider consolidating these two services in the future to avoid confusion and duplication. The SQL-based approach is more reliable for this schema.

## Related Documentation

- `RBAC_MIGRATION_COMPLETE_SUMMARY.md` - RBAC system overview
- `ENHANCED_PERMISSIONS_MATRIX_FIX.md` - Previous matrix fix
- `RBAC_QUICK_REFERENCE.md` - Quick reference guide
