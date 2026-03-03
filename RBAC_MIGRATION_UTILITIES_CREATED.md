# RBAC Migration Utilities Created

## Overview

Created helper utilities and hooks to enable gradual migration from hardcoded role/permission checks to database-driven RBAC system.

## Files Created

### 1. Migration Plan Document

**File:** `urutix/DYNAMIC_RBAC_MIGRATION_PLAN.md`

Comprehensive migration strategy including:
- Current state analysis
- Migration phases
- Implementation steps
- Testing strategy
- Rollback plan
- Timeline and success criteria

### 2. Backend Permission Helper

**File:** `urutix/backend/src/utils/permission-helper.ts`

**Features:**
- Database-driven permission lookups
- Built-in caching (5-minute TTL)
- SUPER_ADMIN bypass logic
- Permission existence checks
- Category-based grouping
- Cache management utilities

**Key Methods:**
```typescript
getRolePermissions(roleName: string): Promise<string[]>
roleHasPermission(roleName: string, permission: string): Promise<boolean>
roleHasAnyPermission(roleName: string, permissions: string[]): Promise<boolean>
roleHasAllPermissions(roleName: string, permissions: string[]): Promise<boolean>
getAllPermissions(): Promise<Permission[]>
permissionExists(permission: string): Promise<boolean>
getPermissionsByCategory(): Promise<Record<string, Permission[]>>
clearRoleCache(roleName: string): void
clearAllCaches(): void
getCacheStats(): CacheStats
```

**Usage Example:**
```typescript
// In a service or controller
constructor(private permissionHelper: PermissionHelper) {}

async checkAccess(user: User, permission: string) {
    return await this.permissionHelper.roleHasPermission(user.role, permission);
}
```

### 3. Frontend Permission Hooks

**File:** `urutix/frontend/src/hooks/useRolePermissions.ts`

**Hooks Provided:**

1. **useRolePermissions(roleName?: string)**
   - Fetches permissions for a role
   - Defaults to current user's role
   - Returns permissions array and permission names

2. **useAllPermissions()**
   - Fetches all available permissions
   - Useful for admin interfaces

3. **useHasPermission(permission: string)**
   - Checks if current user has specific permission
   - Returns boolean

4. **useHasAnyPermission(permissions: string[])**
   - Checks if user has at least one permission
   - Returns boolean

5. **useHasAllPermissions(permissions: string[])**
   - Checks if user has all permissions
   - Returns boolean

6. **usePermissionsByCategory()**
   - Returns permissions grouped by category
   - Useful for permission management UIs

7. **useRoleHasPermission(roleName: string, permission: string)**
   - Checks if a specific role has permission
   - Useful for admin role management

**Usage Examples:**

```typescript
// Simple permission check
function CreateCargoButton() {
    const canCreate = useHasPermission('cargo:create');
    
    if (!canCreate) return null;
    
    return <button>Create Cargo</button>;
}

// Multiple permission check
function AdminPanel() {
    const hasAccess = useHasAnyPermission(['user:manage', 'tenant:manage']);
    
    if (!hasAccess) return <AccessDenied />;
    
    return <AdminContent />;
}

// Role-specific check (for admin)
function RolePermissionMatrix({ roleName }) {
    const canManageUsers = useRoleHasPermission(roleName, 'user:manage');
    
    return (
        <div>
            User Management: {canManageUsers ? '✓' : '✗'}
        </div>
    );
}
```

## Integration Steps

### Backend Integration

1. **Add to Module Providers:**

```typescript
// In your module (e.g., AppModule or SharedModule)
import { PermissionHelper } from './utils/permission-helper';

@Module({
    providers: [PermissionHelper],
    exports: [PermissionHelper],
})
export class SharedModule {}
```

2. **Use in Services:**

```typescript
import { PermissionHelper } from '../utils/permission-helper';

@Injectable()
export class SomeService {
    constructor(private permissionHelper: PermissionHelper) {}
    
    async performAction(user: User) {
        const canPerform = await this.permissionHelper.roleHasPermission(
            user.role,
            'action:perform'
        );
        
        if (!canPerform) {
            throw new ForbiddenException('Insufficient permissions');
        }
        
        // Perform action
    }
}
```

3. **Use in Guards:**

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private permissionHelper: PermissionHelper) {}
    
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const requiredPermission = this.reflector.get<string>(
            'permission',
            context.getHandler()
        );
        
        return await this.permissionHelper.roleHasPermission(
            user.role,
            requiredPermission
        );
    }
}
```

### Frontend Integration

1. **Import Hooks:**

```typescript
import {
    useHasPermission,
    useHasAnyPermission,
    useRolePermissions
} from '../hooks/useRolePermissions';
```

2. **Replace Hardcoded Checks:**

**Before:**
```typescript
if (user?.role === 'CARGO_OWNER') {
    return <CreateCargoButton />;
}
```

**After:**
```typescript
const canCreateCargo = useHasPermission('cargo:create');

