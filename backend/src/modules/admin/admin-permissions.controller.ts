import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../types/permission.types';
import { PermissionService } from '../../services/raw-permission.service';
import { GrantPermissionDto, RevokePermissionDto, DenyPermissionDto, GrantRolePermissionDto, RevokeRolePermissionDto } from './dto/permission.dto';
import { Request } from 'express';
import { DataSource } from 'typeorm';

@ApiTags('Admin Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/permissions')
export class AdminPermissionsController {
    private readonly logger = new Logger(AdminPermissionsController.name);

    constructor(
        private readonly permissionService: PermissionService,
        private readonly dataSource: DataSource,
    ) { }

    // ── GET /api/admin/permissions ─────────────────────────────────────────────
    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'List all permissions grouped by module' })
    async getAllPermissionsGrouped() {
        const result = await this.dataSource.query(`
            SELECT id, resource, action, category, description
            FROM permissions
            ORDER BY category, resource, action
        `);
        // Group by category
        const grouped: Record<string, any[]> = {};
        for (const p of result) {
            const cat = p.category || 'other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push({
                id: p.id,
                code: `${p.resource}.${p.action}`,
                resource: p.resource,
                action: p.action,
                description: p.description,
                category: p.category,
            });
        }
        return { success: true, data: grouped };
    }

    // ── GET /api/admin/users/:userId/permissions ───────────────────────────────
    @Get('users/:userId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get effective permissions for a user' })
    async getUserPermissions(@Param('userId') userId: string) {
        return this.permissionService.getUserPermissionDetails(userId);
    }

    // ── GET /api/admin/users/:userId/permissions/detail ────────────────────────
    @Get('users/:userId/detail')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get full permission detail for a user with all permissions and their status' })
    async getUserPermissionsFull(@Param('userId') userId: string) {
        // Get all permissions
        const allPerms = await this.dataSource.query(`
            SELECT id, resource, action, category, description
            FROM permissions
            ORDER BY category, resource, action
        `);

        // Get user's role
        const userResult = await this.dataSource.query(
            'SELECT role FROM users WHERE id = $1',
            [userId]
        );
        if (!userResult.length) {
            return { success: false, message: 'User not found' };
        }
        const userRole = userResult[0].role;

        // Get role-based permissions
        const rolePerms = await this.dataSource.query(`
            SELECT permission_id FROM role_permissions WHERE role = $1
        `, [userRole]);
        const rolePermIds = new Set(rolePerms.map((r: any) => r.permission_id));

        // Get user-specific overrides
        const userPerms = await this.dataSource.query(`
            SELECT permission_id, is_granted, granted_by, reason, expires_at, granted_at
            FROM user_permissions
            WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
        `, [userId]);
        const userPermMap = new Map(userPerms.map((u: any) => [u.permission_id, u]));

        // Build full permission list
        const permissions = allPerms.map((p: any) => {
            const override = userPermMap.get(p.id);
            const fromRole = rolePermIds.has(p.id);
            let effective = fromRole;
            let source = fromRole ? 'role' : 'none';

            if (override) {
                effective = override.is_granted;
                source = override.is_granted ? 'user_granted' : 'user_denied';
            }

            return {
                id: p.id,
                code: `${p.resource}.${p.action}`,
                resource: p.resource,
                action: p.action,
                description: p.description,
                category: p.category || 'other',
                effective,
                source,
                override: override ? {
                    isGranted: override.is_granted,
                    grantedBy: override.granted_by,
                    reason: override.reason,
                    expiresAt: override.expires_at,
                    grantedAt: override.granted_at,
                } : null,
            };
        });

        return {
            success: true,
            data: {
                userId,
                userRole,
                permissions,
            },
        };
    }

    // ── PUT /api/admin/users/:userId/permissions ────────────────────────────────
    @Put('users/:userId')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Bulk update user permissions (grant/revoke overrides)' })
    async updateUserPermissions(
        @Param('userId') userId: string,
        @Body() body: { grants: string[]; revokes: string[]; reason?: string },
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        const ipAddress = req.ip;
        const userAgent = req.headers['user-agent'];
        const reason = body.reason || 'Bulk update by admin';

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Process grants
            for (const permCode of (body.grants || [])) {
                const [resource, ...actionParts] = permCode.split('.');
                const action = actionParts.join('.');
                const permResult = await queryRunner.query(
                    'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
                    [resource, action]
                );
                if (!permResult.length) continue;
                const permissionId = permResult[0].id;

                await queryRunner.query(`
                    INSERT INTO user_permissions (user_id, permission_id, is_granted, granted_by, reason)
                    VALUES ($1, $2, true, $3, $4)
                    ON CONFLICT (user_id, permission_id)
                    DO UPDATE SET is_granted = true, granted_by = $3, reason = $4, granted_at = NOW()
                `, [userId, permissionId, adminId, reason]);

                await this.logAudit(queryRunner, 'grant_user_permission', 'user', userId, adminId, {
                    permission: permCode, reason
                }, ipAddress, userAgent);
            }

            // Process revokes (remove overrides so role default applies)
            for (const permCode of (body.revokes || [])) {
                const [resource, ...actionParts] = permCode.split('.');
                const action = actionParts.join('.');
                const permResult = await queryRunner.query(
                    'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
                    [resource, action]
                );
                if (!permResult.length) continue;
                const permissionId = permResult[0].id;

                await queryRunner.query(
                    'DELETE FROM user_permissions WHERE user_id = $1 AND permission_id = $2',
                    [userId, permissionId]
                );

                await this.logAudit(queryRunner, 'revoke_user_permission', 'user', userId, adminId, {
                    permission: permCode
                }, ipAddress, userAgent);
            }

            await queryRunner.commitTransaction();
            this.logger.log(`Bulk permission update for user ${userId} by admin ${adminId}: +${(body.grants || []).length} grants, -${(body.revokes || []).length} revokes`);

            return { success: true, message: `Permissions updated: ${(body.grants || []).length} granted, ${(body.revokes || []).length} revoked` };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed bulk permission update for user ${userId}:`, error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ── GET /api/admin/permissions/audit/:userId ───────────────────────────────
    @Get('audit/:userId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get permission audit log for a user' })
    async getUserAuditLog(
        @Param('userId') userId: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.permissionService.getUserAuditLog(userId, limit, offset);
    }

    @Get('list')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'List all defined permissions' })
    async listAllPermissions() {
        return this.permissionService.getAllPermissions();
    }

    @Post('grant')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Grant a permission to a user (override)' })
    async grantPermission(
        @Body() dto: GrantPermissionDto,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        await this.permissionService.grantUserPermission(
            dto.userId,
            dto.permission,
            adminId,
            dto.reason,
            dto.expiresAt,
            {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        );
        this.logger.log(`Permission ${dto.permission} granted to user ${dto.userId} by ${adminId}`);
        return { success: true, message: 'Permission granted successfully' };
    }

    @Post('revoke')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Revoke a permission override' })
    async revokePermission(
        @Body() dto: RevokePermissionDto,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        await this.permissionService.revokeUserPermission(
            dto.userId,
            dto.permission,
            adminId,
            {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        );
        this.logger.log(`Permission ${dto.permission} revoked from user ${dto.userId} by ${adminId}`);
        return { success: true, message: 'Permission revoked successfully' };
    }

    @Post('deny')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Explicitly deny a permission' })
    async denyPermission(
        @Body() dto: DenyPermissionDto,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        await this.permissionService.denyUserPermission(
            dto.userId,
            dto.permission,
            adminId,
            dto.reason,
            {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        );
        this.logger.log(`Permission ${dto.permission} denied to user ${dto.userId} by ${adminId}`);
        return { success: true, message: 'Permission denied successfully' };
    }

    @Get('roles/matrix')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all role-permission mappings (Matrix)' })
    async getRoleMatrix() {
        return this.permissionService.getAllRolePermissionsMatrix();
    }

    @Post('roles/grant')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Grant a permission to a Role (Global Default)' })
    async grantRolePermission(
        @Body() dto: GrantRolePermissionDto,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        const roleEnum = dto.role as UserRole;
        await this.permissionService.grantRolePermission(roleEnum, dto.permission, adminId, {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        this.logger.log(`Permission ${dto.permission} granted to ROLE ${dto.role} by ${adminId}`);
        return { success: true, message: 'Role permission granted successfully' };
    }

    @Post('roles/revoke')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Revoke a permission from a Role' })
    async revokeRolePermission(
        @Body() dto: RevokeRolePermissionDto,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        const roleEnum = dto.role as UserRole;
        await this.permissionService.revokeRolePermission(roleEnum, dto.permission, adminId, {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        this.logger.log(`Permission ${dto.permission} revoked from ROLE ${dto.role} by ${adminId}`);
        return { success: true, message: 'Role permission revoked successfully' };
    }

    @Get('roles')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'List all roles with their permissions' })
    async getAllRoles() {
        const roles = await this.permissionService.getAllRoles();
        return { success: true, data: roles };
    }

    @Get('roles/:roleId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get a specific role by ID' })
    async getRoleById(@Param('roleId') roleId: string) {
        const role = await this.permissionService.getRoleById(roleId);
        if (!role) return { success: false, message: 'Role not found' };
        return { success: true, data: role };
    }

    @Post('roles')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new custom role' })
    async createRole(@Body() dto: any, @Req() req: Request) {
        const adminId = req['user']?.userId;
        const role = await this.permissionService.createRole(dto.name, dto.description, dto.permissionIds || [], adminId);
        this.logger.log(`Role ${dto.name} created by ${adminId}`);
        return { success: true, data: role, message: 'Role created successfully' };
    }

    @Put('roles/:roleId')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update a role' })
    async updateRole(@Param('roleId') roleId: string, @Body() dto: any, @Req() req: Request) {
        const adminId = req['user']?.userId;
        const role = await this.permissionService.updateRole(roleId, dto.name, dto.description, adminId);
        this.logger.log(`Role ${roleId} updated by ${adminId}`);
        return { success: true, data: role, message: 'Role updated successfully' };
    }

    @Delete('roles/:roleId')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete a custom role' })
    async deleteRole(@Param('roleId') roleId: string, @Req() req: Request) {
        const adminId = req['user']?.userId;
        await this.permissionService.deleteRole(roleId, adminId);
        this.logger.log(`Role ${roleId} deleted by ${adminId}`);
        return { success: true, message: 'Role deleted successfully' };
    }

    @Post('roles/:roleId/bulk-assign')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Bulk assign permissions to a role' })
    async bulkAssignPermissions(@Param('roleId') roleId: string, @Body() dto: any, @Req() req: Request) {
        const adminId = req['user']?.userId;
        await this.permissionService.bulkAssignPermissions(roleId, dto.permissionIds || [], adminId);
        this.logger.log(`Bulk permissions assigned to role ${roleId} by ${adminId}`);
        return { success: true, message: 'Permissions assigned successfully' };
    }

    // ── Helper ─────────────────────────────────────────────────────────────────
    private async logAudit(
        queryRunner: any,
        action: string,
        entityType: string,
        entityId: string,
        userId: string,
        changes: Record<string, any>,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<void> {
        try {
            await queryRunner.query(
                `INSERT INTO permission_audit_log (action, entity_type, entity_id, user_id, changes, ip_address, user_agent)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [action, entityType, entityId, userId, JSON.stringify(changes), ipAddress || null, userAgent || null]
            );
        } catch (_) {
            // Non-blocking audit log failure
        }
    }
}

