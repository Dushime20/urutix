import { Controller, Get, Post, Param, Query, UseGuards, Res, Request, BadRequestException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import * as express from 'express';
import {
  TenantDashboardService,
  TenantMetrics,
  TenantTrends,
  TenantActivity,
} from './tenant-dashboard.service';
import { TenantReportsService, TenantReportCategory } from './tenant-reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Tenant Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('tenant-dashboard')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class TenantDashboardController {
  constructor(
    private readonly tenantDashboardService: TenantDashboardService,
    private readonly tenantReportsService: TenantReportsService,
  ) { }

  @Get(':tenantId/metrics')
  @ApiOperation({
    summary: 'Get tenant metrics',
    description: 'Get comprehensive metrics for a specific tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({
    name: 'timeRange',
    description: 'Time range (7d, 30d, 90d)',
    required: false,
  })
  @ApiOkResponse({
    description: 'Tenant metrics retrieved successfully',
    type: ApiResponseDto,
  })
  async getTenantMetrics(
    @Param('tenantId') tenantId: string,
    @Query('timeRange') timeRange: string = '7d',
  ): Promise<ApiResponseDto<TenantMetrics>> {
    const metrics = await this.tenantDashboardService.getTenantMetrics(
      tenantId,
      timeRange,
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Tenant metrics retrieved successfully',
      data: metrics,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/trends')
  @ApiOperation({
    summary: 'Get tenant trends',
    description: 'Get trend data for a specific tenant over time',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({
    name: 'timeRange',
    description: 'Time range (7d, 30d, 90d)',
    required: false,
  })
  @ApiOkResponse({
    description: 'Tenant trends retrieved successfully',
    type: ApiResponseDto,
  })
  async getTenantTrends(
    @Param('tenantId') tenantId: string,
    @Query('timeRange') timeRange: string = '7d',
  ): Promise<ApiResponseDto<TenantTrends>> {
    const trends = await this.tenantDashboardService.getTenantTrends(
      tenantId,
      timeRange,
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Tenant trends retrieved successfully',
      data: trends,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/activity')
  @ApiOperation({
    summary: 'Get recent tenant activity',
    description: 'Get recent activity for a specific tenant',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of activities to return',
    required: false,
  })
  @ApiOkResponse({
    description: 'Recent activity retrieved successfully',
    type: ApiResponseDto,
  })
  async getRecentActivity(
    @Param('tenantId') tenantId: string,
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponseDto<TenantActivity[]>> {
    const activities = await this.tenantDashboardService.getRecentActivity(
      tenantId,
      limit,
    );

    return {
      success: true,
      statusCode: 200,
      message: 'Recent activity retrieved successfully',
      data: activities,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/reports')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate a tenant report preview (JSON rows)' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({ name: 'category', required: true, description: 'issues, support, disputes, fleet, drivers, trips, cargo, parking, users, invoices, payments, credits' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getTenantReport(
    @Param('tenantId') tenantId: string,
    @Query('category') category: TenantReportCategory,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    if (!category) {
      throw new BadRequestException('category is required');
    }
    const data = await this.tenantReportsService.generate(tenantId, {
      category,
      status,
      priority,
      search,
      dateFrom,
      dateTo,
    });
    return {
      success: true,
      statusCode: 200,
      message: `${data.title} report generated`,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/reports/export')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Download a tenant report as CSV' })
  async exportTenantReport(
    @Res() res: express.Response,
    @Param('tenantId') tenantId: string,
    @Query('category') category: TenantReportCategory,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<void> {
    const report = await this.tenantReportsService.generate(tenantId, {
      category,
      status,
      priority,
      search,
      dateFrom,
      dateTo,
    });
    const csv = this.tenantReportsService.toCsv(report);
    const stamp = new Date().toISOString().split('T')[0];
    const filename = `${report.title.toLowerCase().replace(/\s+/g, '-')}-${stamp}.csv`;
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(csv);
  }

  @Get(':tenantId/export')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Export tenant data',
    description: 'Export tenant data as CSV for a selected category',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({
    name: 'format',
    description: 'Export format (csv)',
    required: false,
  })
  @ApiQuery({
    name: 'category',
    description: 'Report category',
    required: false,
  })
  @ApiQuery({
    name: 'timeRange',
    description: 'Time range for export',
    required: false,
  })
  @ApiOkResponse({
    description: 'Data exported successfully',
  })
  async exportTenantData(
    @Param('tenantId') tenantId: string,
    @Query('format') _format: string = 'csv',
    @Query('timeRange') timeRange: string = '30d',
    @Query('category') category: TenantReportCategory = 'trips',
    @Res() res: express.Response,
  ): Promise<void> {
    const end = new Date();
    const days = timeRange === '90d' ? 90 : timeRange === '7d' ? 7 : 30;
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const report = await this.tenantReportsService.generate(tenantId, {
      category,
      dateFrom: start.toISOString().slice(0, 10),
      dateTo: end.toISOString().slice(0, 10),
    });
    const csv = this.tenantReportsService.toCsv(report);
    const filename = `tenant-report-${category}-${new Date().toISOString().split('T')[0]}.csv`;

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.send(csv);
  }

  @Get(':tenantId/summary')
  @ApiOperation({
    summary: 'Get tenant dashboard summary',
    description:
      'Get a comprehensive summary including metrics, trends, and recent activity',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({
    name: 'timeRange',
    description: 'Time range (7d, 30d, 90d)',
    required: false,
  })
  @ApiOkResponse({
    description: 'Tenant dashboard summary retrieved successfully',
    type: ApiResponseDto,
  })
  async getTenantDashboardSummary(
    @Param('tenantId') tenantId: string,
    @Query('timeRange') timeRange: string = '7d',
  ): Promise<ApiResponseDto<any>> {
    const [metrics, trends, activity, lowCreditPartners] = await Promise.all([
      this.tenantDashboardService.getTenantMetrics(tenantId, timeRange),
      this.tenantDashboardService.getTenantTrends(tenantId, timeRange),
      this.tenantDashboardService.getRecentActivity(tenantId, 10),
      this.tenantDashboardService.getLowCreditPartners(tenantId),
    ]);

    // Trigger notifications for low credit partners
    // Note: In production, this should be handled by a scheduled task
    await this.tenantDashboardService.notifyLowCreditPartners(tenantId);

    const summary = {
      metrics,
      trends,
      recentActivity: activity,
      lowCreditPartners,
      lastUpdated: new Date().toISOString(),
    };

    return {
      success: true,
      statusCode: 200,
      message: 'Tenant dashboard summary retrieved successfully',
      data: summary,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':tenantId/notify-low-credit')
  @ApiOperation({ summary: 'Notify partners with low credit' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  async notifyLowCredit(
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponseDto<any>> {
    await this.tenantDashboardService.notifyLowCreditPartners(tenantId);

    return {
      success: true,
      statusCode: 200,
      message: 'Low credit notifications sent successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/truck-owner-performance')
  @ApiOperation({ summary: 'Get performance metrics for truck owners' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiOkResponse({ description: 'Truck owner performance retrieved successfully' })
  async getTruckOwnerPerformance(
    @Param('tenantId') tenantId: string,
  ): Promise<ApiResponseDto<any[]>> {
    const performance = await this.tenantDashboardService.getTruckOwnerPerformance(tenantId);
    return {
      success: true,
      statusCode: 200,
      message: 'Truck owner performance retrieved successfully',
      data: performance,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':tenantId/cargo')
  @ApiOperation({ summary: 'Get cargo metrics for tenant' })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({ name: 'timeRange', description: 'Time range (7d, 30d, 90d)', required: false })
  @ApiOkResponse({ description: 'Cargo metrics retrieved successfully' })
  async getCargoMetrics(
    @Param('tenantId') tenantId: string,
    @Query('timeRange') timeRange: string = '7d',
  ): Promise<ApiResponseDto<any>> {
    const metrics = await this.tenantDashboardService.getCargoMetrics(tenantId, timeRange);
    return {
      success: true,
      statusCode: 200,
      message: 'Cargo metrics retrieved successfully',
      data: metrics,
      timestamp: new Date().toISOString(),
    };
  }
}
