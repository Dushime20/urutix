import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../types/permission.types';
import { PermissionService } from '../../services/permissionService';
import { GrantPermissionDto, RevokePermissionDto, DenyPermissionDto, GrantRolePermissionDto, RevokeRolePermissionDto } from './dto/permission.dto';
import { Request } from 'express';

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
