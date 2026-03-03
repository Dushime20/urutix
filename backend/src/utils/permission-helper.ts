import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Permission Helper Utility
 * Provides database-driven permission checks with caching
 */
@Injectable()
export class PermissionHelper {
    private readonly logger = new Logger(PermissionHelper.name);
    private permissionCache: Map<string, string[]> = new Map();
    private cacheExpiry: Map<string, number> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor(private dataSource: DataSource) {}

    /**
     * Get all permissions for a role from database with caching
     */
    async getRolePermissions(roleName: string): Promise<string[]> {
        // Check cache first
        const cached = this.getCachedPermissions(roleName);
        if (cached) {
            return cached;
        }

        try {
            const result = await this.dataSource.query(
                `SELECT p.resource || ':' || p.action as permission
                 FROM permissions p
                 INNER JOIN role_permissions rp ON p.id = rp.permission_id
                 WHERE rp.role = $1
                 ORDER BY p.resource, p.action`,
                [roleName]
            );
            
            const permissions = result.map((r: any) => r.permission);
            
            // Cache the result
            this.setCachedPermissions(roleName, permissions);
            
            return permissions;
        } catch (error) {
            this.logger.error(`Error fetching permissions for role ${roleName}:`, error);
            return [];
        }
    }

    /**
     * Check if a role has a specific permission
     */
    async roleHasPermission(roleName: string, permission: string): Promise<boolean> {
        // SUPER_ADMIN always has all permissions
        if (roleName === 'SUPER_ADMIN') {
            return true;
        }

        const permissions = await this.getRolePermissions(roleName);
        return permissions.includes(permission);
    }

    /**
     * Check if a role has any of the specified permissions
     */
    async roleHasAnyPermission(roleName: string, permissions: string[]): Promise<boolean> {
        if (roleName === 'SUPER_ADMIN') {
            return true;
        }

        const rolePermissions = await this.getRolePermissions(roleName);
        return permissions.some(p => rolePermissions.includes(p));
    }

    /**
     * Check if a role has all of the specified permissions
     */
    async roleHasAllPermissions(roleName: string, permissions: string[]): Promise<boolean> {
        if (roleName === 'SUPER_ADMIN') {
            return true;
        }

        const rolePermissions = await this.getRolePermissions(roleName);
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
