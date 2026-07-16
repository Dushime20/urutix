import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

// Fallback role → permissions map used when the permissions tables don't exist in DB
// Role level hierarchy:
// - SUPER_ADMIN: System level (all permissions across all tenants)
// - ADMIN: Tenant level (all permissions within their assigned tenant only)
// - TENANT_ADMIN: Tenant level (admin within their tenant)
const ROLE_PERMISSION_DEFAULTS: Record<string, string[]> = {
    SUPER_ADMIN: ['*'], // System level - all permissions
    ADMIN: ['*'], // Tenant level - all permissions but scoped to tenant
    TENANT_ADMIN: ['analytics:view_own', 'analytics:view_tenant', 'analytics:view_all', 'analytics:financial', 'analytics:cost_trends'],
    TRUCK_OWNER: ['analytics:view_own', 'analytics:view_tenant', 'analytics:view_all', 'analytics:financial', 'analytics:cost_trends'],
    FLEET_MANAGER: ['analytics:view_own', 'analytics:view_tenant', 'analytics:view_all', 'analytics:financial', 'analytics:cost_trends'],
    FLEET_ACCOUNTANT: ['analytics:view_own', 'analytics:view_tenant', 'analytics:financial', 'analytics:cost_trends'],
    FLEET_DISPATCHER: ['analytics:view_own', 'analytics:view_tenant'],
    FLEET_SAFETY_OFFICER: ['analytics:view_own', 'analytics:view_tenant'],
    CARGO_OWNER: ['analytics:view_own', 'analytics:view_tenant', 'analytics:view_all', 'analytics:financial', 'analytics:cost_trends'],
    DRIVER: ['analytics:view_own'],
    BROKER: ['analytics:view_own', 'analytics:view_tenant'],
};

/**
 * Permission Helper Utility
 * Provides database-driven permission checks with caching.
 * Falls back to a built-in role map when the permissions tables don't exist.
 */
@Injectable()
export class PermissionHelper {
    private readonly logger = new Logger(PermissionHelper.name);
    private permissionCache: Map<string, string[]> = new Map();
    private cacheExpiry: Map<string, number> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private tablesExist: boolean | null = null; // null = not yet checked

    constructor(private dataSource: DataSource) {}

    /**
     * Check once whether the permissions tables exist in the DB.
     */
    private async checkTablesExist(): Promise<boolean> {
        if (this.tablesExist !== null) return this.tablesExist;
        try {
            const result = await this.dataSource.query(
                `SELECT COUNT(*) as count FROM information_schema.tables
                 WHERE table_schema = 'public' AND table_name = 'permissions'`
            );
            this.tablesExist = parseInt(result[0].count) > 0;
        } catch {
            this.tablesExist = false;
        }
        return this.tablesExist;
    }

    /**
     * Get all permissions for a role from database with caching.
     * Falls back to ROLE_PERMISSION_DEFAULTS if tables don't exist.
     * Always unions DB results with code defaults so incomplete seeds
     * (e.g. missing analytics:view_own for CARGO_OWNER) cannot lock out
     * roles that the product explicitly grants access to.
     */
    private normalizeRole(roleName: string | string[] | undefined | null): string {
        if (Array.isArray(roleName)) {
            return String(roleName[0] || '').toUpperCase();
        }
        return String(roleName || '').toUpperCase();
    }

    async getRolePermissions(roleName: string): Promise<string[]> {
        const role = this.normalizeRole(roleName);
        const cached = this.getCachedPermissions(role);
        if (cached) return cached;

        const defaults = ROLE_PERMISSION_DEFAULTS[role] || [];
        const tablesExist = await this.checkTablesExist();

        if (!tablesExist) {
            this.setCachedPermissions(role, defaults);
            return defaults;
        }

        try {
            const dbPermissions = await this.fetchRolePermissionsFromDb(role);
            // Union DB + defaults (defaults win for essential product permissions)
            const permissions = Array.from(new Set([...dbPermissions, ...defaults]));
            this.setCachedPermissions(role, permissions);
            return permissions;
        } catch (error) {
            this.logger.warn(`DB permission lookup failed for ${role}, using defaults`);
            this.setCachedPermissions(role, defaults);
            return defaults;
        }
    }

