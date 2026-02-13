# Dynamic RBAC Migration Plan

## Current State Analysis

### Hardcoded Role Checks Found

**Frontend Locations:**
1. `AdminRoutes.tsx` - Role-based UI rendering
2. `Auth.tsx` - Registration flow logic
3. `AdminTrucks.tsx` - Admin access checks
4. `UserManagement.tsx` - Role filtering
5. `DashboardHeader.tsx` - Navigation menu generation
6. `PermissionContext.tsx` - SUPER_ADMIN bypass
7. `SocketContext.tsx` - Real-time notifications
8. `Bidding components` - Role-based feature access
9. `ManageUsersModal.tsx` - Role icon display

**Backend Locations:**
1. `fleet.controller.ts` - Permission decorators
2. `admin-permissions.controller.ts` - Role guards
3. Various controllers - `@Roles()` decorators

### Hardcoded Permission Checks Found

**Frontend:**
- `permissions.ts` - Permission constants
- Various components using `hasPermission('cargo:create')`

**Backend:**
- Migration files with hardcoded permissions
- Controllers with `@RequirePermissions('truck:view')`
- Service methods checking specific permissions

## Migration Strategy

### Phase 1: Create Helper Utilities (IMMEDIATE)

Create utilities that work with both hardcoded and database-driven approaches during transition.

### Phase 2: Update Permission Checks (GRADUAL)

Replace hardcoded permission strings with database lookups where appropriate.

### Phase 3: Update Role Checks (CAREFUL)

Keep role enum for type safety, but load role permissions from database.

### Phase 4: Remove Hardcoded Values (FINAL)

Clean up old hardcoded values after full migration.

## Implementation

### 1. Backend Permission Helper

**File:** `urutix/backend/src/utils/permission-helper.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class PermissionHelper {
    constructor(private dataSource: DataSource) {}

    /**
     * Get all permissions for a role from database
     * Falls back to empty array if role not found
     */
    async getRolePermissions(roleName: string): Promise<string[]> {
        try {
            const result = await this.dataSource.query(
                `SELECT p.resource || ':' || p.action as permission
                 FROM permissions p
                 INNER JOIN role_permissions rp ON p.id = rp.permission_id
                 WHERE rp.role = $1`,
                [roleName]
            );
            return result.map(r => r.permission);
        } catch (error) {
            console.error(`Error fetching permissions for role ${roleName}:`, error);
            return [];
        }
    }

    /**
     * Check if a role has a specific permission
     */
    async roleHasPermission(roleName: string, permission: string): Promise<boolean> {
        const permissions = await this.getRolePermissions(roleName);
        return permissions.includes(permission);
    }

    /**
     * Get all available permissions from database
     */
    async getAllPermissions(): Promise<Array<{
        id: string;
        name: string;
        resource: string;
        action: string;
        description: string;
        category: string;
    }>> {
        const result = await this.dataSource.query(
            `SELECT id, resource || ':' || action as name, resource, action, description, category
             FROM permissions
             ORDER BY category, resource, action`
        );
        return result;
    }

    /**
     * Check if a permission exists in database
     */
    async permissionExists(permission: string): Promise<boolean> {
        const [resource, action] = permission.split(':');
        const result = await this.dataSource.query(
            `SELECT COUNT(*) as count FROM permissions WHERE resource = $1 AND action = $2`,
            [resource, action]
        );
        return parseInt(result[0].count) > 0;
    }
}
```

### 2. Frontend Permission Hook

**File:** `urutix/frontend/src/hooks/useRolePermissions.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string;
    category: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    isSystem: boolean;
    permissions: Permission[];
}

/**
 * Hook to fetch role permissions from database
 */
export function useRolePermissions(roleName?: string) {
    return useQuery({
        queryKey: ['role-permissions', roleName],
        queryFn: async () => {
            if (!roleName) return { permissions: [] };
            
            const response = await axios.get(`/api/admin/permissions/roles`);
            const roles: Role[] = response.data?.data || [];
            const role = roles.find(r => r.name === roleName);
            
            return {
                permissions: role?.permissions.map(p => p.name) || []
            };
        },
        enabled: !!roleName,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

/**
 * Hook to fetch all available permissions
 */
export function useAllPermissions() {
    return useQuery({
        queryKey: ['all-permissions'],
        queryFn: async () => {
            const response = await axios.get('/api/admin/permissions/list');
            return response.data?.permissions || [];
        },
        staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    });
}

/**
 * Hook to check if current user's role has specific permission
 */
export function useHasPermission(permission: string) {
    const { user } = useAuth();
    const { data } = useRolePermissions(user?.role);
    
    // SUPER_ADMIN always has all permissions
    if (user?.role === 'SUPER_ADMIN') return true;
    
    return data?.permissions.includes(permission) || false;
}
```

### 3. Updated Permission Context

**File:** `urutix/frontend/src/contexts/PermissionContext.tsx`

Update to use database-driven permissions:

```typescript
// Add caching for role permissions
const [rolePermissionsCache, setRolePermissionsCache] = useState<Record<string, string[]>>({});

// Fetch role permissions from database
useEffect(() => {
    if (user?.role && !rolePermissionsCache[user.role]) {
        axios.get(`/api/admin/permissions/roles`)
            .then(response => {
                const roles = response.data?.data || [];
                const role = roles.find(r => r.name === user.role);
                if (role) {
                    const perms = role.permissions.map(p => `${p.resource}:${p.action}`);
                    setRolePermissionsCache(prev => ({
                        ...prev,
                        [user.role]: perms
                    }));
                }
            })
            .catch(error => {
                console.error('Error fetching role permissions:', error);
            });
    }
}, [user?.role]);

// Update hasPermission to use cached role permissions
const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // SUPER_ADMIN has all permissions
    if (user.role === 'SUPER_ADMIN') return true;
    
    // Check cached role permissions first
    const rolePerms = rolePermissionsCache[user.role];
    if (rolePerms) {
        return rolePerms.includes(permission);
    }
    
    // Fallback to user-specific permissions
    return permissions.includes(permission);
}, [user, permissions, rolePermissionsCache]);
```

