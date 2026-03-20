import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from './../entities/permission.entity';
import { Role } from './../entities/role.entity';
import { UserPermissionOverride } from './../entities/user-permission-override.entity';

export interface CreatePermissionDto {
    resource: string;
    action: string;
    description?: string;
    category?: string;
}

export interface CreateRoleDto {
    name: string;
    description?: string;
    permissionIds?: string[];
    inheritsFromRoleIds?: string[];
}

export interface UpdateRoleDto {
    name?: string;
    description?: string;
    permissionIds?: string[];
    inheritsFromRoleIds?: string[];
}

export interface GrantPermissionOverrideDto {
    userId: string;
    permissionId: string;
    granted: boolean;
    reason?: string;
    grantedBy: string;
    expiresAt?: Date;
}

@Injectable()
export class RolePermissionService {
    constructor(
        @InjectRepository(Permission)
        private permissionRepository: Repository<Permission>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
        @InjectRepository(UserPermissionOverride)
        private permissionOverrideRepository: Repository<UserPermissionOverride>,
    ) { }

    /**
     * Get all permissions
     */
    async getAllPermissions(): Promise<Permission[]> {
        return await this.permissionRepository.find({
            order: { category: 'ASC', resource: 'ASC', action: 'ASC' },
        });
    }

    /**
     * Get permissions by category
     */
    async getPermissionsByCategory(category: string): Promise<Permission[]> {
        return await this.permissionRepository.find({
            where: { category },
            order: { resource: 'ASC', action: 'ASC' },
        });
    }

    /**
     * Create a permission
     */
    async createPermission(data: CreatePermissionDto): Promise<Permission> {
        const existing = await this.permissionRepository.findOne({
            where: { resource: data.resource, action: data.action },
        });

        if (existing) {
            throw new BadRequestException('Permission already exists');
        }

        const permission = this.permissionRepository.create(data);
        return await this.permissionRepository.save(permission);
    }

    /**
     * Get all roles
     */
    async getAllRoles(): Promise<Role[]> {
        // Use raw SQL query instead of TypeORM relations
        // because role_permissions table uses 'role' column (string) not 'role_id' (UUID)
        const query = `
            SELECT 
                r.id,
                r.name,
                r.description,
                r.is_system as "isSystem",
                r.created_at as "createdAt",
                r.updated_at as "updatedAt",
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'resource', p.resource,
                            'action', p.action,
                            'description', p.description
                        )
                    ) FILTER (WHERE p.id IS NOT NULL),
                    '[]'
                ) as permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.name = rp.role
            LEFT JOIN permissions p ON rp.permission_id = p.id
            GROUP BY r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at
            ORDER BY r.name ASC
        `;

        const roles = await this.roleRepository.manager.query(query);
        
        // Parse JSON permissions back to objects
        return roles.map(role => ({
            ...role,
            permissions: typeof role.permissions === 'string' 
                ? JSON.parse(role.permissions) 
                : role.permissions
        }));
    }

    /**
     * Get role by ID
     */
    async getRoleById(id: string): Promise<Role> {
        // Use raw SQL query instead of TypeORM relations
        // because role_permissions table uses 'role' column (string) not 'role_id' (UUID)
        const query = `
            SELECT 
                r.id,
                r.name,
                r.description,
                r.is_system as "isSystem",
                r.created_at as "createdAt",
                r.updated_at as "updatedAt",
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', p.id,
                            'resource', p.resource,
                            'action', p.action,
                            'description', p.description
                        )
                    ) FILTER (WHERE p.id IS NOT NULL),
                    '[]'
                ) as permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON r.name = rp.role
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE r.id = $1
            GROUP BY r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at
        `;

        const roles = await this.roleRepository.manager.query(query, [id]);

        if (!roles || roles.length === 0) {
            throw new NotFoundException('Role not found');
        }

        const role = roles[0];
        
        // Parse JSON permissions back to objects
        role.permissions = typeof role.permissions === 'string' 
            ? JSON.parse(role.permissions) 
            : role.permissions;

        return role;
    }

