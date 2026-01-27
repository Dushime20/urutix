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
     * Get all permissions for a user (role-based + user-specific overrides)
     */
    async getUserPermissions(userId: string): Promise<string[]> {
        // First get the user's role
        const userResult = await this.dataSource.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.length === 0) {
            throw new Error('User not found');
        }

        const userRole: UserRole = userResult[0].role;

        // SUPER_ADMIN gets all permissions
        if (userRole === 'SUPER_ADMIN') {
            const allPermsResult = await this.dataSource.query(
                'SELECT name FROM permissions ORDER BY name'
            );
            return allPermsResult.map((row: any) => row.name);
        }

        // Get role-based permissions
        const rolePerms = await this.getRolePermissions(userRole);

        // Get user-specific permission overrides
        const userPerms = await this.getUserSpecificPermissions(userId);

        // Merge permissions (user-specific overrides role)
        return this.mergePermissions(rolePerms, userPerms);
    }

    /**
     * Get permissions assigned to a specific role
     */
    private async getRolePermissions(role: UserRole): Promise<string[]> {
        const result = await this.dataSource.query(
            `SELECT p.name 
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role = $1`,
            [role]
        );

        return result.map((row: any) => row.name);
    }

    /**
     * Get all role-permission mappings (Matrix View)
     */
    async getAllRolePermissionsMatrix(): Promise<Array<{ role: string; permission: string }>> {
        const result = await this.dataSource.query(
            `SELECT rp.role, p.name as permission
             FROM role_permissions rp
             INNER JOIN permissions p ON rp.permission_id = p.id
             ORDER BY rp.role, p.name`
        );
        return result;
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
            // Get permission ID
            const permResult = await queryRunner.query(
                'SELECT id FROM permissions WHERE name = $1',
                [permissionName]
            );

            if (permResult.length === 0) {
                throw new Error(`Permission not found: ${permissionName}`);
            }

            const permissionId = permResult[0].id;

            // Insert into role_permissions
            await queryRunner.query(
                `INSERT INTO role_permissions (role, permission_id, granted_at, granted_by)
                 VALUES ($1, $2, NOW(), $3)
                 ON CONFLICT (role, permission_id) DO NOTHING`,
                [role, permissionId, grantedBy]
            );

            // Log audit
            await this.logAudit(
                'grant_role_permission',
                'role',
                role,
                grantedBy,
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
            // Get permission ID
            const permResult = await queryRunner.query(
                'SELECT id FROM permissions WHERE name = $1',
                [permissionName]
            );

            if (permResult.length === 0) {
                throw new Error(`Permission not found: ${permissionName}`);
            }

            const permissionId = permResult[0].id;

            // Delete from role_permissions
            await queryRunner.query(
                'DELETE FROM role_permissions WHERE role = $1 AND permission_id = $2',
                [role, permissionId]
            );

            // Log audit
            await this.logAudit(
                'revoke_role_permission',
                'role',
                role,
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
     * Get user-specific permission grants and denials
     */
    private async getUserSpecificPermissions(
        userId: string
    ): Promise<{ granted: string[]; denied: string[] }> {
        const result = await this.dataSource.query(
            `SELECT p.name, up.is_granted, up.expires_at
       FROM permissions p
       INNER JOIN user_permissions up ON p.id = up.permission_id
       WHERE up.user_id = $1 
       AND (up.expires_at IS NULL OR up.expires_at > NOW())`,
            [userId]
        );

        const granted: string[] = [];
        const denied: string[] = [];

        result.forEach((row: any) => {
            if (row.is_granted) {
                granted.push(row.name);
            } else {
                denied.push(row.name);
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
            const permResult = await queryRunner.query(
                'SELECT id FROM permissions WHERE name = $1',
                [permissionName]
            );

            if (permResult.length === 0) {
                throw new Error(`Permission not found: ${permissionName}`);
            }

            const permissionId = permResult[0].id;

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
            const permResult = await queryRunner.query(
                'SELECT id FROM permissions WHERE name = $1',
                [permissionName]
            );

            if (permResult.length === 0) {
                throw new Error(`Permission not found: ${permissionName}`);
            }

            const permissionId = permResult[0].id;

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
            const permResult = await queryRunner.query(
                'SELECT id FROM permissions WHERE name = $1',
                [permissionName]
            );

            if (permResult.length === 0) {
                throw new Error(`Permission not found: ${permissionName}`);
            }

            const permissionId = permResult[0].id;

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
       LEFT JOIN role_permissions rp ON u.role = rp.role
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
}
