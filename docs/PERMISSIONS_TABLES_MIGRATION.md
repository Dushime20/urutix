# Permissions Tables Migration

## Overview
Created missing permissions tables to support role-based access control (RBAC) system.

## Migration Date
April 8, 2026

## Issue
The `/api/auth/permissions` endpoint was returning a 500 error because the required database tables didn't exist:
- `permissions`
- `role_permissions`
- `user_permissions`

## Solution
Created three tables with proper relationships and seeded with default permissions.

## Tables Created

### 1. permissions
Stores all available permissions in the system.

**Columns:**
- `id` (UUID, PRIMARY KEY)
- `name` (VARCHAR, UNIQUE) - Format: "resource:action" (e.g., "cargo:create")
- `resource` (VARCHAR) - Resource type (cargo, load, trip, user, etc.)
- `action` (VARCHAR) - Action type (create, view, update, delete, etc.)
- `description` (TEXT) - Human-readable description
- `category` (VARCHAR) - Permission category for grouping
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_permissions_resource` - On resource column
- `idx_permissions_action` - On action column

### 2. role_permissions
Maps permissions to user roles.

**Columns:**
- `id` (UUID, PRIMARY KEY)
- `role` (VARCHAR) - User role (CARGO_OWNER, TRUCK_OWNER, DRIVER, etc.)
- `permission_id` (UUID, FOREIGN KEY → permissions.id)
- `created_at` (TIMESTAMP)

**Constraints:**
- UNIQUE(role, permission_id) - Prevents duplicate assignments

**Indexes:**
- `idx_role_permissions_role` - On role column

### 3. user_permissions
Stores user-specific permission overrides.

**Columns:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id)
- `permission_id` (UUID, FOREIGN KEY → permissions.id)
- `granted` (BOOLEAN) - true = grant, false = revoke
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Constraints:**
- UNIQUE(user_id, permission_id) - One override per user per permission

**Indexes:**
- `idx_user_permissions_user_id` - On user_id column

## Default Permissions Seeded

### Cargo Permissions (4)
- `cargo:create` - Create new cargo
- `cargo:view` - View cargo details
- `cargo:update` - Update cargo information
- `cargo:delete` - Delete cargo

### Load Permissions (4)
- `load:create` - Create new load
- `load:view` - View load details
- `load:update` - Update load information
- `load:delete` - Delete load

### Trip Permissions (4)
- `trip:create` - Create new trip
- `trip:view` - View trip details
- `trip:update` - Update trip information
- `trip:delete` - Delete trip

### User Permissions (4)
- `user:create` - Create new user
- `user:view` - View user details
- `user:update` - Update user information
- `user:delete` - Delete user

### Payment Permissions (3)
- `payment:create` - Create payment
- `payment:view` - View payment details
- `payment:approve` - Approve payment

### Report Permissions (2)
- `report:view` - View reports
- `report:generate` - Generate reports

### Settings Permissions (2)
- `settings:view` - View settings
- `settings:update` - Update settings

**Total: 23 permissions**

## Role Permission Assignments

### CARGO_OWNER (9 permissions)
- cargo:create, cargo:view, cargo:update, cargo:delete
- load:view
- trip:view
- payment:view
- report:view
- settings:view

### TRUCK_OWNER (7 permissions)
- load:view
- trip:view, trip:update
- user:view
- payment:view
- report:view
- settings:view

### DRIVER (3 permissions)
- trip:view, trip:update
- settings:view

### SUPER_ADMIN
- Gets ALL permissions automatically (no explicit assignments needed)

## Migration Script
Location: `backend/create-permissions-tables.js`

To run the migration:
```bash
cd backend
node create-permissions-tables.js
```

## API Endpoint

### Get User Permissions
```
GET /api/auth/permissions
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Permissions retrieved successfully",
  "data": [
    "cargo:create",
    "cargo:view",
    "cargo:update",
    "cargo:delete",
    "load:view",
    "trip:view",
    "payment:view",
    "report:view",
    "settings:view"
  ],
  "statusCode": 200,
  "timestamp": "2026-04-08T..."
}
```

## Permission Resolution Logic

1. **SUPER_ADMIN**: Gets all permissions from the `permissions` table
2. **Other Roles**: 
   - Gets role-based permissions from `role_permissions` table
   - Merges with user-specific overrides from `user_permissions` table
   - User-specific permissions override role permissions

## Usage in Code

### Check Single Permission
```typescript
const hasPermission = await permissionService.checkPermission(userId, 'cargo:create');
```

### Check Any Permission
```typescript
const hasAny = await permissionService.checkAnyPermission(userId, ['cargo:create', 'cargo:update']);
```

### Check All Permissions
```typescript
const hasAll = await permissionService.checkAllPermissions(userId, ['cargo:view', 'load:view']);
```

## Future Enhancements

Potential improvements:
- Add permission groups/categories UI
- Implement custom role creation
- Add permission inheritance
- Create permission audit log
- Add time-based permissions (temporary access)
- Implement resource-level permissions (e.g., "cargo:123:update")

## Verification

After migration, verify the tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('permissions', 'role_permissions', 'user_permissions');
```

Check permission counts:
```sql
SELECT COUNT(*) FROM permissions;
SELECT COUNT(*) FROM role_permissions;
SELECT COUNT(*) FROM user_permissions;
```

## Notes
- All foreign keys use CASCADE delete to maintain referential integrity
- Permissions use a "resource:action" naming convention for consistency
- SUPER_ADMIN role bypasses permission checks and gets all permissions
- User-specific permissions can grant OR revoke access (via `granted` boolean)
