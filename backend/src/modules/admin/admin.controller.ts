import { Controller, Get, UseGuards, Request, ValidationPipe, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AdminService } from './admin.service';
import { Body, Query } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { SubscriptionService } from '../../services/subscription.service';
import { CreditService } from '../../services/credit.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly subscriptionService: SubscriptionService,
    private readonly creditService: CreditService,
  ) {}

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

  // Subscription Management Endpoints
  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all tenant subscriptions (admin)' })
  @ApiOkResponse({ description: 'Returns all tenant subscriptions' })
  async getAllSubscriptions(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    const subscriptions = await this.subscriptionService.getAllSubscriptions({
      status,
      plan,
    });
    
    return {
      success: true,
      data: subscriptions,
    };
  }

  @Get('tenants/:tenantId/subscription')
  @ApiOperation({ summary: 'Get subscription for a specific tenant (admin)' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiOkResponse({ description: 'Returns tenant subscription details' })
  @ApiNotFoundResponse({ description: 'No subscription found for tenant' })
  async getTenantSubscription(@Param('tenantId') tenantId: string) {
    const subscription = await this.subscriptionService.getCurrentSubscription(tenantId);
    
    if (!subscription) {
      return {
        success: false,
        message: 'No subscription found for tenant',
        data: null,
      };
    }

    // Get credit account for this tenant
    const creditAccount = await this.creditService.getOrCreateCreditAccount(tenantId);

    return {
      success: true,
      data: {
        ...subscription,
        creditBalance: creditAccount?.currentBalance || 0,
        totalRevenue: 0, // TODO: Calculate from subscription_payments
      },
    };
  }

  @Post('subscriptions/:subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel a tenant subscription (admin)' })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  @ApiOkResponse({ description: 'Subscription cancelled successfully' })
  async cancelTenantSubscription(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { reason?: string; immediate?: boolean },
  ) {
    const subscription = await this.subscriptionService.cancelSubscription(
      subscriptionId,
      body,
    );
    
    return {
      success: true,
      message: body.immediate
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at end of billing period',
      data: subscription,
    };
  }

  @Post('subscriptions/:subscriptionId/reactivate')
  @ApiOperation({ summary: 'Reactivate a cancelled subscription (admin)' })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  @ApiOkResponse({ description: 'Subscription reactivated successfully' })
  async reactivateTenantSubscription(@Param('subscriptionId') subscriptionId: string) {
    const subscription = await this.subscriptionService.reactivateSubscription(subscriptionId);
    
    return {
      success: true,
      message: 'Subscription reactivated successfully',
      data: subscription,
    };
  }

  @Post('credits/add')
  @ApiOperation({ summary: 'Add bonus credits to a tenant (admin)' })
  @ApiOkResponse({ description: 'Credits added successfully' })
  async addBonusCredits(
    @Body() body: { tenantId: string; amount: number; reason: string; type?: string },
  ) {
    const transaction = await this.creditService.grantBonusCredits(
      body.tenantId,
      body.amount,
      body.reason,
    );
    
    return {
      success: true,
      message: 'Credits added successfully',
      data: transaction,
    };
  }

  @Get('credits/transactions/:tenantId')
  @ApiOperation({ summary: 'Get credit transactions for a specific tenant (admin)' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiOkResponse({ description: 'Returns tenant credit transactions' })
  async getTenantCreditTransactions(
    @Param('tenantId') tenantId: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters: any = {};
    if (type) filters.type = type;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const result = await this.creditService.getTransactionHistory(tenantId, filters);

    return {
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      },
    };
  }

  @Get('credits/transactions')
  @ApiOperation({ summary: 'Get all credit transactions across all tenants (admin)' })
  @ApiOkResponse({ description: 'Returns all credit transactions' })
  async getAllCreditTransactions(
    @Query('tenantId') tenantId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // If tenantId is provided, use the specific tenant endpoint logic
    if (tenantId) {
      return this.getTenantCreditTransactions(
        tenantId,
        type,
        startDate,
        endDate,
        limit,
        offset,
      );
    }

    // Otherwise, get all transactions (admin view)
    const filters: any = {};
    if (type) filters.type = type;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    filters.limit = limit ? parseInt(limit) : 50;
    filters.offset = offset ? parseInt(offset) : 0;

    // Get transactions from all tenants
    const allTransactions = await this.creditService.getAllTransactions(filters);

    return {
      success: true,
      data: allTransactions.transactions,
      pagination: {
        total: allTransactions.total,
        limit: filters.limit,
        offset: filters.offset,
      },
    };
  }
}
