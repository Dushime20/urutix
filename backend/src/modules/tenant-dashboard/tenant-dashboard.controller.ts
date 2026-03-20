import { Controller, Get, Post, Param, Query, UseGuards, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import * as express from 'express';
import {
  TenantDashboardService,
  TenantMetrics,
  TenantTrends,
  TenantActivity,
} from './tenant-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Tenant Dashboard')
@Controller('tenant-dashboard')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TenantDashboardController {
  constructor(
    private readonly tenantDashboardService: TenantDashboardService,
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

  @Get(':tenantId/export')
  @ApiOperation({
    summary: 'Export tenant data',
    description: 'Export tenant data in various formats (CSV, Excel, PDF)',
  })
  @ApiParam({ name: 'tenantId', description: 'Tenant ID' })
  @ApiQuery({
    name: 'format',
    description: 'Export format (csv, excel, pdf)',
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
    @Query('format') format: string = 'csv',
    @Query('timeRange') timeRange: string = '7d',
    @Res() res: express.Response,
  ): Promise<void> {
    const options = { timeRange, dataType: 'dashboard' };
    const blob = await this.tenantDashboardService.exportTenantData(
      tenantId,
      format,
      options,
    );

    const filename = `tenant-dashboard-${format}-${new Date().toISOString().split('T')[0]}.${format}`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': blob.size.toString(),
    });

    res.send(blob);
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
}
