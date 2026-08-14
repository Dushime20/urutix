/**
 * Permission types and interfaces for RBAC system
 */

export interface Permission {
    id: string;
    name: string;
    resource: string;
    action: string;
    description?: string;
    created_at: Date;
    updated_at: Date;
}

export interface RolePermission {
    id: string;
    role: string;
    permission_id: string;
    granted_at: Date;
    granted_by?: string;
}

export interface UserPermission {
    id: string;
    user_id: string;
    permission_id: string;
    is_granted: boolean;
    granted_at: Date;
    granted_by?: string;
    reason?: string;
    expires_at?: Date;
}

export interface PermissionAuditLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    user_id?: string;
    changes?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at: Date;
}

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    TENANT_ADMIN = 'TENANT_ADMIN',
    CARGO_OWNER = 'CARGO_OWNER',
    TRUCK_OWNER = 'TRUCK_OWNER',
    DRIVER = 'DRIVER',
    AGENT = 'AGENT',
    LENDER = 'LENDER',
    PARKING_RESERVATION_MANAGER = 'PARKING_RESERVATION_MANAGER',
}

export interface PermissionCheck {
    hasPermission: boolean;
    source: 'role_based' | 'user_specific' | 'super_admin';
    permission?: Permission;
}

export interface AuditContext {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
}
