import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseEnumPipe,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import {
  EnhancedSystemHealthService,
  MetricCategory,
} from '../../services/enhanced-system-health.service';

@ApiTags('System Health - Enhanced')
@Controller('admin/system-health/enhanced')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth('JWT-auth')
export class EnhancedSystemHealthController {
  constructor(
    private readonly systemHealthService: EnhancedSystemHealthService,
  ) {}

  /**
   * Get current system metrics
   * Requirement 1.1: Display real-time metrics for database, API, and server
   */
  @Get('current')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Get current system metrics',
    description: 'Returns real-time metrics for database performance, API response times, and server resource utilization',
  })
  @ApiResponse({
    status: 200,
    description: 'Current system metrics retrieved successfully',
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

  /**
   * Get historical metrics
   * Requirement 1.3: Display historical trends for the past 30 days
   */
  @Get('historical')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Get historical system metrics',
    description: 'Returns historical metrics for the specified time range with hourly granularity',
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: true,
    description: 'Start date in ISO format',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: true,
    description: 'End date in ISO format',
    example: '2024-01-31T23:59:59Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Historical metrics retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          timestamp: { type: 'string', format: 'date-time' },
          metricType: { type: 'string' },
          metricName: { type: 'string' },
          value: { type: 'number' },
        },
      },
    },
  })
  async getHistoricalMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.systemHealthService.getHistoricalMetrics(start, end);
  }

  /**
   * Get metrics by category
   * Requirement 1.6: Filter health metrics by time range
   */
  @Get('category')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Get metrics by category',
    description: 'Returns metrics filtered by category (DATABASE, API, or SERVER)',
  })
  @ApiQuery({
    name: 'category',
    enum: MetricCategory,
    required: true,
    description: 'Metric category to filter by',
  })
  @ApiResponse({
    status: 200,
    description: 'Category metrics retrieved successfully',
  })
  async getMetricsByCategory(
    @Query('category', new ParseEnumPipe(MetricCategory)) category: MetricCategory,
  ) {
    return this.systemHealthService.getMetricsByCategory(category);
  }

  /**
   * Check threshold violations
   * Requirement 1.2: Highlight metrics exceeding thresholds with severity levels
   */
  @Get('thresholds')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @ApiOperation({
    summary: 'Check threshold violations',
    description: 'Returns all metrics that exceed defined thresholds with severity levels',
  })
  @ApiResponse({
    status: 200,
    description: 'Threshold violations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          metricType: { type: 'string' },
          metricName: { type: 'string' },
          currentValue: { type: 'number' },
          thresholdValue: { type: 'number' },
          severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async checkThresholds() {
    return this.systemHealthService.checkThresholds();
  }

  /**
   * Export metrics as CSV
   * Requirement 1.7: Generate CSV file with all metrics
   */
  @Get('export')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('super_admin')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="system-metrics.csv"')
  @ApiOperation({
    summary: 'Export system metrics',
    description: 'Exports system metrics as CSV file for the specified time range',
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
    description: 'Metrics exported successfully',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async exportMetrics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.systemHealthService.exportMetrics(start, end);
  }
}
