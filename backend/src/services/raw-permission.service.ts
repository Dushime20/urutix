import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Permission, UserRole, AuditContext } from '../types/permission.types';

/**
 * PermissionService
 * Handles all permission-related operations including checking, granting, revoking, and auditing
 */
@Injectable()
export class PermissionService {
    constructor(private dataSource: DataSource) { }

    /**
     * Convert permission name from resource:action format to permission ID
     * Handles both formats: "resource:action" and "resource.action"
     */
    private async getPermissionIdByName(permissionName: string): Promise<string> {
        // Try to parse as resource:action format
        const parts = permissionName.split(':');
        
        if (parts.length === 2) {
            // Format: "resource:action"
            const [resource, action] = parts;
            const result = await this.dataSource.query(
                'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
                [resource.trim(), action.trim()]
            );
            
            if (result.length > 0) {
                return result[0].id;
            }
        }
        
        // Try with dot separator (resource.action)
        const dotParts = permissionName.split('.');
        if (dotParts.length === 2) {
            const [resource, action] = dotParts;
            const result = await this.dataSource.query(
                'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
                [resource.trim(), action.trim()]
            );
            
            if (result.length > 0) {
                return result[0].id;
            }
        }
        
        throw new Error(`Permission not found: ${permissionName}. Format should be "resource:action" (e.g., "users:view_own")`);
    }

    /**
     * Get all permissions for a user (role-based + user-specific overrides)
     */
    async getUserPermissions(userId: string): Promise<string[]> {
        console.log('[PermissionService] getUserPermissions called for userId:', userId);
        
        // First get the user's role
        const userResult = await this.dataSource.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );

        console.log('[PermissionService] User query result:', userResult);

        if (userResult.length === 0) {
            console.error('[PermissionService] User not found:', userId);
            throw new Error('User not found');
        }

        const userRole: UserRole = userResult[0].role;
        console.log('[PermissionService] User role:', userRole);

        // SUPER_ADMIN gets all permissions
        if (userRole === 'SUPER_ADMIN') {
            const allPermsResult = await this.dataSource.query(
                'SELECT resource, action FROM permissions ORDER BY resource, action'
            );
            return allPermsResult.map((row: any) => `${row.resource}:${row.action}`);
        }

        // Get role-based permissions
        const rolePerms = await this.getRolePermissions(userRole);
        console.log('[PermissionService] Role permissions:', rolePerms);

        // Get user-specific permission overrides
        const userPerms = await this.getUserSpecificPermissions(userId);
        console.log('[PermissionService] User-specific permissions:', userPerms);

        // Merge permissions (user-specific overrides role)
        const merged = this.mergePermissions(rolePerms, userPerms);
        console.log('[PermissionService] Merged permissions:', merged);
        
