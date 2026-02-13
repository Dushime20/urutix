import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EnforcementService } from './enforcement.service';
import { AppealsService } from './appeals.service';
import { RiskDetectionService } from './risk-detection.service';
import { AuditService } from './audit.service';
import { BlacklistService } from './blacklist.service';

/**
 * DashboardController
 * 
 * Provides dashboard statistics and summaries for governance.
 * Aggregates data from all governance modules.
 * Used for admin dashboard and reporting.
 * 
 * Base Path: /governance/dashboard
 */
@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('governance/dashboard')
export class DashboardController {
  constructor(
    private enforcementService: EnforcementService,
    private appealsService: AppealsService,
    private riskDetectionService: RiskDetectionService,
    private auditService: AuditService,
    private blacklistService: BlacklistService,
  ) {}

  /**
   * Get dashboard statistics
   * 
   * GET /governance/dashboard/stats
   * 
   * Returns comprehensive governance statistics.
   * Includes counts, trends, and key metrics.
   * 
   * @param period - Time period for statistics (day, week, month, year)
   * @returns Dashboard statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'] })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getDashboardStats(@Query('period') period: string = 'month') {
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Gather statistics from all services
    const [auditStats, blacklistStats] = await Promise.all([
      this.auditService.getStatistics(startDate, endDate),
      this.blacklistService.getStatistics(),
    ]);

    const pendingAppeals = await this.appealsService.getPendingAppeals();

    return {
      success: true,
      data: {
        period,
        startDate,
        endDate,
        enforcement: {
          totalActions: auditStats.totalActions || 0,
          suspensions: auditStats.suspensions || 0,
          terminations: auditStats.terminations || 0,
          restrictions: auditStats.restrictions || 0,
        },
        appeals: {
          pending: pendingAppeals.length,
          total: auditStats.appeals || 0,
        },
        blacklist: {
          totalEntries: blacklistStats.total || 0,
          activeEntries: blacklistStats.active || 0,
        },
        riskFlags: {
          pending: 0, // Will be populated from database
          total: 0,
        },
      },
    };
  }

  /**
   * Get flagged users
   * 
   * GET /governance/dashboard/flagged-users
   * 
   * Returns users with high risk scores or pending flags.
   * Sorted by risk score descending.
   * 
   * @param limit - Number of users to return
   * @returns Flagged users list
   */
  @Get('flagged-users')
  @ApiOperation({ summary: 'Get flagged users' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Flagged users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getFlaggedUsers(@Query('limit') limit: number = 20) {
    // This will be populated from database queries
    // For now, return placeholder
    return {
      success: true,
      data: [],
      message: 'Flagged users endpoint - implementation pending',
    };
  }

  /**
   * Get pending appeals
   * 
   * GET /governance/dashboard/pending-appeals
   * 
   * Returns appeals awaiting admin review.
   * Sorted by creation date (oldest first).
   * 
   * @param limit - Number of appeals to return
   * @returns Pending appeals list
   */
  @Get('pending-appeals')
  @ApiOperation({ summary: 'Get pending appeals' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Pending appeals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getPendingAppeals(@Query('limit') limit: number = 20) {
    const appeals = await this.appealsService.getPendingAppeals();
    const limitedAppeals = appeals.slice(0, Number(limit));

    return {
      success: true,
      data: limitedAppeals,
    };
  }

  /**
   * Get recent actions
   * 
   * GET /governance/dashboard/recent-actions
   * 
   * Returns recent enforcement actions.
   * Provides activity feed for dashboard.
   * 
   * @param limit - Number of actions to return
   * @returns Recent actions list
   */
  @Get('recent-actions')
  @ApiOperation({ summary: 'Get recent enforcement actions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent actions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getRecentActions(@Query('limit') limit: number = 20) {
    const actions = await this.auditService.getRecentActions(Number(limit));

    return {
      success: true,
      data: actions,
    };
  }

  /**
   * Get enforcement trends
   * 
   * GET /governance/dashboard/trends
   * 
   * Returns enforcement action trends over time.
   * Used for charts and graphs.
   * 
   * @param period - Time period (day, week, month)
   * @param groupBy - Group by (day, week, month)
   * @returns Trend data
   */
  @Get('trends')
  @ApiOperation({ summary: 'Get enforcement trends' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'] })
  @ApiQuery({ name: 'groupBy', required: false, enum: ['day', 'week', 'month'] })
  @ApiResponse({ status: 200, description: 'Trends retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getEnforcementTrends(
    @Query('period') period: string = 'month',
    @Query('groupBy') groupBy: string = 'day',
  ) {
    // This will be populated with time-series data
    // For now, return placeholder
    return {
      success: true,
      data: {
        period,
        groupBy,
        trends: [],
      },
      message: 'Trends endpoint - implementation pending',
    };
  }

  /**
   * Get admin activity summary
   * 
   * GET /governance/dashboard/admin-activity
   * 
   * Returns summary of admin actions.
   * Shows which admins are most active.
   * 
   * @param period - Time period
   * @param limit - Number of admins to return
   * @returns Admin activity summary
   */
  @Get('admin-activity')
  @ApiOperation({ summary: 'Get admin activity summary' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Admin activity retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getAdminActivity(
    @Query('period') period: string = 'month',
    @Query('limit') limit: number = 10,
  ) {
    // This will be populated with admin activity data
    // For now, return placeholder
    return {
      success: true,
      data: {
        period,
        admins: [],
      },
      message: 'Admin activity endpoint - implementation pending',
    };
  }
}
