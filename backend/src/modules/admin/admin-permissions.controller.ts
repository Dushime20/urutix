import {
    Controller, Get, Post, Put, Delete,
    Body, Param, UseGuards, Req, Logger, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../types/permission.types';
import { PermissionService } from '../../services/raw-permission.service';
import {
    GrantPermissionDto, RevokePermissionDto, DenyPermissionDto,
    GrantRolePermissionDto, RevokeRolePermissionDto,
} from './dto/permission.dto';
import { Request } from 'express';
import { DataSource } from 'typeorm';

interface UserPermOverride {
    is_granted: boolean;
    granted_by: string;
    reason: string;
    expires_at: Date | null;
    granted_at: Date;
}

@ApiTags('Admin Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/permissions')
export class AdminPermissionsController {
    private readonly logger = new Logger(AdminPermissionsController.name);

    constructor(
        private readonly permissionService: PermissionService,
        private readonly dataSource: DataSource,
    ) {}

    // ── GET /api/admin/permissions — grouped by module ─────────────────────────
    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'List all permissions grouped by module' })
    async getAllPermissionsGrouped() {
        const result: any[] = await this.dataSource.query(`
            SELECT id, resource, action, category, description
            FROM permissions
            ORDER BY category, resource, action
        `);
        const grouped: Record<string, any[]> = {};
        for (const p of result) {
            const cat: string = p.category || 'other';
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

    // ── GET /api/admin/permissions/list ───────────────────────────────────────
    @Get('list')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'List all defined permissions (flat)' })
    @ApiOkResponse({ description: 'List of all available system permissions' })
    async listAllPermissions() {
        return this.permissionService.getAllPermissions();
    }

    // ── GET /api/admin/permissions/users/:userId — legacy ─────────────────────
    @Get('users/:userId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get effective permissions for a user' })
    @ApiOkResponse({ description: 'User permissions with source details' })
    async getUserPermissions(@Param('userId') userId: string) {
        return this.permissionService.getUserPermissionDetails(userId);
    }

    // ── GET /api/admin/permissions/users/:userId/detail ───────────────────────
    @Get('users/:userId/detail')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Full per-user permission status (effective + source)' })
    async getUserPermissionsFull(@Param('userId') userId: string) {
        const allPerms: any[] = await this.dataSource.query(`
            SELECT id, resource, action, category, description
            FROM permissions
            ORDER BY category, resource, action
        `);

        let userResult: any[] = [];
        try {
            userResult = await this.dataSource.query(
                'SELECT role, "tenantId" AS "tenantId" FROM users WHERE id = $1', [userId],
            );
        } catch {
            userResult = await this.dataSource.query(
                'SELECT role, tenant_id AS "tenantId" FROM users WHERE id = $1', [userId],
            );
        }
        if (!userResult.length) {
            return { success: false, message: 'User not found' };
        }
        const userRole: string = userResult[0].role;
        const tenantId: string | null = userResult[0].tenantId || null;

        // Support both role_permissions schemas (role varchar vs role_id UUID)
        const columns: any[] = await this.dataSource.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'role_permissions'
               AND column_name IN ('role', 'role_id')`,
        );
        const columnNames = new Set(columns.map((c: any) => c.column_name));

        let rolePerms: any[] = [];
        if (columnNames.has('role_id')) {
            rolePerms = await this.dataSource.query(
                `SELECT rp.permission_id
                 FROM role_permissions rp
                 INNER JOIN roles r ON r.id = rp.role_id
                 WHERE r.name = $1`,
                [userRole],
            );
        } else if (columnNames.has('role')) {
            rolePerms = await this.dataSource.query(
                'SELECT permission_id FROM role_permissions WHERE role = $1',
                [userRole],
            );
        }
        const rolePermIds = new Set<string>(rolePerms.map((r) => r.permission_id));

        const userPerms: Array<UserPermOverride & { permission_id: string }> =
            await this.dataSource.query(`
                SELECT permission_id, is_granted, granted_by, reason, expires_at, granted_at
                FROM user_permissions
                WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
            `, [userId]);

        type OverrideRow = UserPermOverride & { permission_id: string };
        const userPermMap = new Map<string, OverrideRow>(
            userPerms.map((u) => [u.permission_id, u]),
        );

        // Platform (+ tenant) disabled features
        let disabledFeatures: string[] = [];
        try {
            const platformDisabled: Array<{ permission_code: string }> = await this.dataSource.query(
                `SELECT permission_code FROM feature_controls
                 WHERE scope = 'PLATFORM' AND tenant_id IS NULL AND enabled = FALSE`,
            );
            disabledFeatures = platformDisabled.map((r) => r.permission_code);
            if (tenantId) {
                const tenantDisabled: Array<{ permission_code: string }> = await this.dataSource.query(
                    `SELECT permission_code FROM feature_controls
                     WHERE scope = 'TENANT' AND tenant_id = $1 AND enabled = FALSE`,
                    [tenantId],
                );
                disabledFeatures = Array.from(
                    new Set([...disabledFeatures, ...tenantDisabled.map((r) => r.permission_code)]),
                );
            }
        } catch (_) {
            disabledFeatures = [];
        }
        const disabledSet = new Set(disabledFeatures);

        const permissions = allPerms.map((p) => {
            const override = userPermMap.get(p.id) as OverrideRow | undefined;
            const fromRole = rolePermIds.has(p.id);
            let effective = fromRole;
            let source: 'role' | 'user_granted' | 'user_denied' | 'none' = fromRole ? 'role' : 'none';

            if (override) {
                effective = override.is_granted;
                source = override.is_granted ? 'user_granted' : 'user_denied';
            }

            const codeColon = `${p.resource}:${p.action}`;
            const globallyDisabled = disabledSet.has(codeColon);

            return {
                id: p.id,
                code: `${p.resource}.${p.action}`,
                codeColon,
                resource: p.resource,
                action: p.action,
                description: p.description,
                category: p.category || 'other',
                fromRole,
                effective: globallyDisabled ? false : effective,
                source,
                globallyDisabled,
                override: override
                    ? {
                        isGranted: override.is_granted,
                        grantedBy: override.granted_by,
                        reason: override.reason,
                        expiresAt: override.expires_at,
                        grantedAt: override.granted_at,
                    }
                    : null,
            };
        });

        const summary = {
            total: permissions.length,
            effective: permissions.filter((p) => p.effective).length,
            roleInherited: permissions.filter((p) => p.source === 'role').length,
            userGranted: permissions.filter((p) => p.source === 'user_granted').length,
            userDenied: permissions.filter((p) => p.source === 'user_denied').length,
            globallyDisabled: permissions.filter((p) => p.globallyDisabled).length,
        };

        return {
            success: true,
            data: { userId, userRole, tenantId, permissions, disabledFeatures, summary },
        };
    }

    // ── PUT /api/admin/permissions/users/:userId — bulk update ────────────────
    @Put('users/:userId')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Bulk grant/deny/revoke user permission overrides' })
    async updateUserPermissions(
        @Param('userId') userId: string,
        @Body() body: {
            grants?: string[];
            denies?: string[];
            revokes?: string[];
            reason?: string;
        },
        @Req() req: Request,
    ) {
        const adminId: string = req['user']?.userId;
        const ipAddress: string = req.ip;
        const userAgent: string = req.headers['user-agent'] as string;
        const reason = body.reason || 'Bulk update by admin';

        const resolvePermissionId = async (qr: any, permCode: string): Promise<string | null> => {
            const normalized = String(permCode || '').trim();
            const sep = normalized.includes(':') ? ':' : '.';
            const [resource, ...parts] = normalized.split(sep);
            const action = parts.join(sep);
            if (!resource || !action) return null;
            const rows: any[] = await qr.query(
                'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
                [resource, action],
            );
            return rows[0]?.id || null;
        };

        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
            for (const permCode of body.grants || []) {
                const permissionId = await resolvePermissionId(qr, permCode);
                if (!permissionId) continue;
                await qr.query(`
                    INSERT INTO user_permissions (user_id, permission_id, is_granted, granted_by, reason)
                    VALUES ($1,$2,true,$3,$4)
                    ON CONFLICT (user_id,permission_id)
                    DO UPDATE SET is_granted=true, granted_by=$3, reason=$4, granted_at=NOW()
                `, [userId, permissionId, adminId, reason]);
                await this.logAudit(qr, 'grant_user_permission', 'user', userId, adminId, { permission: permCode, reason }, ipAddress, userAgent);
            }

            for (const permCode of body.denies || []) {
                const permissionId = await resolvePermissionId(qr, permCode);
                if (!permissionId) continue;
                await qr.query(`
                    INSERT INTO user_permissions (user_id, permission_id, is_granted, granted_by, reason)
                    VALUES ($1,$2,false,$3,$4)
                    ON CONFLICT (user_id,permission_id)
                    DO UPDATE SET is_granted=false, granted_by=$3, reason=$4, granted_at=NOW()
                `, [userId, permissionId, adminId, reason]);
                await this.logAudit(qr, 'deny_user_permission', 'user', userId, adminId, { permission: permCode, reason }, ipAddress, userAgent);
            }

            for (const permCode of body.revokes || []) {
                const permissionId = await resolvePermissionId(qr, permCode);
                if (!permissionId) continue;
                await qr.query(
                    'DELETE FROM user_permissions WHERE user_id=$1 AND permission_id=$2',
                    [userId, permissionId],
                );
                await this.logAudit(qr, 'revoke_user_permission', 'user', userId, adminId, { permission: permCode }, ipAddress, userAgent);
            }

            await qr.commitTransaction();
            const g = (body.grants || []).length;
            const d = (body.denies || []).length;
            const r = (body.revokes || []).length;
            this.logger.log(`Permissions updated for ${userId} by ${adminId}: +${g} deny:${d} -${r}`);
            return {
                success: true,
                message: `Permissions updated: ${g} granted, ${d} denied, ${r} restored to role default`,
            };
        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
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

    // ── Single-permission grant/revoke/deny ────────────────────────────────────
    @Post('grant')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Grant a permission to a user (override)' })
    async grantPermission(@Body() dto: GrantPermissionDto, @Req() req: Request) {
        const adminId = req['user']?.userId;
        await this.permissionService.grantUserPermission(
            dto.userId, dto.permission, adminId, dto.reason, dto.expiresAt,
            { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );
        this.logger.log(`Permission ${dto.permission} granted to ${dto.userId} by ${adminId}`);
        return { success: true, message: 'Permission granted successfully' };
    }

    @Post('revoke')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Revoke a permission override' })
    async revokePermission(@Body() dto: RevokePermissionDto, @Req() req: Request) {
        const adminId = req['user']?.userId;
        await this.permissionService.revokeUserPermission(
            dto.userId, dto.permission, adminId,
            { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );
        this.logger.log(`Permission ${dto.permission} revoked from ${dto.userId} by ${adminId}`);
        return { success: true, message: 'Permission revoked successfully' };
    }

    @Post('deny')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Explicitly deny a permission' })
    async denyPermission(@Body() dto: DenyPermissionDto, @Req() req: Request) {
        const adminId = req['user']?.userId;
        await this.permissionService.denyUserPermission(
            dto.userId, dto.permission, adminId, dto.reason,
            { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        );
        this.logger.log(`Permission ${dto.permission} denied for ${dto.userId} by ${adminId}`);
        return { success: true, message: 'Permission denied successfully' };
    }

    // ── Role management ────────────────────────────────────────────────────────
    @Get('roles/matrix')
    @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all role-permission mappings (Matrix)' })
    @ApiOkResponse({ description: 'List of all permissions assigned to roles' })
    async getRoleMatrix() {
        return this.permissionService.getAllRolePermissionsMatrix();
    }

    @Post('roles/grant')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Grant a permission to a Role' })
    async grantRolePermission(@Body() dto: GrantRolePermissionDto, @Req() req: Request) {
        try {
            const adminId = req['user']?.userId;
            
            if (!adminId) {
                throw new Error('Admin user ID not found in request');
            }
            
            await this.permissionService.grantRolePermission(dto.role as UserRole, dto.permission, adminId, {
                ipAddress: req.ip, userAgent: req.headers['user-agent'],
            });
            
            return { success: true, message: 'Role permission granted successfully' };
        } catch (error) {
            this.logger.error(`Failed to grant role permission: ${error.message}`, error.stack);
            throw new Error(`Failed to grant permission "${dto.permission}" to role "${dto.role}": ${error.message}`);
        }
    }

    @Post('roles/revoke')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Revoke a permission from a Role' })
    async revokeRolePermission(@Body() dto: RevokeRolePermissionDto, @Req() req: Request) {
        const adminId = req['user']?.userId;
        await this.permissionService.revokeRolePermission(dto.role as UserRole, dto.permission, adminId, {
            ipAddress: req.ip, userAgent: req.headers['user-agent'],
        });
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
        return { success: true, data: role, message: 'Role updated successfully' };
    }

    @Delete('roles/:roleId')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete a custom role' })
    async deleteRole(@Param('roleId') roleId: string, @Req() req: Request) {
        const adminId = req['user']?.userId;
        await this.permissionService.deleteRole(roleId, adminId);
        return { success: true, message: 'Role deleted successfully' };
    }

    @Post('roles/:roleId/bulk-assign')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Bulk assign permissions to a role' })
    async bulkAssignPermissions(@Param('roleId') roleId: string, @Body() dto: any, @Req() req: Request) {
        const adminId = req['user']?.userId;
        await this.permissionService.bulkAssignPermissions(roleId, dto.permissionIds || [], adminId);
        return { success: true, message: 'Permissions assigned successfully' };
    }

    // ── Create a new permission ────────────────────────────────────────────────
    @Post('create')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new system permission' })
    async createPermission(@Body() dto: { resource: string; action: string; description?: string; category?: string }, @Req() req: Request) {
        const adminId = req['user']?.userId;
        // Check for duplicate
        const existing = await this.dataSource.query(
            'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
            [dto.resource, dto.action],
        );
        if (existing.length > 0) {
            return { success: false, message: `Permission "${dto.resource}.${dto.action}" already exists` };
        }
        const result = await this.dataSource.query(
            `INSERT INTO permissions (resource, action, description, category)
             VALUES ($1, $2, $3, $4)
             RETURNING id, resource, action, description, category`,
            [dto.resource, dto.action, dto.description || null, dto.category || 'other'],
        );
        this.logger.log(`Permission ${dto.resource}.${dto.action} created by ${adminId}`);
        return { success: true, data: result[0], message: 'Permission created successfully' };
    }

    // ── Private helpers ────────────────────────────────────────────────────────
    private async logAudit(
        qr: any, action: string, entityType: string, entityId: string,
        userId: string, changes: Record<string, any>, ipAddress?: string, userAgent?: string,
    ): Promise<void> {
        try {
            await qr.query(
                `INSERT INTO permission_audit_log (action,entity_type,entity_id,user_id,changes,ip_address,user_agent)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [action, entityType, entityId, userId, JSON.stringify(changes), ipAddress || null, userAgent || null],
            );
        } catch (_) { /* non-blocking */ }
    }
}
