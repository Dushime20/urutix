import { Controller, Get, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AdminService } from './admin.service';
import { Body, Post, Query } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('routes')
  @ApiOperation({ summary: 'List all routes (admin)' })
  @ApiOkResponse({ description: 'Routes retrieved' })
  getRoutes(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('routeType') routeType?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getRoutes({
      tenantId,
      status,
      priority,
      routeType,
      search,
    });
  }

  @Get('kpi')
  @ApiOperation({ summary: 'Get platform KPIs' })
  @ApiOkResponse({ description: 'KPI metrics retrieved' })
  getKpi(@Request() req) {
    return this.adminService.getKpi(req.user.tenantId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get admin analytics overview' })
  @ApiOkResponse({ description: 'Analytics data retrieved' })
  getAnalytics(@Request() req) {
    return this.adminService.getAnalytics(req.user.tenantId);
  }

  @Get('users')
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ description: 'Users retrieved' })
  getUsers(@Request() req) {
    return this.adminService.getUsers(req.user.tenantId);
  }

  @Get('financials')
  @ApiOperation({ summary: 'Financial overview' })
  @ApiOkResponse({ description: 'Financials retrieved' })
  getFinancials(@Request() req) {
    return this.adminService.getFinancials(req.user.tenantId);
  }

  @Get('health')
  @ApiOperation({ summary: 'System health' })
  @ApiOkResponse({ description: 'Health status retrieved' })
  getHealth() {
    return this.adminService.getHealth();
  }

  @Get('disputes')
  @ApiOperation({ summary: 'List disputes' })
  @ApiOkResponse({ description: 'Disputes retrieved' })
  getDisputes(@Request() req) {
    return this.adminService.getDisputes(req.user.tenantId);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Audit logs' })
  @ApiOkResponse({ description: 'Audit logs retrieved' })
  getAudit(@Request() req) {
    return this.adminService.getAudit(req.user.tenantId);
  }

  @Get('tenants')
  @ApiOperation({ summary: 'List tenants' })
  @ApiOkResponse({ description: 'Tenants retrieved' })
  getTenants() {
    return this.adminService.getTenants();
  }

  // Admin-wide listings
  @Get('all/trucks')
  @ApiOperation({ summary: 'List all trucks (admin)' })
  listAllTrucks(@Query('tenantId') tenantId?: string) {
    return this.adminService.listAllTrucks(tenantId);
  }

  @Get('all/loads')
  @ApiOperation({ summary: 'List all loads (admin)' })
  listAllLoads(@Query('tenantId') tenantId?: string) {
    return this.adminService.listAllLoads(tenantId);
  }

  @Get('all/trips')
  @ApiOperation({ summary: 'List all trips (admin)' })
  listAllTrips(@Query('tenantId') tenantId?: string) {
    return this.adminService.listAllTrips(tenantId);
  }

  @Get('all/users')
  @ApiOperation({ summary: 'List all users (admin)' })
  listAllUsers(@Query('tenantId') tenantId?: string) {
    return this.adminService.listAllUsers(tenantId);
  }

  // Create tenant
  @Post('tenants')
  @ApiOperation({
    summary: 'Create a new tenant',
    description:
      'Creates a new tenant with an admin user. The tenant will be in PENDING_ACTIVATION status until activated by a super admin.',
  })
  @ApiOkResponse({
    description: 'Tenant created successfully',
    schema: {
      type: 'object',
      properties: {
        tenant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            subdomain: { type: 'string' },
            domain: { type: 'string' },
            status: { type: 'string' },
            subscriptionPlan: { type: 'string' },
          },
        },
        adminUser: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  createTenant(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createTenantDto: CreateTenantDto,
  ) {
    return this.adminService.createTenant(createTenantDto);
  }

  // Create route for tenant
  @Post('routes')
  @ApiOperation({ summary: 'Create a route for a tenant' })
  createRouteForTenant(@Body() body: { tenantId: string; route: any }) {
    return this.adminService.createRouteForTenant(body.tenantId, body.route);
  }
}
