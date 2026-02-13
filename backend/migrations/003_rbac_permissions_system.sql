-- RBAC Permissions System Migration
-- Created: 2026-01-13
-- Description: Creates tables for fine-grained role-based access control

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Permissions table: Stores all available permissions in the system
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

-- Role-Permission junction table: Maps permissions to roles
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(50) NOT NULL,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(role, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- User-specific permission overrides: Grants or denies specific permissions to individual users
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  is_granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMP DEFAULT NOW(),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  expires_at TIMESTAMP,
  UNIQUE(user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_granted ON user_permissions(is_granted);

-- Permission audit log: Tracks all permission-related changes
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON permission_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON permission_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON permission_audit_log(action);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert core permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  -- Cargo permissions
  ('cargo:create', 'cargo', 'create', 'Create new cargo listings'),
  ('cargo:view_own', 'cargo', 'view_own', 'View own cargo'),
  ('cargo:view_all', 'cargo', 'view_all', 'View all cargo in tenant'),
  ('cargo:view_all_tenants', 'cargo', 'view_all_tenants', 'View cargo across all tenants (admin)'),
  ('cargo:update_own', 'cargo', 'update_own', 'Update own cargo'),
  ('cargo:update_all', 'cargo', 'update_all', 'Update any cargo in tenant'),
  ('cargo:delete_own', 'cargo', 'delete_own', 'Delete own cargo'),
  ('cargo:delete_all', 'cargo', 'delete_all', 'Delete any cargo in tenant'),
  ('cargo:publish', 'cargo', 'publish', 'Publish cargo to marketplace'),
  ('cargo:archive', 'cargo', 'archive', 'Archive cargo'),
  
  -- Truck permissions
  ('truck:create', 'truck', 'create', 'Register new trucks'),
  ('truck:view_own', 'truck', 'view_own', 'View own fleet'),
  ('truck:view_all', 'truck', 'view_all', 'View all trucks in tenant'),
  ('truck:view_all_tenants', 'truck', 'view_all_tenants', 'View trucks across all tenants (admin)'),
  ('truck:update_own', 'truck', 'update_own', 'Update own trucks'),
  ('truck:update_all', 'truck', 'update_all', 'Update any truck in tenant'),
  ('truck:delete_own', 'truck', 'delete_own', 'Delete own trucks'),
  ('truck:delete_all', 'truck', 'delete_all', 'Delete any truck in tenant'),
  ('truck:assign_driver', 'truck', 'assign_driver', 'Assign drivers to trucks'),
  ('truck:maintenance', 'truck', 'maintenance', 'Schedule and manage truck maintenance'),
  
  -- Driver permissions
  ('driver:create', 'driver', 'create', 'Register new drivers'),
  ('driver:view_own', 'driver', 'view_own', 'View own drivers'),
  ('driver:view_all', 'driver', 'view_all', 'View all drivers in tenant'),
  ('driver:manage_own', 'driver', 'manage_own', 'Manage own drivers'),
  ('driver:manage_all', 'driver', 'manage_all', 'Manage all drivers in tenant'),
  ('driver:delete', 'driver', 'delete', 'Delete drivers'),
  
  -- Trip permissions
  ('trip:view_assigned', 'trip', 'view_assigned', 'View assigned trips'),
  ('trip:view_all', 'trip', 'view_all', 'View all trips in tenant'),
  ('trip:create', 'trip', 'create', 'Create trips'),
  ('trip:update_status', 'trip', 'update_status', 'Update trip status'),
  ('trip:complete', 'trip', 'complete', 'Mark trip as complete'),
  ('trip:cancel', 'trip', 'cancel', 'Cancel trips'),
  
  -- Payment permissions
  ('payment:view_own', 'payment', 'view_own', 'View own payments'),
  ('payment:view_all', 'payment', 'view_all', 'View all payments in tenant'),
  ('payment:create', 'payment', 'create', 'Initiate payments'),
  ('payment:approve', 'payment', 'approve', 'Approve payments'),
  ('payment:cancel', 'payment', 'cancel', 'Cancel payments'),
  
  -- User management
  ('user:view_own', 'user', 'view_own', 'View own profile'),
  ('user:view_tenant', 'user', 'view_tenant', 'View users in tenant'),
  ('user:view_all', 'user', 'view_all', 'View all users across tenants'),
  ('user:create', 'user', 'create', 'Create new users'),
  ('user:update', 'user', 'update', 'Update user details'),
  ('user:delete', 'user', 'delete', 'Delete users'),
  ('user:assign_role', 'user', 'assign_role', 'Assign roles to users'),
  ('user:manage_permissions', 'user', 'manage_permissions', 'Manage user-specific permissions'),
  
  -- Analytics permissions
  ('analytics:view_own', 'analytics', 'view_own', 'View own analytics'),
  ('analytics:view_tenant', 'analytics', 'view_tenant', 'View tenant-wide analytics'),
  ('analytics:view_all', 'analytics', 'view_all', 'View system-wide analytics'),
  
  -- Admin permissions
  ('admin:manage_permissions', 'admin', 'manage_permissions', 'Manage system permissions'),
  ('admin:view_all_tenants', 'admin', 'view_all_tenants', 'View all tenants'),
  ('admin:manage_tenants', 'admin', 'manage_tenants', 'Create, update, delete tenants'),
  ('admin:view_audit_log', 'admin', 'view_audit_log', 'View permission audit log'),
  ('admin:system_settings', 'admin', 'system_settings', 'Manage system settings')
ON CONFLICT (name) DO NOTHING;

-- Get permission IDs for role assignments (store in temp table)
CREATE TEMP TABLE IF NOT EXISTS temp_perm_ids AS
SELECT id, name FROM permissions;

-- Insert role-permission mappings

-- SUPER_ADMIN: Gets all permissions (we'll handle this in code with wildcard)
-- No need to insert all permissions for SUPER_ADMIN, check in service layer

-- ADMIN role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'ADMIN', id FROM temp_perm_ids WHERE name IN (
  'admin:view_all_tenants',
  'admin:manage_tenants',
  'admin:view_audit_log',
  'user:view_all',
  'user:create',
  'user:update',
  'user:delete',
  'user:assign_role',
  'cargo:view_all_tenants',
  'truck:view_all_tenants',
  'analytics:view_all'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- TENANT_ADMIN role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'TENANT_ADMIN', id FROM temp_perm_ids WHERE name IN (
  'user:view_tenant',
  'user:create',
  'user:update',
  'cargo:view_all',
  'truck:view_all',
  'driver:view_all',
  'trip:view_all',
  'payment:view_all',
  'analytics:view_tenant'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- CARGO_OWNER role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'CARGO_OWNER', id FROM temp_perm_ids WHERE name IN (
  'cargo:create',
  'cargo:view_own',
  'cargo:update_own',
  'cargo:delete_own',
  'cargo:publish',
  'payment:view_own',
  'payment:create',
  'trip:view_assigned',
  'analytics:view_own',
  'user:view_own'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- TRUCK_OWNER role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'TRUCK_OWNER', id FROM temp_perm_ids WHERE name IN (
  'truck:create',
  'truck:view_own',
  'truck:update_own',
  'truck:delete_own',
  'truck:assign_driver',
  'truck:maintenance',
  'driver:create',
  'driver:view_own',
  'driver:manage_own',
  'payment:view_own',
  'trip:view_all',
  'analytics:view_own',
  'user:view_own'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- DRIVER role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'DRIVER', id FROM temp_perm_ids WHERE name IN (
  'trip:view_assigned',
  'trip:update_status',
  'trip:complete',
  'user:view_own'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- AGENT role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'AGENT', id FROM temp_perm_ids WHERE name IN (
  'cargo:view_all',
  'truck:view_all',
  'trip:view_all',
  'analytics:view_tenant',
  'user:view_own'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- LENDER role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'LENDER', id FROM temp_perm_ids WHERE name IN (
  'payment:view_own',
  'user:view_own',
  'analytics:view_own'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Drop temp table
DROP TABLE IF EXISTS temp_perm_ids;

-- Create a view for easier permission querying
CREATE OR REPLACE VIEW user_all_permissions AS
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  p.id as permission_id,
  p.name as permission_name,
  p.resource,
  p.action,
  CASE 
    WHEN up.is_granted IS NOT NULL THEN up.is_granted
    ELSE true
  END as is_granted,
  CASE
    WHEN up.id IS NOT NULL THEN 'user_specific'
    ELSE 'role_based'
  END as source
FROM users u
LEFT JOIN role_permissions rp ON CAST(u.role AS TEXT) = rp.role
LEFT JOIN permissions p ON rp.permission_id = p.id
LEFT JOIN user_permissions up ON u.id = up.user_id AND p.id = up.permission_id;

COMMENT ON TABLE permissions IS 'Stores all available system permissions';
COMMENT ON TABLE role_permissions IS 'Maps permissions to roles';
COMMENT ON TABLE user_permissions IS 'User-specific permission grants/denies that override role permissions';
COMMENT ON TABLE permission_audit_log IS 'Audit trail for all permission-related changes';
COMMENT ON VIEW user_all_permissions IS 'Consolidated view of user permissions from both roles and user-specific overrides';