if (canCreateCargo) {
    return <CreateCargoButton />;
}
```

3. **Update Navigation:**

**Before:**
```typescript
const menuItems = user?.role === 'ADMIN' ? adminMenuItems : userMenuItems;
```

**After:**
```typescript
const canManageUsers = useHasPermission('user:manage');
const canManageTenants = useHasPermission('tenant:manage');

const menuItems = [];
if (canManageUsers) {
    menuItems.push({ label: 'Users', path: '/admin/users' });
}
if (canManageTenants) {
    menuItems.push({ label: 'Tenants', path: '/admin/tenants' });
}
```

## Caching Strategy

### Backend Caching

- **TTL:** 5 minutes
- **Storage:** In-memory Map
- **Invalidation:** Manual via `clearRoleCache()` or `clearAllCaches()`
- **Stats:** Available via `getCacheStats()`

**When to Clear Cache:**
- After assigning/revoking role permissions
- After creating/updating roles
- On application restart (automatic)

```typescript
// After updating permissions
await this.permissionService.bulkAssignPermissions(roleId, permissionIds, userId);
this.permissionHelper.clearRoleCache(roleName);
```

### Frontend Caching

- **TTL:** 5 minutes (role permissions), 10 minutes (all permissions)
- **Storage:** React Query cache
- **Invalidation:** Automatic on mutation success

```typescript
// Invalidate after permission changes
queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
queryClient.invalidateQueries({ queryKey: ['all-permissions'] });
```

## Performance Considerations

### Backend

1. **Database Queries:**
   - Cached for 5 minutes
   - Single query per role
   - Indexed columns (role, permission_id)

2. **Memory Usage:**
   - Minimal (only permission strings cached)
   - Automatic expiry prevents memory leaks

3. **Optimization:**
   - Consider Redis for distributed caching
   - Consider preloading common roles on startup

### Frontend

1. **Network Requests:**
   - Cached by React Query
   - Shared across components
   - Background refetch on stale

2. **Re-renders:**
   - Hooks use memoization
   - Only re-render when permissions change

3. **Bundle Size:**
   - Minimal impact (~2KB)
   - Tree-shakeable exports

## Migration Priority

### High Priority (Security Critical)

1. Authentication guards
2. API endpoint protection
3. Admin panel access
4. Financial operations
5. User management

### Medium Priority (Feature Access)

1. Cargo creation/management
2. Truck management
3. Load assignment
4. Payment processing
5. Document management

### Low Priority (UI Elements)

1. Navigation menus
2. Button visibility
3. Icon displays
4. Cosmetic elements

## Testing

### Backend Tests

```typescript
describe('PermissionHelper', () => {
    let helper: PermissionHelper;
    
    beforeEach(() => {
        helper = new PermissionHelper(dataSource);
    });
    
    it('should fetch role permissions', async () => {
        const perms = await helper.getRolePermissions('CARGO_OWNER');
        expect(perms).toContain('cargo:create');
    });
    
    it('should check permission existence', async () => {
        const has = await helper.roleHasPermission('ADMIN', 'user:manage');
        expect(has).toBe(true);
    });
    
    it('should cache permissions', async () => {
        await helper.getRolePermissions('DRIVER');
        const stats = helper.getCacheStats();
        expect(stats.roles).toContain('DRIVER');
    });
});
```

### Frontend Tests

```typescript
describe('useHasPermission', () => {
    it('should return true for SUPER_ADMIN', () => {
        const { result } = renderHook(() => useHasPermission('any:permission'), {
            wrapper: createWrapper({ user: { role: 'SUPER_ADMIN' } })
        });
        
        expect(result.current).toBe(true);
    });
    
    it('should check database permissions', async () => {
        const { result, waitFor } = renderHook(
            () => useHasPermission('cargo:create'),
            { wrapper: createWrapper({ user: { role: 'CARGO_OWNER' } }) }
        );
        
        await waitFor(() => expect(result.current).toBe(true));
    });
});
```

## Next Steps

1. **Integrate Utilities:**
   - Add PermissionHelper to backend modules
   - Import hooks in frontend components

2. **Start Migration:**
   - Begin with high-priority security checks
   - Update one component/service at a time
   - Test thoroughly after each change

3. **Monitor Performance:**
   - Track cache hit rates
   - Monitor database query counts
   - Measure response times

4. **Gradual Rollout:**
   - Use feature flags if needed
   - Deploy to staging first
   - Monitor for issues

5. **Complete Migration:**
   - Remove hardcoded checks
   - Update documentation
   - Train team on new approach

## Status

✅ **UTILITIES CREATED** - Ready for integration and migration

The helper utilities and hooks are production-ready and can be integrated immediately. They work alongside existing hardcoded checks, allowing for gradual migration without breaking changes.