## Migration Steps

### Step 1: Add Permission Helper Utilities

1. Create `permission-helper.ts` in backend
2. Create `useRolePermissions.ts` hook in frontend
3. Update `PermissionContext.tsx` to use database permissions
4. Test with existing hardcoded checks still in place

### Step 2: Update Backend Controllers

Replace:
```typescript
@RequirePermissions('truck:view')
```

With:
```typescript
@RequirePermissions() // Check permission from database
@UseGuards(JwtAuthGuard, PermissionGuard)
```

Update PermissionGuard to:
1. Get user's role
2. Fetch role permissions from database
3. Check if required permission exists

### Step 3: Update Frontend Components

Replace:
```typescript
if (user?.role === 'CARGO_OWNER') {
    // Show cargo owner UI
}
```

With:
```typescript
const { hasPermission } = usePermissions();

if (hasPermission('cargo:create')) {
    // Show cargo creation UI
}
```

### Step 4: Update Navigation Logic

Replace role-based navigation with permission-based:

```typescript
// Before
if (user?.role === 'ADMIN') {
    return adminMenuItems;
}

// After
const menuItems = [];
if (hasPermission('user:manage')) {
    menuItems.push({ label: 'Users', path: '/admin/users' });
}
if (hasPermission('tenant:manage')) {
    menuItems.push({ label: 'Tenants', path: '/admin/tenants' });
}
return menuItems;
```

### Step 5: Gradual Component Updates

Priority order:
1. Critical security checks (authentication, authorization)
2. Admin panels (user management, permissions)
3. Feature access (cargo creation, truck management)
4. UI elements (navigation, buttons)
5. Cosmetic elements (icons, labels)

## Backward Compatibility

### During Migration

Keep both approaches working:

```typescript
// Backend
async checkAccess(user: User, permission: string): Promise<boolean> {
    // Try database first
    const dbPermissions = await this.getRolePermissions(user.role);
    if (dbPermissions.length > 0) {
        return dbPermissions.includes(permission);
    }
    
    // Fallback to hardcoded (legacy)
    return this.legacyPermissionCheck(user.role, permission);
}

// Frontend
const hasAccess = useMemo(() => {
    // Try database permissions first
    if (rolePermissions?.length > 0) {
        return rolePermissions.includes(requiredPermission);
    }
    
    // Fallback to hardcoded role check
    return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}, [rolePermissions, user, requiredPermission]);
```

## Testing Strategy

### 1. Unit Tests

Test permission helper utilities:
```typescript
describe('PermissionHelper', () => {
    it('should fetch role permissions from database', async () => {
        const perms = await helper.getRolePermissions('CARGO_OWNER');
        expect(perms).toContain('cargo:create');
    });
    
    it('should check if role has permission', async () => {
        const has = await helper.roleHasPermission('ADMIN', 'user:manage');
        expect(has).toBe(true);
    });
});
```

### 2. Integration Tests

Test full permission flow:
```typescript
describe('Permission Flow', () => {
    it('should allow CARGO_OWNER to create cargo', async () => {
        const user = { role: 'CARGO_OWNER' };
        const canCreate = await checkPermission(user, 'cargo:create');
        expect(canCreate).toBe(true);
    });
});
```

### 3. E2E Tests

Test user workflows:
- Login as different roles
- Verify correct UI elements shown
- Verify correct API access
- Verify permission denials work

## Rollback Plan

If issues arise:

1. **Immediate**: Feature flag to disable database permissions
2. **Short-term**: Revert to hardcoded checks
3. **Long-term**: Fix issues and re-enable

```typescript
// Feature flag
const USE_DATABASE_PERMISSIONS = process.env.USE_DATABASE_PERMISSIONS === 'true';

if (USE_DATABASE_PERMISSIONS) {
    return await this.checkDatabasePermission(user, permission);
} else {
    return this.checkHardcodedPermission(user, permission);
}
```

## Benefits of Migration

1. **Flexibility**: Change permissions without code deployment
2. **Scalability**: Add new roles and permissions easily
3. **Auditability**: Track permission changes in database
4. **Customization**: Tenant-specific permission overrides
5. **Maintainability**: Single source of truth for permissions

## Risks and Mitigation

### Risk 1: Performance Impact
**Mitigation**: Cache role permissions, use Redis for high-traffic

### Risk 2: Database Unavailable
**Mitigation**: Fallback to hardcoded permissions, graceful degradation

### Risk 3: Permission Sync Issues
**Mitigation**: Migration scripts to sync database with code

### Risk 4: Breaking Changes
**Mitigation**: Gradual rollout, feature flags, comprehensive testing

## Timeline

- **Week 1**: Create helper utilities and hooks
- **Week 2**: Update backend controllers and guards
- **Week 3**: Update frontend components (critical paths)
- **Week 4**: Update frontend components (remaining)
- **Week 5**: Testing and bug fixes
- **Week 6**: Production rollout with monitoring

## Success Criteria

✅ All role checks use database permissions
✅ All permission checks use database permissions
✅ No hardcoded role/permission strings in business logic
✅ Performance metrics within acceptable range
✅ Zero security regressions
✅ All tests passing

## Status

📋 **PLANNING PHASE** - Migration plan documented, ready for implementation
