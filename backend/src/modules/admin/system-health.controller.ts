import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { SystemHealthService } from '../../services/system-health.service';
import { ServiceType } from '../../entities/system-health.entity';

@ApiTags('System Health')
@Controller('admin/system-health')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth('JWT-auth')
export class SystemHealthController {
  constructor(private readonly systemHealthService: SystemHealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Get current system health status',
    description: 'Returns overall system health including all services, metrics, and statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'System health retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overallStatus: { type: 'string', enum: ['HEALTHY', 'DEGRADED', 'DOWN'] },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              status: { type: 'string' },
              responseTime: { type: 'number' },
              message: { type: 'string' },
              lastChecked: { type: 'string', format: 'date-time' },
            },
          },
        },
        metrics: {
          type: 'object',
          properties: {
            cpu: {
              type: 'object',
              properties: {
                usage: { type: 'number' },
                cores: { type: 'number' },
                model: { type: 'string' },
              },
            },
            memory: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                used: { type: 'number' },
                free: { type: 'number' },
                usagePercent: { type: 'number' },
              },
            },
            uptime: { type: 'number' },
            platform: { type: 'string' },
            nodeVersion: { type: 'string' },
          },
        },
        activeUsers: { type: 'number' },
        activeTenants: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getSystemHealth() {
    return this.systemHealthService.getSystemHealth();
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Get health history for a specific service',
    description: 'Returns historical health check data for monitoring trends',
  })
  @ApiQuery({
    name: 'service',
    enum: ServiceType,
    required: true,
    description: 'Service type to get history for',
  })
  @ApiQuery({
    name: 'hours',
    type: Number,
    required: false,
    description: 'Number of hours to look back (default: 24)',
  })
  @ApiResponse({
    status: 200,
    description: 'Service health history retrieved successfully',
  })
  async getServiceHealthHistory(
    @Query('service') service: ServiceType,
    @Query('hours') hours?: number,
  ) {
    return this.systemHealthService.getServiceHealthHistory(
      service,
      hours ? parseInt(hours.toString(), 10) : 24,
    );
  }

  @Get('uptime')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Get system uptime statistics',
    description: 'Returns uptime percentage and statistics for a given period',
  })
  @ApiQuery({
    name: 'days',
    type: Number,
    required: false,
    description: 'Number of days to calculate uptime for (default: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Uptime statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string' },
        totalChecks: { type: 'number' },
        healthyChecks: { type: 'number' },
        uptimePercent: { type: 'string' },
        since: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getUptimeStats(@Query('days') days?: number) {
    return this.systemHealthService.getUptimeStats(
      days ? parseInt(days.toString(), 10) : 30,
    );
  }

  @Get('current')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Get current system metrics',
    description: 'Returns real-time metrics for database, API, and server performance (Requirement 1.1)',
  })
  @ApiResponse({
    status: 200,
    description: 'Current metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        database: {
          type: 'object',
          properties: {
            connectionCount: { type: 'number' },
            activeQueries: { type: 'number' },
            avgQueryTime: { type: 'number' },
            slowQueries: { type: 'number' },
            diskUsage: { type: 'number' },
          },
        },
        api: {
          type: 'object',
          properties: {
            requestsPerMinute: { type: 'number' },
            avgResponseTime: { type: 'number' },
            errorRate: { type: 'number' },
            p95ResponseTime: { type: 'number' },
            p99ResponseTime: { type: 'number' },
          },
        },
        server: {
          type: 'object',
          properties: {
            cpuUsage: { type: 'number' },
            memoryUsage: { type: 'number' },
            diskUsage: { type: 'number' },
            networkIn: { type: 'number' },
            networkOut: { type: 'number' },
          },
        },
      },
    },
  })
  async getCurrentMetrics() {
    return this.systemHealthService.getCurrentMetrics();
  }

  @Get('historical')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Get historical system metrics',
    description: 'Returns historical metrics for a specified time range (Requirement 1.3, 1.6)',
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
    description: 'Historical metrics retrieved successfully',
  })
  async getHistoricalMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.systemHealthService.getHistoricalMetrics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('thresholds')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Check metric thresholds',
    description: 'Returns any metrics that exceed defined thresholds with severity levels (Requirement 1.2, 1.4)',
  })
  @ApiResponse({
    status: 200,
    description: 'Threshold check completed successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          metricType: { type: 'string', description: 'Type of metric (database, api, server)' },
          metricName: { type: 'string', description: 'Name of the metric' },
          currentValue: { type: 'number', description: 'Current value of the metric' },
          thresholdValue: { type: 'number', description: 'Threshold value that was exceeded' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Severity level' },
          timestamp: { type: 'string', format: 'date-time', description: 'When the violation was detected' },
          message: { type: 'string', description: 'Human-readable violation message' },
        },
      },
    },
  })
  async checkThresholds() {
    return this.systemHealthService.checkThresholds();
  }

  @Get('export')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Export system metrics as CSV',
    description: 'Generates a CSV file containing all metrics for the selected time range (Requirement 1.7)',
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
    description: 'Metrics exported successfully as CSV',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          example: 'Timestamp,Database Connection Count,Database Active Queries,...',
        },
      },
    },
  })
  async exportMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.systemHealthService.exportMetrics(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
