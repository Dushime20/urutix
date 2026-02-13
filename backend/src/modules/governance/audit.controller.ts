import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditService } from './audit.service';

/**
 * AuditController
 * 
 * Provides access to the immutable audit trail.
 * Tracks all enforcement actions with full history.
 * Supports filtering, export, and reporting.
 * 
 * Base Path: /governance/audit
 */
@ApiTags('Audit')
@ApiBearerAuth()
@Controller('governance/audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  /**
   * Get audit logs with filtering
   * 
   * GET /governance/audit
   * 
   * Returns paginated audit logs with optional filtering.
   * Supports filtering by action type, user, admin, and date range.
   * 
   * @param page - Page number
   * @param limit - Items per page
   * @param actionType - Filter by action type
   * @param userId - Filter by target user
   * @param adminId - Filter by admin
   * @param startDate - Filter by start date
   * @param endDate - Filter by end date
   * @returns Paginated audit logs
   */
  @Get()
  @ApiOperation({ summary: 'Get audit logs with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'actionType', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'adminId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getAuditLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('actionType') actionType?: string,
    @Query('userId') userId?: string,
    @Query('adminId') adminId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      actionType,
      userId,
      adminId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const result = await this.auditService.getAuditTrail(filters, Number(page), Number(limit));

    return {
      success: true,
      data: result.logs,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Get audit logs for a specific user
   * 
   * GET /governance/audit/user/:userId
   * 
   * Returns all enforcement actions taken against a user.
   * Provides complete enforcement history.
   * 
   * @param userId - User ID
   * @returns User's audit trail
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get audit logs for a specific user' })
  @ApiResponse({ status: 200, description: 'User audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getUserAuditLogs(@Param('userId') userId: string) {
    const logs = await this.auditService.getActionsByUser(userId);

    return {
      success: true,
      data: logs,
    };
  }

  /**
   * Get audit logs by admin
   * 
   * GET /governance/audit/admin/:adminId
   * 
   * Returns all actions performed by a specific admin.
   * Useful for admin accountability and reporting.
   * 
   * @param adminId - Admin user ID
   * @returns Admin's action history
   */
  @Get('admin/:adminId')
  @ApiOperation({ summary: 'Get audit logs by admin' })
  @ApiResponse({ status: 200, description: 'Admin audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getAdminAuditLogs(@Param('adminId') adminId: string) {
    const logs = await this.auditService.getActionsByAdmin(adminId);

    return {
      success: true,
      data: logs,
    };
  }

  /**
   * Get audit statistics
   * 
   * GET /governance/audit/stats
   * 
   * Returns statistics about enforcement actions.
   * Includes counts by action type, severity, and time period.
   * 
   * @param startDate - Start date for statistics
   * @param endDate - End date for statistics
   * @returns Audit statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async getAuditStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.auditService.getStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Export audit logs
   * 
   * GET /governance/audit/export
   * 
   * Exports audit logs in various formats (CSV, Excel, JSON).
   * Supports same filtering as main audit endpoint.
   * 
   * @param format - Export format (csv, excel, json)
   * @param actionType - Filter by action type
   * @param userId - Filter by user
   * @param adminId - Filter by admin
   * @param startDate - Filter by start date
   * @param endDate - Filter by end date
   * @param res - Response object for file download
   */
  @Get('export')
  @ApiOperation({ summary: 'Export audit logs' })
  @ApiQuery({ name: 'format', required: true, enum: ['csv', 'excel', 'json'] })
  @ApiQuery({ name: 'actionType', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'adminId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Audit logs exported successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires admin role' })
  async exportAuditLogs(
    @Query('format') format: 'csv' | 'excel' | 'json',
    @Query('actionType') actionType?: string,
    @Query('userId') userId?: string,
    @Query('adminId') adminId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: Response,
  ) {
    const filters = {
      actionType,
      userId,
      adminId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const exportData = await this.auditService.exportAuditLog(filters, format);

    // Set appropriate headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit-log-${timestamp}.${format === 'excel' ? 'xlsx' : format}`;
    
    res.setHeader('Content-Type', this.getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.send(exportData);
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }
}
