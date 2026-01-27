import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { UserPermissionOverride } from '../entities/user-permission-override.entity';

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
        return await this.roleRepository.find({
            relations: ['permissions', 'inheritsFrom'],
            order: { name: 'ASC' },
        });
    }

    /**
     * Get role by ID
     */
    async getRoleById(id: string): Promise<Role> {
        const role = await this.roleRepository.findOne({
            where: { id },
            relations: ['permissions', 'inheritsFrom'],
        });

        if (!role) {
            throw new NotFoundException('Role not found');
        }

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

        const role = this.roleRepository.create({
            name: data.name,
            description: data.description,
        });

        if (data.permissionIds && data.permissionIds.length > 0) {
            role.permissions = await this.permissionRepository.find({
                where: { id: In(data.permissionIds) },
            });
        }

        if (data.inheritsFromRoleIds && data.inheritsFromRoleIds.length > 0) {
            role.inheritsFrom = await this.roleRepository.find({
                where: { id: In(data.inheritsFromRoleIds) },
            });
        }

        return await this.roleRepository.save(role);
    }

    /**
     * Update a role
     */
    async updateRole(id: string, data: UpdateRoleDto): Promise<Role> {
        const role = await this.getRoleById(id);

        if (role.isSystem) {
            throw new BadRequestException('Cannot modify system roles');
        }

        if (data.name) role.name = data.name;
        if (data.description !== undefined) role.description = data.description;

        if (data.permissionIds !== undefined) {
            if (data.permissionIds.length > 0) {
                role.permissions = await this.permissionRepository.find({
                    where: { id: In(data.permissionIds) },
                });
            } else {
                role.permissions = [];
            }
        }

        if (data.inheritsFromRoleIds !== undefined) {
            if (data.inheritsFromRoleIds.length > 0) {
                role.inheritsFrom = await this.roleRepository.find({
                    where: { id: In(data.inheritsFromRoleIds) },
                });
            } else {
                role.inheritsFrom = [];
            }
        }

        return await this.roleRepository.save(role);
    }

    /**
     * Delete a role
     */
    async deleteRole(id: string): Promise<void> {
        const role = await this.getRoleById(id);

        if (role.isSystem) {
            throw new BadRequestException('Cannot delete system roles');
        }

        await this.roleRepository.remove(role);
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
                granted: role.permissions.some(p => p.id === permission.id),
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
        const role = await this.getRoleById(roleId);

        if (role.isSystem) {
            throw new BadRequestException('Cannot modify system roles');
        }

        role.permissions = await this.permissionRepository.find({
            where: { id: In(permissionIds) },
        });

        return await this.roleRepository.save(role);
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
