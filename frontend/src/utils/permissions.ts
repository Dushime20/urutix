/**
 * Permission utility functions and constants
 */

/**
 * All available permissions in the system
 * Keep this in sync with backend permissions
 */
export const Permissions = {
    // Cargo permissions
    CARGO_CREATE: 'cargo:create',
    CARGO_VIEW_OWN: 'cargo:view_own',
    CARGO_VIEW_ALL: 'cargo:view_all',
    CARGO_VIEW_ALL_TENANTS: 'cargo:view_all_tenants',
    CARGO_UPDATE_OWN: 'cargo:update_own',
    CARGO_UPDATE_ALL: 'cargo:update_all',
    CARGO_DELETE_OWN: 'cargo:delete_own',
    CARGO_DELETE_ALL: 'cargo:delete_all',
    CARGO_PUBLISH: 'cargo:publish',
    CARGO_ARCHIVE: 'cargo:archive',

    // Truck permissions
    TRUCK_CREATE: 'truck:create',
    TRUCK_VIEW_OWN: 'truck:view_own',
    TRUCK_VIEW_ALL: 'truck:view_all',
    TRUCK_VIEW_ALL_TENANTS: 'truck:view_all_tenants',
    TRUCK_UPDATE_OWN: 'truck:update_own',
    TRUCK_UPDATE_ALL: 'truck:update_all',
    TRUCK_DELETE_OWN: 'truck:delete_own',
    TRUCK_DELETE_ALL: 'truck:delete_all',
    TRUCK_ASSIGN_DRIVER: 'truck:assign_driver',
    TRUCK_MAINTENANCE: 'truck:maintenance',

    // Driver permissions
    DRIVER_CREATE: 'driver:create',
    DRIVER_VIEW_OWN: 'driver:view_own',
    DRIVER_VIEW_ALL: 'driver:view_all',
    DRIVER_MANAGE_OWN: 'driver:manage_own',
    DRIVER_MANAGE_ALL: 'driver:manage_all',
    DRIVER_DELETE: 'driver:delete',

    // Trip permissions
    TRIP_VIEW_ASSIGNED: 'trip:view_assigned',
    TRIP_VIEW_ALL: 'trip:view_all',
    TRIP_CREATE: 'trip:create',
    TRIP_UPDATE_STATUS: 'trip:update_status',
    TRIP_COMPLETE: 'trip:complete',
    TRIP_CANCEL: 'trip:cancel',

    // Payment permissions
    PAYMENT_VIEW_OWN: 'payment:view_own',
    PAYMENT_VIEW_ALL: 'payment:view_all',
    PAYMENT_CREATE: 'payment:create',
    PAYMENT_APPROVE: 'payment:approve',
    PAYMENT_CANCEL: 'payment:cancel',

    // User management
    USER_VIEW_OWN: 'user:view_own',
    USER_VIEW_TENANT: 'user:view_tenant',
    USER_VIEW_ALL: 'user:view_all',
    USER_CREATE: 'user:create',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    USER_ASSIGN_ROLE: 'user:assign_role',
    USER_MANAGE_PERMISSIONS: 'user:manage_permissions',

    // Analytics permissions
    ANALYTICS_VIEW_OWN: 'analytics:view_own',
    ANALYTICS_VIEW_TENANT: 'analytics:view_tenant',
    ANALYTICS_VIEW_ALL: 'analytics:view_all',

    // Admin permissions
    ADMIN_MANAGE_PERMISSIONS: 'admin:manage_permissions',
    ADMIN_VIEW_ALL_TENANTS: 'admin:view_all_tenants',
    ADMIN_MANAGE_TENANTS: 'admin:manage_tenants',
    ADMIN_VIEW_AUDIT_LOG: 'admin:view_audit_log',
    ADMIN_SYSTEM_SETTINGS: 'admin:system_settings',
} as const;

/**
 * Type for permission values
 */
export type Permission = typeof Permissions[keyof typeof Permissions];

/**
 * Permission groups for easier management
 */
export const PermissionGroups = {
    CARGO: [
        Permissions.CARGO_CREATE,
        Permissions.CARGO_VIEW_OWN,
        Permissions.CARGO_VIEW_ALL,
        Permissions.CARGO_UPDATE_OWN,
        Permissions.CARGO_DELETE_OWN,
        Permissions.CARGO_PUBLISH,
    ],
    TRUCK: [
        Permissions.TRUCK_CREATE,
        Permissions.TRUCK_VIEW_OWN,
        Permissions.TRUCK_VIEW_ALL,
        Permissions.TRUCK_UPDATE_OWN,
        Permissions.TRUCK_DELETE_OWN,
        Permissions.TRUCK_ASSIGN_DRIVER,
        Permissions.TRUCK_MAINTENANCE,
    ],
    ADMIN: [
        Permissions.ADMIN_MANAGE_PERMISSIONS,
        Permissions.ADMIN_VIEW_ALL_TENANTS,
        Permissions.ADMIN_MANAGE_TENANTS,
        Permissions.ADMIN_VIEW_AUDIT_LOG,
        Permissions.ADMIN_SYSTEM_SETTINGS,
    ],
};

/**
 * Helper function to build resource:action permission string
 */
export const buildPermission = (resource: string, action: string): string => {
    return `${resource}:${action}`;
};

/**
 * Parse permission string into resource and action
 */
export const parsePermission = (permission: string): { resource: string; action: string } => {
    const [resource, action] = permission.split(':');
    return { resource, action };
};
