# Role & Permission Management System

## Overview
Super Admin has full control over role-based permissions through multiple interfaces.

## Access Points

### 1. Admin Users Page (`/admin/users`)
- Tab-based interface with "Users" and "Role Permissions" tabs
- Click "Role Permissions" tab to access the matrix

### 2. Role Management Page (`/admin/roles`)
- Dedicated page for role definitions
- Shows global default permissions for each role

### 3. Enhanced Permissions Page (`/admin/enhanced-permissions`)
- Advanced permission management interface
- Bulk operations support
- Permission statistics and analytics

## Features

### Role Permission Matrix
**Location**: `/admin/users` (Role Permissions tab) or `/admin/roles`

**Capabilities**:
- ✅ View all permissions organized by resource
- ✅ Toggle permissions for each role (CARGO_OWNER, TRUCK_OWNER, DRIVER, AGENT, LENDER, TENANT_ADMIN)
- ✅ SUPER_ADMIN permissions are locked (cannot be modified)
- ✅ Real-time updates with toast notifications
- ✅ Search and filter permissions
- ✅ Resource-based filtering (loads, trucks, payments, etc.)

**How to Use**:
1. Navigate to `/admin/users`
2. Click "Role Permissions" tab
3. Click checkboxes to grant/revoke permissions
4. Changes are saved immediately

### Bulk Operations
**Location**: Enhanced Permissions page

**Capabilities**:
- ✅ Select multiple permissions at once
- ✅ Bulk grant to a role
- ✅ Bulk revoke from a role
- ✅ Copy permissions from one role to another
- ✅ Export permission matrix

### Permission Statistics
- View permission coverage per role
- See which permissions are most/least used
- Identify roles with similar permission sets

## Default Roles

### SUPER_ADMIN
- All permissions (locked, cannot be modified)
- Full system access

### CARGO_OWNER
- Create/manage loads
- View trucks and drivers
- Make payments
- Track shipments

### TRUCK_OWNER
- Manage fleet (trucks, drivers)
- Bid on loads
- View financial reports
- Track trips

### DRIVER
- View assigned trips
- Update trip status
- Upload documents
- View earnings

### AGENT/BROKER
- Facilitate deals
- Earn commissions
- Manage client relationships

### LENDER
- Manage loan portfolio
- Review applications
- Track repayments
- Risk analysis

### TENANT_ADMIN
- Manage tenant users
- Configure tenant settings
- View tenant analytics

## Permission Structure

Permissions follow the format: `{resource}:{action}`

**Examples**:
- `loads:create` - Create new loads
- `trucks:view` - View truck information
- `payments:approve` - Approve payments
- `users:manage` - Manage users
- `reports:export` - Export reports

## API Endpoints

### Grant Permission
```
POST /api/admin/permissions/roles/{role}/grant
Body: { permission: "loads:create" }
```

### Revoke Permission
```
POST /api/admin/permissions/roles/{role}/revoke
Body: { permission: "loads:create" }
```

### Get Role Matrix
```
GET /api/admin/permissions/matrix
```

### List All Permissions
```
GET /api/admin/permissions
```

## Security

1. ✅ Only SUPER_ADMIN can modify role permissions
2. ✅ SUPER_ADMIN permissions cannot be modified
3. ✅ All changes are logged in activity history
4. ✅ Real-time validation prevents invalid permission assignments
5. ✅ Tenant isolation - permissions are scoped per tenant

## User-Specific Overrides

Super Admin can also override permissions for individual users:
- Navigate to `/admin/users`
- Click on a user
- Click "Manage Permissions"
- Grant/revoke specific permissions for that user
- Overrides take precedence over role permissions

## Best Practices

1. **Start with minimal permissions** - Grant only what's needed
2. **Use roles for common patterns** - Don't override for every user
3. **Review regularly** - Check permission matrix monthly
4. **Document custom roles** - If you create custom permission sets
5. **Test in staging** - Verify permission changes before production

## Current Implementation Status

✅ **Fully Functional**
- Role permission matrix
- Grant/revoke permissions
- Bulk operations
- User-specific overrides
- Activity logging
- Real-time updates

## Related Pages

- `/admin/users` - User management with role permissions tab
- `/admin/roles` - Role definitions
- `/admin/enhanced-permissions` - Advanced permission management
- `/admin/activity-logs` - View permission change history
- `/admin/monitoring` - System-wide permission usage stats
