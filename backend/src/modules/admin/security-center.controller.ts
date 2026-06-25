import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Header,
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../types/permission.types';
import { SecurityCenterService } from '../../services/security-center.service';
import { SecuritySeverity } from '../../entities/security-event.entity';

@ApiTags('Security Center')
@Controller('admin/security-center')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth('JWT-auth')
export class SecurityCenterController {
  constructor(private readonly securityCenterService: SecurityCenterService) {}

  /**
   * Get recent failed login attempts
   * Requirement 3.1: Display recent failed login attempts across all tenants
   */
  @Get('failed-logins')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get recent failed login attempts',
    description: 'Returns recent failed login attempts across all tenants',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Maximum number of results to return',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Failed login attempts retrieved successfully',
  })
  async getFailedLogins(@Query('limit') limit?: number) {
    return this.securityCenterService.getFailedLogins(limit || 50);
  }

  /**
   * Get security events
   * Requirement 3.2: Show suspicious activities with categorization
   */
  @Get('events')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get security events',
    description: 'Returns security events filtered by severity',
  })
  @ApiQuery({
    name: 'severity',
    enum: ['low', 'medium', 'high', 'critical'],
    required: false,
    description: 'Filter by severity level',
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Maximum number of results to return',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Security events retrieved successfully',
  })
  async getSecurityEvents(
    @Query('severity') severity?: string,
    @Query('limit') limit?: number,
  ) {
    const severityEnum = severity as SecuritySeverity | undefined;
    return this.securityCenterService.getSecurityEvents(severityEnum, limit || 100);
  }

  /**
   * Get flagged accounts
   * Requirement 3.6: Display accounts with excessive failed login attempts
   */
  @Get('flagged-accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get flagged accounts',
    description: 'Returns accounts with more than 5 failed login attempts in the last 15 minutes',
  })
  @ApiResponse({
    status: 200,
    description: 'Flagged accounts retrieved successfully',
  })
  async getFlaggedAccounts() {
    return this.securityCenterService.getFlaggedAccounts();
  }

  /**
   * Get active user sessions
   * Requirement 3.4: Display active sessions with user details
   */
  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active user sessions',
    description: 'Returns all active user sessions across the platform',
  })
  @ApiResponse({
    status: 200,
    description: 'Active sessions retrieved successfully',
  })
  async getActiveSessions() {
    return this.securityCenterService.getActiveSessions();
  }

  /**
   * Terminate a user session
   * Requirement 3.5: Immediately invalidate session and log the action
   */
  @Post('sessions/:sessionId/terminate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Terminate user session',
    description: 'Immediately terminates a user session and logs the action',
  })
  @ApiParam({
    name: 'sessionId',
    type: String,
    description: 'Session ID to terminate',
  })
  @ApiResponse({
    status: 200,
    description: 'Session terminated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async terminateSession(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
  ) {
    const actorId = req.user?.userId;
    await this.securityCenterService.terminateSession(sessionId, actorId);
    return { message: 'Session terminated successfully' };
  }

  /**
   * Export security logs
   * Requirement 3.7: Generate report containing all security events for time range
   */
  @Get('export')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="security-logs.csv"')
  @ApiOperation({
    summary: 'Export security logs',
    description: 'Exports security logs as CSV file for the specified time range',
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: true,
    description: 'Start date in ISO format',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: true,
    description: 'End date in ISO format',
  })
  @ApiResponse({
    status: 200,
    description: 'Security logs exported successfully',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async exportSecurityLogs(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.securityCenterService.exportSecurityLogs(start, end);
  }

  /**
   * Get permission change history
   * Requirement 3.8: Display history of all RBAC modifications
   */
  @Get('permission-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get permission change history',
    description: 'Returns history of all RBAC modifications with timestamps and actors',
  })
  @ApiQuery({
    name: 'userId',
    type: String,
    required: false,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
    description: 'Start date in ISO format',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
    description: 'End date in ISO format',
  })
  @ApiQuery({
    name: 'action',
    type: String,
    required: false,
    description: 'Filter by action type',
  })
  @ApiResponse({
    status: 200,
    description: 'Permission history retrieved successfully',
  })
  async getPermissionHistory(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('action') action?: string,
  ) {
    const filters: any = {};
    
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.securityCenterService.getPermissionHistory(filters);
  }
}
