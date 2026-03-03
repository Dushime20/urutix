# RBAC Migration - Quick Reference Guide

## For Developers

### Using Permissions in Components

```typescript
import { usePermission } from '../contexts/PermissionContext';

const MyComponent = () => {
  const { hasPermission, hasAnyPermission } = usePermission();
  
  // Single permission check
  const canEdit = hasPermission('resource:update');
  
  // Multiple permission check (OR)
  const canManage = hasAnyPermission(['resource:manage', 'resource:update']);
  
  // With role fallback (during migration)
  const canDelete = hasPermission('resource:delete') || user?.role === 'ADMIN';
  
  return (
    <div>
      {canEdit && <EditButton />}
      {canManage && <ManagePanel />}
      {canDelete && <DeleteButton />}
    </div>
  );
};
```

### Using Navigation Permissions

```typescript
import { useNavigationPermissions } from '../hooks/useNavigationPermissions';

const MyNav = () => {
  const {
    canAccessCargoManagement,
    canAccessFleetManagement,
    canAccessAdminPanel
  } = useNavigationPermissions();
  
  return (
    <nav>
      {canAccessCargoManagement && <NavItem to="/cargo">Cargo</NavItem>}
      {canAccessFleetManagement && <NavItem to="/fleet">Fleet</NavItem>}
      {canAccessAdminPanel && <NavItem to="/admin">Admin</NavItem>}
    </nav>
  );
};
```

### Permission Naming Convention

```
{resource}:{action}

Examples:
- user:view
- user:create
- user:update
- user:delete
- user:manage (full CRUD)
- cargo:create
- route:assign
- admin:access
```

### Backend Permission Checks

```typescript
import { PermissionHelper } from '../utils/permission-helper';

@Injectable()
export class MyService {
  constructor(private permissionHelper: PermissionHelper) {}
  
  async performAction(user: User) {
    const canPerform = await this.permissionHelper.roleHasPermission(
      user.role,
      'resource:action'
    );
    
    if (!canPerform) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    // Perform action
  }
}
```

## For Admins

### Managing Permissions

1. Go to **Admin > Enhanced Permissions**
2. Click **Permission Matrix** tab
3. Select role from dropdown
4. Toggle permissions on/off
5. Click **Save Changes**
6. Changes take effect immediately

### Creating Custom Roles

1. Go to **Admin > Enhanced Permissions**
2. Click **Roles** tab
3. Click **Create Role** button
4. Enter role details:
   - Name (e.g., "CUSTOM_MANAGER")
   - Description
5. Click **Create**
6. Assign permissions in Permission Matrix

### Assigning Permissions to Roles

1. Go to **Admin > Enhanced Permissions**
2. Click **Permission Matrix** tab
3. Select role from dropdown
4. Check/uncheck permissions
5. Click **Save Changes**

### Viewing Permission Audit Log

1. Go to **Admin > Activity Logs**
2. Filter by "Permission Changes"
3. View who changed what and when

## Common Permissions

### User Management
- `user:view` - View users
- `user:create` - Create users
- `user:update` - Update users
- `user:delete` - Delete users
- `user:manage` - Full user management

### Cargo Management
- `cargo:view` - View cargo
- `cargo:create` - Create cargo
- `cargo:update` - Update cargo
- `cargo:delete` - Delete cargo
- `cargo:manage` - Full cargo management

### Fleet Management
- `fleet:view` - View fleet
- `fleet:manage` - Manage fleet
- `truck:view` - View trucks
- `truck:create` - Create trucks
- `truck:update` - Update trucks
- `truck:delete` - Delete trucks
- `truck:manage` - Full truck management

### Route Management
- `route:view` - View routes
- `route:create` - Create routes
- `route:update` - Update routes
- `route:delete` - Delete routes
- `route:assign` - Assign routes to trucks
- `route:manage` - Full route management

### Admin Functions
- `admin:access` - Access admin panel
- `admin:view` - View admin features
- `tenant:manage` - Manage tenants
- `permission:manage` - Manage permissions

