import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsDataProcessorService } from '../services/analytics-data-processor.service';
import {
  BaseAnalyticsFiltersDto,
  InsightsFiltersDto,
  PaginatedResponseDto,
  AnalyticsMetricsDto,
} from '../dto/analytics-filters.dto';
import { AnalyticsInsights } from '../../../entities/analytics-insights.entity';
import { CargoOwnerAnalytics } from '../../../entities/cargo-owner-analytics.entity';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionGuard) // Existing guards
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly dataProcessorService: AnalyticsDataProcessorService,
  ) {}

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint without permissions' })
  async testEndpoint(@Request() req): Promise<any> {
    const { tenantId, userId, role } = req.user;
    return {
      message: 'Test endpoint working',
      user: { tenantId, userId, role },
      timestamp: new Date().toISOString()
    };
  }

  @Get('overview')
  @RequirePermissions('analytics:view') // New permission
  @ApiOperation({ summary: 'Get analytics overview metrics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics overview retrieved successfully',
    type: AnalyticsMetricsDto,
  })
  async getAnalyticsOverview(@Request() req): Promise<AnalyticsMetricsDto> {
    const { tenantId, userId } = req.user; // Existing tenant isolation pattern
    return this.analyticsService.getAnalyticsOverview(tenantId, userId);
  }

  @Get('data')
  @RequirePermissions('analytics:view')
  @ApiOperation({ summary: 'Get analytics data with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analytics data retrieved successfully',
    type: PaginatedResponseDto,
  })
  async getAnalyticsData(
    @Request() req,
    @Query() filters: BaseAnalyticsFiltersDto,
  ): Promise<PaginatedResponseDto<CargoOwnerAnalytics>> {
    const { tenantId, userId } = req.user;
    return this.analyticsService.getAnalyticsData(tenantId, userId, filters);
  }

  @Get('insights')
  @RequirePermissions('analytics:insights') // New permission for AI insights
  @ApiOperation({ summary: 'Get AI-generated insights' })
  @ApiResponse({ 
    status: 200, 
    description: 'Insights retrieved successfully',
    type: PaginatedResponseDto,
  })
  async getInsights(
    @Request() req,
    @Query() filters: InsightsFiltersDto,
  ): Promise<PaginatedResponseDto<AnalyticsInsights>> {
    const { tenantId, userId } = req.user;
    return this.analyticsService.getInsights(tenantId, userId, filters);
  }

  @Post('insights/generate')
  @RequirePermissions('analytics:insights')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate new AI insights (consumes credits)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Insights generated successfully',
    type: [AnalyticsInsights],
  })
  @ApiResponse({ 
    status: 402, 
    description: 'Insufficient credits',
  })
  async generateInsights(@Request() req): Promise<AnalyticsInsights[]> {
    const { tenantId, userId } = req.user;
    return this.analyticsService.generateInsights(tenantId, userId, userId);
  }

  @Patch('insights/:insightId/dismiss')
  @RequirePermissions('analytics:insights')
  @ApiOperation({ summary: 'Dismiss an insight' })
  @ApiResponse({ 
    status: 200, 
    description: 'Insight dismissed successfully',
    type: AnalyticsInsights,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Insight not found',
  })
  async dismissInsight(
    @Request() req,
    @Param('insightId') insightId: string,
  ): Promise<AnalyticsInsights> {
    const { tenantId, userId } = req.user;
    return this.analyticsService.dismissInsight(tenantId, userId, insightId, userId);
  }

  @Patch('insights/:insightId/implement')
  @RequirePermissions('analytics:insights')
  @ApiOperation({ summary: 'Mark insight as implemented' })
  @ApiResponse({ 
    status: 200, 
    description: 'Insight marked as implemented',
    type: AnalyticsInsights,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Insight not found',
  })
  async implementInsight(
    @Request() req,
    @Param('insightId') insightId: string,
  ): Promise<AnalyticsInsights> {
    const { tenantId, userId } = req.user;
    return this.analyticsService.implementInsight(tenantId, userId, insightId, userId);
  }

  @Post('backfill')
  @RequirePermissions('analytics:admin') // Admin-only operation
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Backfill analytics data for existing loads (Admin only)' })
  @ApiResponse({ 
    status: 202, 
    description: 'Backfill process started',
  })
  async backfillAnalyticsData(@Request() req): Promise<{ message: string }> {
    const { tenantId } = req.user;
    
    // Run backfill asynchronously
    this.dataProcessorService.backfillAnalyticsData(tenantId, 1000)
      .catch(error => {
        console.error('Backfill failed:', error);
      });

    return { message: 'Analytics backfill process started' };
  }
}