        return merged;
    }

    /**
     * Get permissions assigned to a specific role
     */
    private async getRolePermissions(role: UserRole): Promise<string[]> {
        const result = await this.dataSource.query(
            `SELECT p.resource, p.action
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN roles r ON rp.role_id = r.id
       WHERE r.name = $1`,
            [role]
        );
        return result.map((row: any) => `${row.resource}:${row.action}`);
    }

    /**
     * Get all role-permission mappings (Matrix View)
     * Returns roles with their permissions and all available permissions
     */
    async getAllRolePermissionsMatrix(): Promise<{ roles: any[]; permissions: any[] }> {
        // Get all roles with their permissions using role_id UUID FK
        const rolesQuery = `
            SELECT 
                r.id,
                r.name,
                r.description,
                r.is_system as "isSystem",
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'name', CONCAT(p.resource, '.', p.action),
                            'resource', p.resource,
                            'action', p.action,
                            'description', p.description,
                            'category', p.category
                        )
                    ) FILTER (WHERE p.id IS NOT NULL),
                    '[]'
                ) as permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            GROUP BY r.id, r.name, r.description, r.is_system
            ORDER BY r.name
        `;

        // Get all available permissions
        const permissionsQuery = `
            SELECT 
                id,
                name,
                resource,
                action,
                description,
                category
            FROM permissions
            ORDER BY category, resource, action
        `;

        const [roles, permissions] = await Promise.all([
            this.dataSource.query(rolesQuery),
            this.dataSource.query(permissionsQuery),
        ]);

        return { roles, permissions };
    }

    /**
     * Grant a permission to a Role (System-wide default)
     */
    async grantRolePermission(
        role: UserRole,
        permissionName: string,
        grantedBy: string,
        auditContext?: AuditContext
    ): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validate inputs
            if (!role || !permissionName) {
                throw new Error('Role and permission name are required');
            }

            // Resolve role UUID
            const roleRows = await queryRunner.query(
                'SELECT id FROM roles WHERE name = $1', [role]
            );
            if (!roleRows.length) {
                throw new Error(`Role "${role}" not found in database. Available roles should be seeded first.`);
            }
            const roleId = roleRows[0].id;

            // Resolve permission UUID
            let permissionId: string;
            try {
                permissionId = await this.getPermissionIdByName(permissionName);
            } catch (error) {
                throw new Error(`Permission "${permissionName}" not found. Ensure permissions are seeded. Format should be "resource:action" (e.g., "cargo:create")`);
            }

            // Check if already exists
            const existing = await queryRunner.query(
                'SELECT role_id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
                [roleId, permissionId]
            );

            if (existing.length > 0) {
                // Already exists, just return success
                await queryRunner.commitTransaction();
                return;
            }

            // Insert into role_permissions (uses role_id UUID FK)
            await queryRunner.query(
                `INSERT INTO role_permissions (role_id, permission_id)
                 VALUES ($1, $2)
                 ON CONFLICT (role_id, permission_id) DO NOTHING`,
                [roleId, permissionId]
            );

            await this.logAudit(
                'grant_role_permission', 'role', role, grantedBy,
                { permission: permissionName }, auditContext, queryRunner
            );

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Revoke a permission from a Role
     */
    async revokeRolePermission(
        role: UserRole,
        permissionName: string,
        revokedBy: string,
        auditContext?: AuditContext
    ): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Resolve role UUID
            const roleRows = await queryRunner.query(
                'SELECT id FROM roles WHERE name = $1', [role]
            );
            if (!roleRows.length) throw new Error(`Role "${role}" not found`);
            const roleId = roleRows[0].id;

            // Resolve permission UUID
            const permissionId = await this.getPermissionIdByName(permissionName);

            // Delete from role_permissions using role_id UUID FK
            await queryRunner.query(
                'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
                [roleId, permissionId]
            );

            await this.logAudit(
                'revoke_role_permission', 'role', role, revokedBy,
                { permission: permissionName }, auditContext, queryRunner
            );

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get user-specific permission grants and denials
     */
    private async getUserSpecificPermissions(
        userId: string
    ): Promise<{ granted: string[]; denied: string[] }> {
        const result = await this.dataSource.query(
            `SELECT p.resource, p.action, up.is_granted, up.expires_at
       FROM permissions p
       INNER JOIN user_permissions up ON p.id = up.permission_id
       WHERE up.user_id = $1 
       AND (up.expires_at IS NULL OR up.expires_at > NOW())`,
            [userId]
        );

        const granted: string[] = [];
        const denied: string[] = [];

        result.forEach((row: any) => {
            const permissionName = `${row.resource}:${row.action}`;
            if (row.is_granted) {
                granted.push(permissionName);
            } else {
                denied.push(permissionName);
            }
        });

        return { granted, denied };
    }

    /**
     * Merge role permissions with user-specific permissions
     * User-specific grants add to role permissions
     * User-specific denials remove from role permissions
     */
    private mergePermissions(
        rolePerms: string[],
        userPerms: { granted: string[]; denied: string[] }
    ): string[] {
        const permissionSet = new Set(rolePerms);

        // Add user-specific grants
        userPerms.granted.forEach(perm => permissionSet.add(perm));

        // Remove user-specific denials
        userPerms.denied.forEach(perm => permissionSet.delete(perm));

        return Array.from(permissionSet).sort();
    }

    /**
     * Check if a user has a specific permission
     */
    async checkPermission(userId: string, permission: string): Promise<boolean> {
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes(permission);
    }

    /**
     * Check if a user has ANY of the specified permissions
     */
    async checkAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId);
        return permissions.some(perm => userPermissions.includes(perm));
    }

    /**
     * Check if a user has ALL of the specified permissions
     */
    async checkAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId);
        return permissions.every(perm => userPermissions.includes(perm));
    }

    /**
     * Grant a permission to a specific user (override role permissions)
     */
    async grantUserPermission(
        userId: string,
        permissionName: string,
        grantedBy: string,
        reason?: string,
        expiresAt?: Date,
        auditContext?: AuditContext
    ): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Get permission ID
            const permissionId = await this.getPermissionIdByName(permissionName);

            // Upsert user permission
            await queryRunner.query(
                `INSERT INTO user_permissions (user_id, permission_id, is_granted, granted_by, reason, expires_at)
         VALUES ($1, $2, true, $3, $4, $5)
         ON CONFLICT (user_id, permission_id)
         DO UPDATE SET 
           is_granted = true,
           granted_by = $3,
           reason = $4,
           expires_at = $5,
           granted_at = NOW()`,
                [userId, permissionId, grantedBy, reason, expiresAt]
            );

            // Log audit trail
            await this.logAudit(
                'grant_user_permission',
                'user',
                userId,
                grantedBy,
                {
                    permission: permissionName,
                    reason,
                    expires_at: expiresAt,
                },
                auditContext,
                queryRunner
            );

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Revoke a permission from a specific user (remove override)
     */
    async revokeUserPermission(
        userId: string,
        permissionName: string,
        revokedBy: string,
        auditContext?: AuditContext
    ): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Get permission ID
            const permissionId = await this.getPermissionIdByName(permissionName);

            // Delete user permission override
            await queryRunner.query(
                'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
                [userId, permissionId]
            );

            // Log audit trail
            await this.logAudit(
                'revoke_user_permission',
                'user',
                userId,
                revokedBy,
                { permission: permissionName },
                auditContext,
                queryRunner
            );

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Deny a permission to a specific user (explicit denial overrides role)
     */
    async denyUserPermission(
        userId: string,
        permissionName: string,
        deniedBy: string,
        reason?: string,
        auditContext?: AuditContext
    ): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Get permission ID
            const permissionId = await this.getPermissionIdByName(permissionName);

            // Upsert user permission denial
            await queryRunner.query(
                `INSERT INTO user_permissions (user_id, permission_id, is_granted, granted_by, reason)
         VALUES ($1, $2, false, $3, $4)
         ON CONFLICT (user_id, permission_id)
         DO UPDATE SET 
           is_granted = false,
           granted_by = $3,
           reason = $4,
           granted_at = NOW()`,
                [userId, permissionId, deniedBy, reason]
            );

            // Log audit trail
            await this.logAudit(
                'deny_user_permission',
                'user',
                userId,
                deniedBy,
                { permission: permissionName, reason },
                auditContext,
                queryRunner
            );

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get all available permissions
     */
    async getAllPermissions(): Promise<Permission[]> {
        const result = await this.dataSource.query(
            'SELECT * FROM permissions ORDER BY resource, action'
        );
        return result;
    }

    /**
     * Get permissions by resource
     */
    async getPermissionsByResource(resource: string): Promise<Permission[]> {
        const result = await this.dataSource.query(
            'SELECT * FROM permissions WHERE resource = $1 ORDER BY action',
            [resource]
        );
        return result;
    }

    /**
     * Get user's permission details (with source information)
     */
    async getUserPermissionDetails(userId: string): Promise<Array<{
        permission: string;
        source: 'role_based' | 'user_granted' | 'user_denied';
        granted_at?: Date;
        granted_by?: string;
        reason?: string;
        expires_at?: Date;
    }>> {
        const result = await this.dataSource.query(
            `SELECT 
        p.name as permission,
        CASE 
          WHEN up.id IS NOT NULL THEN 
            CASE WHEN up.is_granted THEN 'user_granted' ELSE 'user_denied' END
          ELSE 'role_based'
        END as source,
        COALESCE(up.granted_at, rp.granted_at) as granted_at,
        up.granted_by,
        up.reason,
        up.expires_at
       FROM users u
       LEFT JOIN role_permissions rp ON rp.role_id = (SELECT id FROM roles WHERE name = u.role LIMIT 1)
       LEFT JOIN permissions p ON rp.permission_id = p.id
       LEFT JOIN user_permissions up ON u.id = up.user_id AND p.id = up.permission_id
       WHERE u.id = $1 AND (up.id IS NULL OR up.is_granted = true)
       ORDER BY p.resource, p.action`,
            [userId]
        );

        return result;
    }

    /**
     * Log permission audit trail
     */
    private async logAudit(
        action: string,
        entityType: string,
        entityId: string,
        userId: string,
        changes: Record<string, any>,
        auditContext?: AuditContext,
        queryRunner?: any
    ): Promise<void> {
        try {
            const runner = queryRunner || this.dataSource;

            await runner.query(
                `INSERT INTO permission_audit_log 
           (action, entity_type, entity_id, user_id, changes, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    action,
                    entityType,
                    entityId,
                    userId,
                    JSON.stringify(changes),
                    auditContext?.ipAddress || null,
                    auditContext?.userAgent || null,
                ]
            );
        } catch (error) {
            // Audit logging is optional - don't fail the operation if audit table doesn't exist
            console.warn(`Failed to log audit trail: ${error.message}`);
        }
    }

    /**
     * Get audit log for a user
     */
    async getUserAuditLog(
        userId: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<Array<{
        action: string;
        changes: Record<string, any>;
        performed_by?: string;
        ip_address?: string;
        created_at: Date;
    }>> {
        const result = await this.dataSource.query(
            `SELECT 
        pal.action,
        pal.changes,
        u.email as performed_by,
        pal.ip_address,
        pal.created_at
       FROM permission_audit_log pal
       LEFT JOIN users u ON pal.user_id = u.id
       WHERE pal.entity_type = 'user' AND pal.entity_id = $1
       ORDER BY pal.created_at DESC
       LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        return result;
    }

    /**
     * Get all roles with their permissions
     */
    async getAllRoles(): Promise<Array<{
        id: string;
        name: string;
        description: string;
        isSystem: boolean;
        permissions: Array<{ id: string; resource: string; action: string; description: string }>;
    }>> {
        const roles = await this.dataSource.query(
            `SELECT id, name, description, is_system as "isSystem", created_at as "createdAt", updated_at as "updatedAt"
             FROM roles
             ORDER BY is_system DESC, name ASC`
        );

        // Get permissions for each role using role_id UUID FK
        for (const role of roles) {
            const permissions = await this.dataSource.query(
                `SELECT p.id, p.resource, p.action, p.description
                 FROM permissions p
                 INNER JOIN role_permissions rp ON p.id = rp.permission_id
                 WHERE rp.role_id = $1
                 ORDER BY p.resource, p.action`,
                [role.id]
            );
            role.permissions = permissions;
        }

        return roles;
    }

    /**
     * Create a new custom role
     */
    async createRole(
        name: string,
        description: string,
        permissionIds: string[],
        createdBy: string
    ): Promise<{ id: string; name: string; description: string; isSystem: boolean }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if role name already exists
            const existing = await queryRunner.query(
                'SELECT id FROM roles WHERE name = $1',
                [name]
            );

            if (existing.length > 0) {
                throw new Error(`Role with name '${name}' already exists`);
            }

            // Create the role
            const result = await queryRunner.query(
                `INSERT INTO roles (name, description, is_system, created_at, updated_at)
                 VALUES ($1, $2, false, NOW(), NOW())
                 RETURNING id, name, description, is_system as "isSystem"`,
                [name, description || null]
            );

            const role = result[0];

            // Assign permissions if provided using role_id UUID FK
            if (permissionIds && permissionIds.length > 0) {
                for (const permissionId of permissionIds) {
                    await queryRunner.query(
                        `INSERT INTO role_permissions (role_id, permission_id)
                         VALUES ($1, $2)
                         ON CONFLICT (role_id, permission_id) DO NOTHING`,
                        [role.id, permissionId]
                    );
                }
            }

            // Log audit
            await this.logAudit(
                'create_role',
                'role',
                role.id,
                createdBy,
                { name, description, permissionIds },
                undefined,
                queryRunner
            );

            await queryRunner.commitTransaction();
            return role;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Update a role (name and description only, not permissions)
     */
    async updateRole(
        roleId: string,
        name?: string,
        description?: string,
        updatedBy?: string
    ): Promise<{ id: string; name: string; description: string; isSystem: boolean }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if role exists and is not a system role
            const existing = await queryRunner.query(
                'SELECT id, name, description, is_system as "isSystem" FROM roles WHERE id = $1',
                [roleId]
            );

            if (existing.length === 0) {
                throw new Error('Role not found');
            }

            if (existing[0].isSystem) {
                throw new Error('Cannot update system roles');
            }

            // Check if new name conflicts with existing role
            if (name && name !== existing[0].name) {
                const nameConflict = await queryRunner.query(
                    'SELECT id FROM roles WHERE name = $1 AND id != $2',
                    [name, roleId]
                );

                if (nameConflict.length > 0) {
                    throw new Error(`Role with name '${name}' already exists`);
                }
            }

            // Update the role
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (name !== undefined) {
                updates.push(`name = $${paramIndex++}`);
                values.push(name);
            }

            if (description !== undefined) {
                updates.push(`description = $${paramIndex++}`);
                values.push(description);
            }

            updates.push(`updated_at = NOW()`);
            values.push(roleId);

            const result = await queryRunner.query(
                `UPDATE roles SET ${updates.join(', ')}
                 WHERE id = $${paramIndex}
                 RETURNING id, name, description, is_system as "isSystem"`,
                values
            );

            // Log audit
            if (updatedBy) {
                await this.logAudit(
                    'update_role',
                    'role',
                    roleId,
                    updatedBy,
                    { name, description },
                    undefined,
                    queryRunner
                );
            }

            await queryRunner.commitTransaction();
            return result[0];
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Delete a custom role
     */
    async deleteRole(roleId: string, deletedBy: string): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if role exists and is not a system role
            const existing = await queryRunner.query(
                'SELECT id, name, is_system as "isSystem" FROM roles WHERE id = $1',
                [roleId]
            );

            if (existing.length === 0) {
                throw new Error('Role not found');
            }

            if (existing[0].isSystem) {
                throw new Error('Cannot delete system roles');
            }

            // Check if any users have this role
            const usersWithRole = await queryRunner.query(
                'SELECT COUNT(*) as count FROM users WHERE role = $1',
                [existing[0].name]
            );

            if (parseInt(usersWithRole[0].count) > 0) {
                throw new Error(`Cannot delete role '${existing[0].name}' because it is assigned to ${usersWithRole[0].count} user(s)`);
            }

            // Delete role permissions
            await queryRunner.query(
                'DELETE FROM role_permissions WHERE role_id = $1',
                [roleId]
            );

            // Delete the role
            await queryRunner.query(
                'DELETE FROM roles WHERE id = $1',
                [roleId]
            );

            // Log audit
            await this.logAudit(
                'delete_role',
                'role',
                roleId,
                deletedBy,
                { name: existing[0].name },
                undefined,
                queryRunner
            );

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Bulk assign permissions to a role
     */
    async bulkAssignPermissions(
        roleId: string,
        permissionIds: string[],
        grantedBy: string
    ): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Verify role exists (allow system roles — superadmin can edit them)
            const existing = await queryRunner.query(
                'SELECT id, name FROM roles WHERE id = $1',
                [roleId]
            );
            if (existing.length === 0) throw new Error('Role not found');

            // Remove all existing permissions for this role using role_id UUID FK
            await queryRunner.query(
                'DELETE FROM role_permissions WHERE role_id = $1',
                [roleId]
            );

            // Add new permissions using role_id UUID FK
            for (const permissionId of (permissionIds || [])) {
                await queryRunner.query(
                    `INSERT INTO role_permissions (role_id, permission_id)
                     VALUES ($1, $2)
                     ON CONFLICT (role_id, permission_id) DO NOTHING`,
                    [roleId, permissionId]
                );
            }

            await this.logAudit(
                'bulk_assign_permissions', 'role', roleId, grantedBy,
                { permissionIds, count: permissionIds.length },
                undefined, queryRunner
            );

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Get role by ID
     */
    async getRoleById(roleId: string): Promise<{
        id: string;
        name: string;
        description: string;
        isSystem: boolean;
        permissions: Array<{ id: string; resource: string; action: string; description: string }>;
    } | null> {
        const roles = await this.dataSource.query(
            `SELECT id, name, description, is_system as "isSystem"
             FROM roles
             WHERE id = $1`,
            [roleId]
        );

        if (roles.length === 0) {
            return null;
        }

        const role = roles[0];

        // Get permissions for this role using role_id UUID FK
        const permissions = await this.dataSource.query(
            `SELECT p.id, p.resource, p.action, p.description
             FROM permissions p
             INNER JOIN role_permissions rp ON p.id = rp.permission_id
             WHERE rp.role_id = $1
             ORDER BY p.resource, p.action`,
            [role.id]
        );

        role.permissions = permissions;
        return role;
    }
}
