import {
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../types/permission.types';
import { AdminService } from './admin.service';
import { BiddingService } from '../bidding/bidding.service';

/**
 * Operational Admin Controller
 * 
 * This controller handles operational oversight endpoints for ADMIN role.
 * These endpoints are scoped to tenant-level operations and do not include
 * system-level management features reserved for SUPER_ADMIN.
 */
@ApiTags('Operational Admin')
@Controller('admin/operational')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class OperationalAdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly biddingService: BiddingService,
  ) {}

  /**
   * Get operational KPIs scoped to tenant
   */
  @Get('kpi')
  @ApiOperation({ summary: 'Get operational KPIs for tenant' })
  @ApiResponse({ status: 200, description: 'KPI metrics retrieved' })
  getOperationalKpi(@Request() req) {
    // Admin only sees their tenant's KPIs
    return this.adminService.getKpi(req.user.tenantId);
  }

  /**
   * Get disputes for tenant
   */
  @Get('disputes')
  @ApiOperation({ summary: 'List disputes for tenant' })
  @ApiResponse({ status: 200, description: 'Disputes retrieved' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by reason or ID' })
  getDisputes(@Request() req) {
    return this.adminService.getDisputes(req.user.tenantId);
  }

  /**
   * Update dispute status
   */
  @Patch('disputes/:id')
  @ApiOperation({ summary: 'Update dispute status' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({ status: 200, description: 'Dispute updated' })
  updateDisputeStatus(
    @Param('id') id: string,
    @Body() body: { status: string; resolution?: string },
  ) {
    return this.adminService.updateDisputeStatus(id, body.status, body.resolution);
  }

  /**
   * Get trips for tenant
   */
  @Get('trips')
  @ApiOperation({ summary: 'List trips for tenant' })
  @ApiResponse({ status: 200, description: 'Trips retrieved' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  getTrips(@Request() req) {
    return this.adminService.listAllTrips(req.user.tenantId);
  }

  /**
   * Get loads for tenant
   */
  @Get('loads')
  @ApiOperation({ summary: 'List loads for tenant' })
  @ApiResponse({ status: 200, description: 'Loads retrieved' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  getLoads(@Request() req) {
    return this.adminService.listAllLoads(req.user.tenantId);
  }

  /**
   * Get users for tenant
   */
  @Get('users')
  @ApiOperation({ summary: 'List users for tenant' })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  getUsers(@Request() req) {
    return this.adminService.getUsers(req.user.tenantId);
  }

  /**
   * Get financial overview for tenant
   */
  @Get('financials')
  @ApiOperation({ summary: 'Get financial overview for tenant' })
  @ApiResponse({ status: 200, description: 'Financial data retrieved' })
  getFinancials(@Request() req) {
    return this.adminService.getFinancials(req.user.tenantId);
  }

  /**
   * Get analytics for tenant
   */
  @Get('analytics')
  @ApiOperation({ summary: 'Get analytics for tenant' })
  @ApiResponse({ status: 200, description: 'Analytics data retrieved' })
  getAnalytics(@Request() req) {
    return this.adminService.getAnalytics(req.user.tenantId);
  }

  /**
   * Get analytics overview for tenant
   */
  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get analytics overview for tenant' })
  @ApiResponse({ status: 200, description: 'Analytics overview retrieved' })
  getAnalyticsOverview(@Request() req) {
    return this.adminService.getAnalyticsOverview(req.user.tenantId);
  }

  /**
   * Get cargo analytics for tenant
   */
  @Get('analytics/cargo')
  @ApiOperation({ summary: 'Get cargo ecosystem analytics for tenant' })
  @ApiResponse({ status: 200, description: 'Cargo analytics retrieved' })
  getCargoAnalytics(@Request() req) {
    return this.adminService.getCargoAnalytics(req.user.tenantId);
  }

  /**
   * Get fleet analytics for tenant
   */
  @Get('analytics/fleet')
  @ApiOperation({ summary: 'Get fleet logistics analytics for tenant' })
  @ApiResponse({ status: 200, description: 'Fleet analytics retrieved' })
  getFleetAnalytics(@Request() req) {
    return this.adminService.getFleetAnalytics(req.user.tenantId);
  }

  /**
   * Get audit logs for tenant
   */
  @Get('audit')
  @ApiOperation({ summary: 'Get audit logs for tenant' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getAudit(@Request() req) {
    return this.adminService.getAudit(req.user.tenantId);
  }

  /**
   * Get system health (read-only for operational monitoring)
   */
  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  getHealth() {
    return this.adminService.getHealth();
  }

  /**
   * Get all bids for tenant (Bidding Oversight)
   */
  @Get('bids')
  @ApiOperation({ summary: 'Get all bids for tenant oversight' })
  @ApiResponse({ status: 200, description: 'Bids retrieved' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by bid status' })
  getBids(@Request() req, @Query('status') status?: string) {
    return this.biddingService.getMyBids(req.user.userId, req.user.tenantId, req.user.role);
  }

  /**
   * Get all auctions for tenant (Bidding Oversight)
   */
  @Get('auctions')
  @ApiOperation({ summary: 'Get all auctions for tenant oversight' })
  @ApiResponse({ status: 200, description: 'Auctions retrieved' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by auction status' })
  getAuctions(@Request() req, @Query('status') status?: string) {
    return this.biddingService.getAuctions(req.user.tenantId, status, req.user.userId, req.user.role);
  }

  /**
   * Get bidding dashboard stats
   */
  @Get('bidding/stats')
  @ApiOperation({ summary: 'Get bidding dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Bidding stats retrieved' })
  getBiddingStats(@Request() req) {
    return this.biddingService.getDashboardStats(req.user.userId, req.user.tenantId, req.user.role);
  }

  /**
   * Get bid history for tenant
   */
  @Get('bids/history')
  @ApiOperation({ summary: 'Get bid history for tenant' })
  @ApiResponse({ status: 200, description: 'Bid history retrieved' })
  getBidHistory(@Request() req) {
    return this.biddingService.getBidHistory(req.user.userId, req.user.tenantId, req.user.role);
  }

  /**
   * GET /admin/operational/dashboard/charts
   * All chart data for the overview page, scoped to the admin's tenant.
   * Returns: revenueAndTrips, loadStatus, bidActivity, recentActivity, kpi
   */
  @Get('dashboard/charts')
  @ApiOperation({ summary: 'Get overview dashboard chart data for tenant' })
  @ApiResponse({ status: 200, description: 'Dashboard chart data retrieved' })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days for revenue trend (7 or 30)' })
  getDashboardCharts(@Request() req, @Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 7;
    return this.adminService.getDashboardCharts(req.user.tenantId, numDays);
  }
}