@ApiTags('Admin Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/permissions')
export class AdminPermissionsController {
    private readonly logger = new Logger(AdminPermissionsController.name);

    constructor(private readonly permissionService: PermissionService) { }

    @Get('list')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'List all defined permissions' })
    @ApiOkResponse({ description: 'List of all available system permissions' })
    async listAllPermissions() {
        return this.permissionService.getAllPermissions();
    }

    @Get('users/:userId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get effective permissions for a user' })
    @ApiOkResponse({ description: 'User permissions with source details' })
    async getUserPermissions(@Param('userId') userId: string) {
        return this.permissionService.getUserPermissionDetails(userId);
    }

    @Get('audit/:userId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get permission audit log for a user' })
    async getUserAuditLog(
        @Param('userId') userId: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.permissionService.getUserAuditLog(userId, limit, offset);
    }

    @Post('grant')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Grant a permission to a user (override)' })
    async grantPermission(
        @Body() dto: GrantPermissionDto,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        await this.permissionService.grantUserPermission(
            dto.userId,
            dto.permission,
            adminId,
            dto.reason,
            dto.expiresAt,
            {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        );
        this.logger.log(`Permission ${dto.permission} granted to user ${dto.userId} by ${adminId}`);
        return { success: true, message: 'Permission granted successfully' };
    }

    @Post('revoke')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Revoke a permission override' })
    async revokePermission(
        @Body() dto: RevokePermissionDto,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        await this.permissionService.revokeUserPermission(
            dto.userId,
            dto.permission,
            adminId,
            {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        );
        this.logger.log(`Permission ${dto.permission} revoked from user ${dto.userId} by ${adminId}`);
        return { success: true, message: 'Permission revoked successfully' };
    }

    @Post('deny')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Explicitly deny a permission' })
    async denyPermission(
        @Body() dto: DenyPermissionDto,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        await this.permissionService.denyUserPermission(
            dto.userId,
            dto.permission,
            adminId,
            dto.reason,
            {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        );
        this.logger.log(`Permission ${dto.permission} denied to user ${dto.userId} by ${adminId}`);
        return { success: true, message: 'Permission denied successfully' };
    }
    @Get('roles/matrix')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all role-permission mappings (Matrix)' })
    @ApiOkResponse({ description: 'List of all permissions assigned to roles' })
    async getRoleMatrix() {
        return this.permissionService.getAllRolePermissionsMatrix();
    }

    @Post('roles/grant')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Grant a permission to a Role (Global Default)' })
    async grantRolePermission(
        @Body() dto: GrantRolePermissionDto,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        // Cast string to UserRole enum
        const roleEnum = dto.role as UserRole;

        await this.permissionService.grantRolePermission(
            roleEnum,
            dto.permission,
            adminId,
            {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        );
        this.logger.log(`Permission ${dto.permission} granted to ROLE ${dto.role} by ${adminId}`);
        return { success: true, message: 'Role permission granted successfully' };
    }

    @Post('roles/revoke')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Revoke a permission from a Role' })
    async revokeRolePermission(
        @Body() dto: RevokeRolePermissionDto,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        const roleEnum = dto.role as UserRole;

        await this.permissionService.revokeRolePermission(
            roleEnum,
            dto.permission,
            adminId,
            {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        );
        this.logger.log(`Permission ${dto.permission} revoked from ROLE ${dto.role} by ${adminId}`);
        return { success: true, message: 'Role permission revoked successfully' };
    }

    @Get('roles')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'List all roles with their permissions' })
    @ApiOkResponse({ description: 'List of all roles' })
    async getAllRoles() {
        const roles = await this.permissionService.getAllRoles();
        return { success: true, data: roles };
    }

    @Get('roles/:roleId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get a specific role by ID' })
    @ApiOkResponse({ description: 'Role details with permissions' })
    async getRoleById(@Param('roleId') roleId: string) {
        const role = await this.permissionService.getRoleById(roleId);
        if (!role) {
            return { success: false, message: 'Role not found' };
        }
        return { success: true, data: role };
    }

    @Post('roles')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new custom role' })
    @ApiOkResponse({ description: 'Role created successfully' })
    async createRole(
        @Body() dto: any,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        const role = await this.permissionService.createRole(
            dto.name,
            dto.description,
            dto.permissionIds || [],
            adminId
        );
        this.logger.log(`Role ${dto.name} created by ${adminId}`);
        return { success: true, data: role, message: 'Role created successfully' };
    }

    @Put('roles/:roleId')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update a role (name and description)' })
    @ApiOkResponse({ description: 'Role updated successfully' })
    async updateRole(
        @Param('roleId') roleId: string,
        @Body() dto: any,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        const role = await this.permissionService.updateRole(
            roleId,
            dto.name,
            dto.description,
            adminId
        );
        this.logger.log(`Role ${roleId} updated by ${adminId}`);
        return { success: true, data: role, message: 'Role updated successfully' };
    }

    @Delete('roles/:roleId')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete a custom role' })
    @ApiOkResponse({ description: 'Role deleted successfully' })
    async deleteRole(
        @Param('roleId') roleId: string,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        await this.permissionService.deleteRole(roleId, adminId);
        this.logger.log(`Role ${roleId} deleted by ${adminId}`);
        return { success: true, message: 'Role deleted successfully' };
    }

    @Post('roles/:roleId/bulk-assign')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Bulk assign permissions to a role' })
    @ApiOkResponse({ description: 'Permissions assigned successfully' })
    async bulkAssignPermissions(
        @Param('roleId') roleId: string,
        @Body() dto: any,
        @Req() req: Request,
    ) {
        const adminId = req['user']?.userId;
        await this.permissionService.bulkAssignPermissions(
            roleId,
            dto.permissionIds || [],
            adminId
        );
        this.logger.log(`Bulk permissions assigned to role ${roleId} by ${adminId}`);
        return { success: true, message: 'Permissions assigned successfully' };
    }
}
