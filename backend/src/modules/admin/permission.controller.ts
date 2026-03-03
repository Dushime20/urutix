import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Query,
} from '@nestjs/common';
import { RolePermissionService, CreateRoleDto, UpdateRoleDto, GrantPermissionOverrideDto } from '../../services/permission.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class PermissionController {
    constructor(private readonly permissionService: RolePermissionService) { }

    /**
     * Get all permissions
     */
    @Get()
    async getAllPermissions() {
        return await this.permissionService.getAllPermissions();
    }

    /**
     * Get permissions by category
     */
    @Get('category/:category')
    async getPermissionsByCategory(@Param('category') category: string) {
        return await this.permissionService.getPermissionsByCategory(category);
    }

    /**
     * Get permission matrix
     */
    @Get('matrix')
    async getPermissionMatrix() {
        return await this.permissionService.getPermissionMatrix();
    }

    /**
     * Get all roles
     */
    @Get('roles')
    async getAllRoles() {
        return await this.permissionService.getAllRoles();
    }

    /**
     * Get role by ID
     */
    @Get('roles/:id')
    async getRoleById(@Param('id') id: string) {
        return await this.permissionService.getRoleById(id);
    }

    /**
     * Get role templates
     */
    @Get('roles/templates/list')
    async getRoleTemplates() {
        return this.permissionService.getRoleTemplates();
    }

    /**
     * Create a new role
     */
    @Post('roles')
    async createRole(@Body() data: CreateRoleDto) {
        return await this.permissionService.createRole(data);
    }

    /**
     * Update a role
     */
    @Put('roles/:id')
    async updateRole(@Param('id') id: string, @Body() data: UpdateRoleDto) {
        return await this.permissionService.updateRole(id, data);
    }

    /**
     * Delete a role
     */
    @Delete('roles/:id')
    async deleteRole(@Param('id') id: string) {
        await this.permissionService.deleteRole(id);
        return { message: 'Role deleted successfully' };
    }

    /**
     * Bulk assign permissions to role
     */
    @Post('roles/:id/bulk-assign')
    async bulkAssignPermissions(
        @Param('id') roleId: string,
        @Body('permissionIds') permissionIds: string[],
    ) {
        return await this.permissionService.bulkAssignPermissions(roleId, permissionIds);
    }

    /**
     * Get user permission overrides
     */
    @Get('overrides/user/:userId')
    async getUserPermissionOverrides(@Param('userId') userId: string) {
        return await this.permissionService.getUserPermissionOverrides(userId);
    }

    /**
     * Grant or revoke permission override
     */
    @Post('overrides')
    async grantPermissionOverride(@Body() data: GrantPermissionOverrideDto) {
        return await this.permissionService.grantPermissionOverride(data);
    }

    /**
     * Remove permission override
     */
    @Delete('overrides/:id')
    async removePermissionOverride(@Param('id') id: string) {
        await this.permissionService.removePermissionOverride(id);
        return { message: 'Permission override removed successfully' };
    }

    /**
     * Check user permission
     */
    @Get('check')
    async checkUserPermission(
        @Query('userId') userId: string,
        @Query('resource') resource: string,
        @Query('action') action: string,
        @Query('roles') roles: string,
    ) {
        const userRoles = roles ? roles.split(',') : [];
        const hasPermission = await this.permissionService.checkUserPermission(
            userId,
            resource,
            action,
            userRoles,
        );

        return { hasPermission };
    }

    /**
     * Seed default permissions
     */
    @Post('seed')
    async seedDefaultPermissions() {
        await this.permissionService.seedDefaultPermissions();
        return { message: 'Default permissions seeded successfully' };
    }
}