### Broker Functions
- `broker:access` - Access broker panel
- `broker:view` - View broker features
- `market:view` - View market intelligence
- `dispute:manage` - Manage disputes

### Lender Functions
- `lender:access` - Access lender panel
- `lender:view` - View lender features
- `loan:manage` - Manage loans
- `loan:view` - View loans

## Default Role Permissions

### SUPER_ADMIN
- All permissions (bypasses checks)

### ADMIN
- `admin:access`, `admin:view`
- `user:manage`, `tenant:manage`
- `cargo:manage`, `fleet:manage`
- `route:manage`, `trip:manage`
- All view permissions

### TENANT_ADMIN
- `admin:access` (tenant-scoped)
- `user:manage` (tenant-scoped)
- `cargo:manage`, `fleet:manage`
- `route:manage`, `trip:manage`

### CARGO_OWNER
- `cargo:create`, `cargo:view`, `cargo:update`
- `bid:view`, `bid:create`
- `tracking:view`
- `payment:view`, `payment:manage`
- `document:view`, `document:manage`

### TRUCK_OWNER
- `fleet:manage`, `truck:manage`
- `driver:manage`
- `route:view`, `route:assign`
- `trip:view`, `trip:manage`
- `maintenance:manage`, `fuel:manage`

### DRIVER
- `trip:view`, `trip:update`
- `truck:view` (assigned truck)
- `tracking:view`
- `safety:view`
- `document:view`

### BROKER
- `broker:access`, `broker:view`
- `cargo:view`, `load:view`
- `bid:view`, `bid:create`
- `market:view`
- `dispute:manage`
- `contract:manage`

### LENDER
- `lender:access`, `lender:view`
- `loan:manage`, `loan:view`
- `borrower:view`
- `financial:view`

## Troubleshooting

### User Can't See Feature

1. Check user's role
2. Go to Enhanced Permissions
3. Verify role has required permission
4. Check permission name matches code
5. Ask user to refresh browser

### Permission Not Working

1. Check permission name spelling
2. Verify permission exists in database
3. Check role has permission assigned
4. Clear permission cache (restart backend)
5. Check browser console for errors

### New Permission Not Showing

1. Add permission to database:
   ```sql
   INSERT INTO permissions (name, description, category)
   VALUES ('resource:action', 'Description', 'Category');
   ```
2. Assign to roles in Enhanced Permissions
3. Use in code with `hasPermission('resource:action')`

### Cache Issues

**Backend Cache:**
- TTL: 5 minutes
- Restart backend to clear

**Frontend Cache:**
- Stored in React state
- Refresh browser to clear

## Migration Status

### ✅ Completed
- Phase 1: Foundation
- Phase 2: UserManagement, AdminRoutes, AdminTrucks
- Phase 3: Navigation utilities

### 🔄 In Progress
- Phase 4: DashboardHeader (utilities ready)

### ⏳ Pending
- Phase 5: Backend controllers
- Phase 6: Additional components
- Phase 7: Remove role fallbacks

## Files to Reference

### Documentation
- `RBAC_MIGRATION_COMPLETE_SUMMARY.md` - Full overview
- `RBAC_MIGRATION_PHASE1_COMPLETE.md` - Phase 1 details
- `RBAC_MIGRATION_PHASE2_COMPLETE.md` - Phase 2 details
- `RBAC_MIGRATION_PHASE3_NAVIGATION_UTILITIES.md` - Phase 3 details

### Code Files
- Backend: `backend/src/utils/permission-helper.ts`
- Frontend: `frontend/src/hooks/useRolePermissions.ts`
- Frontend: `frontend/src/hooks/useNavigationPermissions.ts`
- Frontend: `frontend/src/contexts/PermissionContext.tsx`

## Support

### Questions?
- Check documentation files
- Review code examples
- Ask in team chat

### Issues?
- Check troubleshooting section
- Review error logs
- Create bug report

### Feature Requests?
- Document use case
- Propose permission structure
- Discuss with team
