import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { TenantManagementService, TenantFilters, TenantUpdate } from '../../services/tenant-management.service';
import { TenantStatus } from '../../entities/tenant.entity';

@ApiTags('Tenant Management')
@Controller('admin/tenant-management')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth('JWT-auth')
export class TenantManagementController {
  constructor(private readonly tenantManagementService: TenantManagementService) {}

  /**
   * Get all tenants with enriched data
   * Requirement 2.1: Display all tenants with subscription status, credit balance, active users count
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:view_all_tenants')
  @ApiOperation({
    summary: 'Get all tenants with enriched data',
    description: 'Returns all tenants with subscription information, credit balance, and user statistics',
  })
  @ApiQuery({
    name: 'status',
    enum: TenantStatus,
    required: false,
    isArray: true,
    description: 'Filter by tenant status',
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
    description: 'Search by name, subdomain, or email',
  })
  @ApiQuery({
    name: 'hasLowBalance',
    type: Boolean,
    required: false,
    description: 'Filter tenants with low credit balance',
  })
  @ApiQuery({
    name: 'hasExpiringSubscription',
    type: Boolean,
    required: false,
    description: 'Filter tenants with expiring subscriptions',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenants retrieved successfully',
  })
  async getAllTenants(
    @Query('status') status?: string | string[],
    @Query('search') search?: string,
    @Query('hasLowBalance') hasLowBalance?: boolean,
    @Query('hasExpiringSubscription') hasExpiringSubscription?: boolean,
  ) {
    const filters: TenantFilters = {};
    
    if (status) {
      filters.status = Array.isArray(status) ? status as TenantStatus[] : [status as TenantStatus];
    }
    
    if (search) {
      filters.search = search;
    }
    
    if (hasLowBalance !== undefined) {
      filters.hasLowBalance = hasLowBalance;
    }
    
    if (hasExpiringSubscription !== undefined) {
      filters.hasExpiringSubscription = hasExpiringSubscription;
    }

    return this.tenantManagementService.getAllTenants(filters);
  }

  /**
   * Get tenant details
   * Requirement 2.4: Display tenant details with subscription, credit usage, active users, and recent activity
   */
  @Get(':tenantId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:view_all_tenants')
  @ApiOperation({
    summary: 'Get tenant details',
    description: 'Returns detailed information about a specific tenant',
  })
  @ApiParam({
    name: 'tenantId',
    type: String,
    description: 'Tenant ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async getTenantDetails(@Param('tenantId') tenantId: string) {
    return this.tenantManagementService.getTenantDetails(tenantId);
  }

  /**
   * Update tenant settings
   * Requirement 2.5: Edit tenant settings with validation
   * Requirement 2.7: Log all modifications
   */
  @Put(':tenantId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:manage_tenants')
  @ApiOperation({
    summary: 'Update tenant settings',
    description: 'Updates tenant settings and logs the modification',
  })
  @ApiParam({
    name: 'tenantId',
    type: String,
    description: 'Tenant ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        contactEmail: { type: 'string' },
        contactPhone: { type: 'string' },
        maxUsers: { type: 'number' },
        maxTrucks: { type: 'number' },
        maxDrivers: { type: 'number' },
        settings: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async updateTenant(
    @Param('tenantId') tenantId: string,
    @Body() updates: TenantUpdate,
    @Request() req: any,
  ) {
    const actorUserId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.tenantManagementService.updateTenant(
      tenantId,
      updates,
      actorUserId,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Set tenant status
   * Requirement 2.3: Update tenant status and log the action
   * Requirement 2.6: Prevent access for deactivated tenants
   */
  @Post(':tenantId/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:manage_tenants')
  @ApiOperation({
    summary: 'Set tenant status',
    description: 'Activates or deactivates a tenant and logs the action',
  })
  @ApiParam({
    name: 'tenantId',
    type: String,
    description: 'Tenant ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        active: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['active'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async setTenantStatus(
    @Param('tenantId') tenantId: string,
    @Body('active') active: boolean,
    @Body('reason') reason?: string,
    @Request() req?: any,
  ) {
    const actorUserId = req?.user?.userId;
    const ipAddress = req?.ip;
    const userAgent = req?.headers['user-agent'];

    await this.tenantManagementService.setTenantStatus(
      tenantId,
      active,
      actorUserId,
      reason,
      ipAddress,
      userAgent,
    );

    return { message: 'Tenant status updated successfully' };
  }

  /**
   * Bulk update tenants
   * Requirement 2.7: Apply changes to multiple tenants and log each modification
   */
  @Post('bulk/update')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:manage_tenants')
  @ApiOperation({
    summary: 'Bulk update tenants',
    description: 'Updates multiple tenants at once and logs each modification',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tenantIds: { type: 'array', items: { type: 'string' } },
        updates: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            contactEmail: { type: 'string' },
            contactPhone: { type: 'string' },
            maxUsers: { type: 'number' },
            maxTrucks: { type: 'number' },
            maxDrivers: { type: 'number' },
            settings: { type: 'object' },
          },
        },
      },
      required: ['tenantIds', 'updates'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk update completed',
  })
  async bulkUpdateTenants(
    @Body('tenantIds') tenantIds: string[],
    @Body('updates') updates: TenantUpdate,
    @Request() req: any,
  ) {
    const actorUserId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.tenantManagementService.bulkUpdateTenants(
      tenantIds,
      updates,
      actorUserId,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Get tenant health score
   * Requirement 2.8: Calculate health score based on credit balance and subscription status
   */
  @Get(':tenantId/health')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:view_all_tenants')
  @ApiOperation({
    summary: 'Get tenant health score',
    description: 'Returns tenant health score with factors and recommendations',
  })
  @ApiParam({
    name: 'tenantId',
    type: String,
    description: 'Tenant ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant health score retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async getTenantHealth(@Param('tenantId') tenantId: string) {
    return this.tenantManagementService.getTenantHealth(tenantId);
  }

  /**
   * Get all tenant health scores
   */
  @Get('health/all')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:view_all_tenants')
  @ApiOperation({
    summary: 'Get all tenant health scores',
    description: 'Returns health scores for all active tenants',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant health scores retrieved successfully',
  })
  async getAllTenantHealthScores() {
    return this.tenantManagementService.getAllTenantHealthScores();
  }

  /**
   * Get tenant resource usage
   */
  @Get(':tenantId/resources')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:view_all_tenants')
  @ApiOperation({
    summary: 'Get tenant resource usage',
    description: 'Returns detailed resource usage statistics for a tenant',
  })
  @ApiParam({
    name: 'tenantId',
    type: String,
    description: 'Tenant ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Resource usage retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant not found',
  })
  async getTenantResourceUsage(@Param('tenantId') tenantId: string) {
    return this.tenantManagementService.getTenantResourceUsage(tenantId);
  }
}