    /**
     * Create a role
     */
    async createRole(data: CreateRoleDto): Promise<Role> {
        const existing = await this.roleRepository.findOne({
            where: { name: data.name },
        });

        if (existing) {
            throw new BadRequestException('Role already exists');
        }

        const queryRunner = this.roleRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create the role
            const result = await queryRunner.query(
                `INSERT INTO roles (name, description, is_system, created_at, updated_at)
                 VALUES ($1, $2, false, NOW(), NOW())
                 RETURNING id, name, description, is_system as "isSystem", created_at as "createdAt", updated_at as "updatedAt"`,
                [data.name, data.description || null]
            );

            const role = result[0];

            // Assign permissions if provided
            // Note: role_permissions uses 'role' column (string) not 'role_id'
            if (data.permissionIds && data.permissionIds.length > 0) {
                for (const permissionId of data.permissionIds) {
                    await queryRunner.query(
                        `INSERT INTO role_permissions (role, permission_id, granted_at, granted_by)
                         VALUES ($1, $2, NOW(), 'system')
                         ON CONFLICT (role, permission_id) DO NOTHING`,
                        [role.name, permissionId]
                    );
                }
            }

            await queryRunner.commitTransaction();

            // Return role with permissions
            return await this.getRoleById(role.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Update a role
     */
    async updateRole(id: string, data: UpdateRoleDto): Promise<Role> {
        const role = await this.getRoleById(id);

        if (role.isSystem) {
            throw new BadRequestException('Cannot modify system roles');
        }

        const queryRunner = this.roleRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Update role name and description
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.name !== undefined) {
                // Check if new name conflicts with existing role
                if (data.name !== role.name) {
                    const nameConflict = await queryRunner.query(
                        'SELECT id FROM roles WHERE name = $1 AND id != $2',
                        [data.name, id]
                    );

                    if (nameConflict.length > 0) {
                        throw new BadRequestException(`Role with name '${data.name}' already exists`);
                    }
                }

                updates.push(`name = $${paramIndex++}`);
                values.push(data.name);
            }

            if (data.description !== undefined) {
                updates.push(`description = $${paramIndex++}`);
                values.push(data.description);
            }

            if (updates.length > 0) {
                updates.push(`updated_at = NOW()`);
                values.push(id);

                await queryRunner.query(
                    `UPDATE roles SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
                    values
                );
            }

            // Update permissions if provided
            // Note: role_permissions uses 'role' column (string) not 'role_id'
            if (data.permissionIds !== undefined) {
                const roleName = data.name || role.name;

                // Delete existing permissions
                await queryRunner.query(
                    'DELETE FROM role_permissions WHERE role = $1',
                    [roleName]
                );

                // Insert new permissions
                if (data.permissionIds.length > 0) {
                    for (const permissionId of data.permissionIds) {
                        await queryRunner.query(
                            `INSERT INTO role_permissions (role, permission_id, granted_at, granted_by)
                             VALUES ($1, $2, NOW(), 'system')
                             ON CONFLICT (role, permission_id) DO NOTHING`,
                            [roleName, permissionId]
                        );
                    }
                }
            }

            await queryRunner.commitTransaction();

            // Return updated role
            return await this.getRoleById(id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Delete a role
     */
    async deleteRole(id: string): Promise<void> {
        const role = await this.getRoleById(id);

        if (role.isSystem) {
            throw new BadRequestException('Cannot delete system roles');
        }

        // Check if any users have this role
        const usersWithRole = await this.roleRepository.manager.query(
            'SELECT COUNT(*) as count FROM users WHERE role = $1',
            [role.name]
        );

        if (parseInt(usersWithRole[0].count) > 0) {
            throw new BadRequestException(`Cannot delete role '${role.name}' because it is assigned to ${usersWithRole[0].count} user(s)`);
        }

        const queryRunner = this.roleRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Delete role permissions first
            // Note: role_permissions uses 'role' column (string) not 'role_id'
            await queryRunner.query(
                'DELETE FROM role_permissions WHERE role = $1',
                [role.name]
            );

            // Delete the role
            await queryRunner.query(
                'DELETE FROM roles WHERE id = $1',
                [id]
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
     * Get permission matrix (roles x permissions)
     */
    async getPermissionMatrix() {
        const roles = await this.getAllRoles();
        const permissions = await this.getAllPermissions();

        const matrix = roles.map(role => ({
            roleId: role.id,
            roleName: role.name,
            isSystem: role.isSystem,
            permissions: permissions.map(permission => ({
                permissionId: permission.id,
                resource: permission.resource,
                action: permission.action,
                granted: Array.isArray(role.permissions) && role.permissions.some(p => p.id === permission.id),
            })),
        }));

        return { roles, permissions, matrix };
    }

    /**
     * Grant or revoke permission override for a user
     */
    async grantPermissionOverride(data: GrantPermissionOverrideDto): Promise<UserPermissionOverride> {
        const existing = await this.permissionOverrideRepository.findOne({
            where: { userId: data.userId, permissionId: data.permissionId },
        });

        if (existing) {
            existing.granted = data.granted;
            existing.reason = data.reason;
            existing.grantedBy = data.grantedBy;
            existing.expiresAt = data.expiresAt;
            return await this.permissionOverrideRepository.save(existing);
        }

        const override = this.permissionOverrideRepository.create(data);
        return await this.permissionOverrideRepository.save(override);
    }

    /**
     * Get user permission overrides
     */
    async getUserPermissionOverrides(userId: string): Promise<UserPermissionOverride[]> {
        return await this.permissionOverrideRepository.find({
            where: { userId },
            relations: ['permission', 'grantedByUser'],
        });
    }

    /**
     * Remove permission override
     */
    async removePermissionOverride(id: string): Promise<void> {
        await this.permissionOverrideRepository.delete(id);
    }

    /**
     * Check if user has permission (considering role and overrides)
     */
    async checkUserPermission(
        userId: string,
        resource: string,
        action: string,
        userRoles: string[],
    ): Promise<boolean> {
        // Check for user-specific override first
        const override = await this.permissionOverrideRepository.findOne({
            where: { userId },
            relations: ['permission'],
        });

        if (override) {
            if (
                override.permission.resource === resource &&
                override.permission.action === action
            ) {
                // Check if override is expired
                if (override.expiresAt && override.expiresAt < new Date()) {
                    await this.permissionOverrideRepository.remove(override);
                } else {
                    return override.granted;
                }
            }
        }

        // Check role permissions
        const roles = await this.roleRepository.find({
            where: { name: In(userRoles) },
            relations: ['permissions', 'inheritsFrom'],
        });

        for (const role of roles) {
            // Check direct permissions
            const hasPermission = role.permissions.some(
                p => p.resource === resource && p.action === action,
            );

            if (hasPermission) return true;

            // Check inherited permissions
            if (role.inheritsFrom && role.inheritsFrom.length > 0) {
                const inheritedRoles = await this.roleRepository.find({
                    where: { id: In(role.inheritsFrom.map(r => r.id)) },
                    relations: ['permissions'],
                });

                for (const inheritedRole of inheritedRoles) {
                    const hasInheritedPermission = inheritedRole.permissions.some(
                        p => p.resource === resource && p.action === action,
                    );

                    if (hasInheritedPermission) return true;
                }
            }
        }

        return false;
    }

    /**
     * Bulk assign permissions to role
     */
    async bulkAssignPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
        // Get role first to check if it exists and is not a system role
        const role = await this.getRoleById(roleId);

        if (role.isSystem) {
            throw new BadRequestException('Cannot modify system roles');
        }

        // Use raw SQL to delete and insert permissions
        // because role_permissions table uses 'role' column (string) not 'role_id' (UUID)
        const queryRunner = this.roleRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Delete existing permissions for this role
            await queryRunner.query(
                'DELETE FROM role_permissions WHERE role = $1',
                [role.name]
            );

            // Insert new permissions
            if (permissionIds && permissionIds.length > 0) {
                for (const permissionId of permissionIds) {
                    await queryRunner.query(
                        `INSERT INTO role_permissions (role, permission_id, granted_at, granted_by)
                         VALUES ($1, $2, NOW(), 'system')
                         ON CONFLICT (role, permission_id) DO NOTHING`,
                        [role.name, permissionId]
                    );
                }
            }

            await queryRunner.commitTransaction();

            // Return updated role
            return await this.getRoleById(roleId);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Seed default permissions
     */
    async seedDefaultPermissions(): Promise<void> {
        const defaultPermissions = [
            // User Management
            { resource: 'users', action: 'view', category: 'user_management', description: 'View users' },
            { resource: 'users', action: 'create', category: 'user_management', description: 'Create users' },
            { resource: 'users', action: 'update', category: 'user_management', description: 'Update users' },
            { resource: 'users', action: 'delete', category: 'user_management', description: 'Delete users' },

            // Load Management
            { resource: 'loads', action: 'view', category: 'load_management', description: 'View loads' },
            { resource: 'loads', action: 'create', category: 'load_management', description: 'Create loads' },
            { resource: 'loads', action: 'update', category: 'load_management', description: 'Update loads' },
            { resource: 'loads', action: 'delete', category: 'load_management', description: 'Delete loads' },

            // Financial
            { resource: 'payments', action: 'view', category: 'financial', description: 'View payments' },
            { resource: 'payments', action: 'process', category: 'financial', description: 'Process payments' },
            { resource: 'payments', action: 'refund', category: 'financial', description: 'Refund payments' },

            // System Settings
            { resource: 'settings', action: 'view', category: 'system', description: 'View settings' },
            { resource: 'settings', action: 'update', category: 'system', description: 'Update settings' },

            // Permissions
            { resource: 'permissions', action: 'view', category: 'security', description: 'View permissions' },
            { resource: 'permissions', action: 'manage', category: 'security', description: 'Manage permissions' },
        ];

        for (const perm of defaultPermissions) {
            const existing = await this.permissionRepository.findOne({
                where: { resource: perm.resource, action: perm.action },
            });

            if (!existing) {
                await this.permissionRepository.save(this.permissionRepository.create(perm));
            }
        }
    }

    /**
     * Get role templates for quick creation
     */
    getRoleTemplates() {
        return [
            {
                name: 'Viewer',
                description: 'Read-only access to most resources.',
                permissions: [
                    { resource: 'users', action: 'view' },
                    { resource: 'loads', action: 'view' },
                    { resource: 'payments', action: 'view' },
                    { resource: 'settings', action: 'view' },
                    { resource: 'permissions', action: 'view' }
                ]
            },
            {
                name: 'Operation Manager',
                description: 'Can manage daily operations (users, loads) but not system settings.',
                permissions: [
                    { resource: 'users', action: 'view' },
                    { resource: 'users', action: 'update' },
                    { resource: 'users', action: 'create' },
                    { resource: 'loads', action: 'view' },
                    { resource: 'loads', action: 'update' },
                    { resource: 'loads', action: 'create' },
                    { resource: 'loads', action: 'delete' },
                    { resource: 'payments', action: 'view' },
                    { resource: 'payments', action: 'process' }
                ]
            },
            {
                name: 'Support Agent',
                description: 'Can view users and loads to assist customers.',
                permissions: [
                    { resource: 'users', action: 'view' },
                    { resource: 'loads', action: 'view' },
                    { resource: 'payments', action: 'view' }
                ]
            }
        ];
    }
}