    /**
     * Supports both role_permissions schemas used in this codebase:
     * - role varchar column (PermissionTableInitService / older seeds)
     * - role_id UUID FK → roles.name (seed-permissions.sql / raw-permission.service)
     */
    private async fetchRolePermissionsFromDb(roleName: string): Promise<string[]> {
        // Prefer role_id schema when that column exists
        const columns = await this.dataSource.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'role_permissions'
               AND column_name IN ('role', 'role_id')`,
        );
        const columnNames = new Set(columns.map((c: any) => c.column_name));

        if (columnNames.has('role_id')) {
            const result = await this.dataSource.query(
                `SELECT p.resource || ':' || p.action as permission
                 FROM permissions p
                 INNER JOIN role_permissions rp ON p.id = rp.permission_id
                 INNER JOIN roles r ON r.id = rp.role_id
                 WHERE r.name = $1
                 ORDER BY p.resource, p.action`,
                [roleName],
            );
            return result.map((r: any) => r.permission);
        }

        if (columnNames.has('role')) {
            const result = await this.dataSource.query(
                `SELECT p.resource || ':' || p.action as permission
                 FROM permissions p
                 INNER JOIN role_permissions rp ON p.id = rp.permission_id
                 WHERE rp.role = $1
                 ORDER BY p.resource, p.action`,
                [roleName],
            );
            return result.map((r: any) => r.permission);
        }

        return [];
    }

    /**
     * Check if a role has a specific permission
     * Note: ADMIN has tenant-level permissions (scoped to their tenant)
     *       SUPER_ADMIN has system-level permissions (all tenants)
     */
    async roleHasPermission(roleName: string, permission: string): Promise<boolean> {
        const role = this.normalizeRole(roleName);
        // SUPER_ADMIN has system-level all permissions
        if (role === 'SUPER_ADMIN') {
            return true;
        }
        // ADMIN has tenant-level all permissions (enforced by TenantGuard)
        if (role === 'ADMIN') {
            return true;
        }

        const permissions = await this.getRolePermissions(role);
        
        // Check for wildcard permission
        if (permissions.includes('*')) {
            return true;
        }
        
        return permissions.includes(permission);
    }

    /**
     * Check if a role has any of the specified permissions
     */
    async roleHasAnyPermission(roleName: string, permissions: string[]): Promise<boolean> {
        const role = this.normalizeRole(roleName);
        // SUPER_ADMIN has system-level all permissions
        if (role === 'SUPER_ADMIN') {
            return true;
        }
        // ADMIN has tenant-level all permissions (enforced by TenantGuard)
        if (role === 'ADMIN') {
            return true;
        }

        const rolePermissions = await this.getRolePermissions(role);
        
        // Check for wildcard permission
        if (rolePermissions.includes('*')) {
            return true;
        }
        
        return permissions.some(p => rolePermissions.includes(p));
    }

    /**
     * Check if a role has all of the specified permissions
     */
    async roleHasAllPermissions(roleName: string, permissions: string[]): Promise<boolean> {
        const role = this.normalizeRole(roleName);
        // SUPER_ADMIN has system-level all permissions
        if (role === 'SUPER_ADMIN') {
            return true;
        }
        // ADMIN has tenant-level all permissions (enforced by TenantGuard)
        if (role === 'ADMIN') {
            return true;
        }

        const rolePermissions = await this.getRolePermissions(role);
        
        // Check for wildcard permission
        if (rolePermissions.includes('*')) {
            return true;
        }
        
        return permissions.every(p => rolePermissions.includes(p));
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
        try {
            const result = await this.dataSource.query(
                `SELECT 
                    id, 
                    resource || ':' || action as name, 
                    resource, 
                    action, 
                    description, 
                    category
                 FROM permissions
                 ORDER BY category, resource, action`
            );
            return result;
        } catch (error) {
            this.logger.error('Error fetching all permissions:', error);
            return [];
        }
    }

    /**
     * Check if a permission exists in database
     */
    async permissionExists(permission: string): Promise<boolean> {
        const [resource, action] = permission.split(':');
        if (!resource || !action) {
            return false;
        }

        try {
            const result = await this.dataSource.query(
                `SELECT COUNT(*) as count FROM permissions WHERE resource = $1 AND action = $2`,
                [resource, action]
            );
            return parseInt(result[0].count) > 0;
        } catch (error) {
            this.logger.error(`Error checking if permission exists: ${permission}`, error);
            return false;
        }
    }

    /**
     * Get permissions grouped by category
     */
    async getPermissionsByCategory(): Promise<Record<string, Array<{
        id: string;
        name: string;
        resource: string;
        action: string;
        description: string;
    }>>> {
        try {
            const permissions = await this.getAllPermissions();
            const grouped: Record<string, any[]> = {};

            permissions.forEach(perm => {
                const category = perm.category || 'Other';
                if (!grouped[category]) {
                    grouped[category] = [];
                }
                grouped[category].push(perm);
            });

            return grouped;
        } catch (error) {
            this.logger.error('Error grouping permissions by category:', error);
            return {};
        }
    }

    /**
     * Clear permission cache for a specific role
     */
    clearRoleCache(roleName: string): void {
        this.permissionCache.delete(roleName);
        this.cacheExpiry.delete(roleName);
        this.logger.debug(`Cleared permission cache for role: ${roleName}`);
    }

    /**
     * Clear all permission caches
     */
    clearAllCaches(): void {
        this.permissionCache.clear();
        this.cacheExpiry.clear();
        this.logger.debug('Cleared all permission caches');
    }

    /**
     * Get cached permissions if not expired
     */
    private getCachedPermissions(roleName: string): string[] | null {
        const expiry = this.cacheExpiry.get(roleName);
        if (!expiry || Date.now() > expiry) {
            return null;
        }

        return this.permissionCache.get(roleName) || null;
    }

    /**
     * Set cached permissions with expiry
     */
    private setCachedPermissions(roleName: string, permissions: string[]): void {
        this.permissionCache.set(roleName, permissions);
        this.cacheExpiry.set(roleName, Date.now() + this.CACHE_TTL);
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        roles: string[];
        ttl: number;
    } {
        return {
            size: this.permissionCache.size,
            roles: Array.from(this.permissionCache.keys()),
            ttl: this.CACHE_TTL
        };
    }
}
