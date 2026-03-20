# Enhanced Permissions Matrix Fix

## Issue

The `/admin/permissions` page (Enhanced Permissions) was showing empty because the backend API was returning data in the wrong format.

## Root Cause

**Backend Method:** `getAllRolePermissionsMatrix()` in `permissionService.ts`

**Before (Incorrect):**
```typescript
async getAllRolePermissionsMatrix(): Promise<Array<{ role: string; permission: string }>> {
    const result = await this.dataSource.query(
        `SELECT rp.role, p.name as permission
         FROM role_permissions rp
         INNER JOIN permissions p ON rp.permission_id = p.id
         ORDER BY rp.role, p.name`
    );
    return result; // Returns flat array: [{ role: 'ADMIN', permission: 'user:view' }, ...]
}
```

**Frontend Expected:**
```typescript
{
    roles: [
        {
            id: '...',
            name: 'ADMIN',
            description: '...',
            isSystem: true,
            permissions: [
                { id: '...', name: 'user:view', resource: 'user', action: 'view', ... },
                ...
            ]
        },
        ...
    ],
    permissions: [
        { id: '...', name: 'user:view', resource: 'user', action: 'view', ... },
        ...
    ]
}
```

## Solution

Updated `getAllRolePermissionsMatrix()` to return the correct format:

**After (Correct):**
```typescript
async getAllRolePermissionsMatrix(): Promise<{ roles: any[]; permissions: any[] }> {
    // Get all roles with their permissions
    const rolesQuery = `
        SELECT 
            r.id,
            r.name,
            r.description,
            r.is_system as "isSystem",
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', p.id,
                        'name', p.name,
                        'resource', p.resource,
                        'action', p.action,
                        'description', p.description,
                        'category', p.category
                    )
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'
            ) as permissions
        FROM roles r
        LEFT JOIN role_permissions rp ON r.name = rp.role
        LEFT JOIN permissions p ON rp.permission_id = p.id
        GROUP BY r.id, r.name, r.description, r.is_system
        ORDER BY r.name
    `;

    // Get all available permissions
    const permissionsQuery = `
        SELECT 
            id,
            name,
            resource,
            action,
            description,
            category
        FROM permissions
        ORDER BY category, resource, action
    `;

    const [roles, permissions] = await Promise.all([
        this.dataSource.query(rolesQuery),
        this.dataSource.query(permissionsQuery),
    ]);

    return { roles, permissions };
}
```

## Changes Made

1. **Two Separate Queries:**
   - One for roles with their assigned permissions
   - One for all available permissions

2. **Proper JSON Aggregation:**
   - Uses `json_agg` to group permissions per role
   - Uses `COALESCE` to return empty array if no permissions
   - Uses `FILTER (WHERE p.id IS NOT NULL)` to exclude null joins

3. **Correct Response Format:**
   - Returns `{ roles: [...], permissions: [...] }`
   - Matches frontend expectations

## Testing

After this fix, the Enhanced Permissions page should:

1. **Show Permission Matrix:**
   - Display all roles as columns
   - Display all permissions as rows
   - Show checkmarks for assigned permissions
   - Allow toggling permissions (for non-system roles)

2. **Show Roles Tab:**
   - Display all roles as cards
   - Show permission count per role
   - Allow editing/deleting custom roles

## Prerequisites

For the page to work, you need:

1. **Roles in database:**
   ```bash
   node backend/seed-roles.js
   ```

2. **Permissions in database:**
   ```sql
   -- Check if permissions exist
   SELECT COUNT(*) FROM permissions;
   ```
   
   If empty, you need to seed permissions. Create a seed script or insert manually.

3. **Role-permission assignments:**
   ```sql
   -- Check assignments
   SELECT role, COUNT(*) FROM role_permissions GROUP BY role;
   ```

## API Endpoint

**URL:** `GET /api/admin/permissions/roles/matrix`

**Response:**
```json
{
  "roles": [
    {
      "id": "uuid",
      "name": "ADMIN",
      "description": "Administrator role",
      "isSystem": true,
      "permissions": [
        {
          "id": "uuid",
          "name": "user:view",
          "resource": "user",
          "action": "view",
          "description": "View users",
          "category": "User Management"
        }
      ]
    }
  ],
  "permissions": [
    {
      "id": "uuid",
      "name": "user:view",
      "resource": "user",
      "action": "view",
      "description": "View users",
      "category": "User Management"
    }
  ]
}
```

## Files Modified

- `backend/src/services/permissionService.ts` - Fixed `getAllRolePermissionsMatrix()` method

## Status

✅ **FIXED** - Enhanced Permissions page should now display correctly

## Next Steps

1. Restart backend server
2. Navigate to `/admin/permissions`
3. Verify permission matrix displays
4. Test toggling permissions
5. Test creating custom roles

## Troubleshooting

**If page still shows empty:**

1. **Check database has data:**
   ```bash
   node backend/check-permissions-data.js
   ```

2. **Check API response:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/admin/permissions/roles/matrix
   ```

3. **Check browser console:**
   - Open DevTools
   - Check for API errors
   - Verify response format

4. **Check backend logs:**
   - Look for query errors
   - Check permission service logs
