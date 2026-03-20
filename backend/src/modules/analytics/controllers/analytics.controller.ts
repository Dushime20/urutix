import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsFilterDto } from '../dto/analytics-filter.dto';
import { DashboardRequestDto } from '../dto/dashboard-request.dto';
import { PredictiveAnalyticsService } from '../services/predictive-analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly predictiveService: PredictiveAnalyticsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get dashboard data',
    description:
      'Retrieve comprehensive dashboard data with all analytics metrics',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    type: String,
    description: 'Analytics period (day, week, month, quarter, year)',
    example: 'month',
  })
  @ApiQuery({
    name: 'metrics',
    required: false,
    type: String,
    description: 'Comma-separated list of metrics to include',
    example: 'revenue,trips,payments',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'User ID for user-specific analytics',
    example: 'user-uuid',
  })
  @ApiOkResponse({
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Dashboard data retrieved successfully',
        },
        dashboard: {
          type: 'object',
          properties: {
            revenue: {
              type: 'object',
              properties: {
                totalRevenue: { type: 'number', example: 125000 },
                netRevenue: { type: 'number', example: 118750 },
                paymentCount: { type: 'number', example: 50 },
              },
            },
            trips: {
              type: 'object',
              properties: {
                totalTrips: { type: 'number', example: 45 },
                completedTrips: { type: 'number', example: 40 },
                completionRate: { type: 'number', example: 88.89 },
              },
            },
            loads: {
              type: 'object',
              properties: {
                totalLoads: { type: 'number', example: 60 },
                assignmentRate: { type: 'number', example: 66.67 },
              },
            },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  async getDashboardData(
    @Query() dashboardRequest: DashboardRequestDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const dashboardData = await this.analyticsService.getDashboardData(
      dashboardRequest,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: { dashboard: dashboardData },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('revenue')
  @ApiOperation({
    summary: 'Get revenue analytics',
    description: 'Retrieve detailed revenue analytics and financial metrics',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analytics period',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analytics period',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'User ID for user-specific analytics',
    example: 'user-uuid',
  })
  @ApiOkResponse({
    description: 'Revenue analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Revenue analytics retrieved successfully',
        },
        revenue: {
          type: 'object',
          properties: {
            totalRevenue: { type: 'number', example: 125000 },
            netRevenue: { type: 'number', example: 118750 },
            totalProcessingFees: { type: 'number', example: 6250 },
            averagePayment: { type: 'number', example: 2500 },
            paymentCount: { type: 'number', example: 50 },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  async getRevenueAnalytics(
    @Query() filter: AnalyticsFilterDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    const revenueData = await this.analyticsService.getRevenueAnalytics(
      startDate,
      endDate,
      req.user.tenantId,
      filter.userId,
    );

    return {
      success: true,
      message: 'Revenue analytics retrieved successfully',
      data: { revenue: revenueData },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('trips')
  @ApiOperation({
    summary: 'Get trip analytics',
    description: 'Retrieve trip performance analytics and metrics',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analytics period',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analytics period',
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'User ID for user-specific analytics',
    example: 'user-uuid',
  })
  @ApiOkResponse({
    description: 'Trip analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Trip analytics retrieved successfully',
        },
        trips: {
          type: 'object',
          properties: {
            totalTrips: { type: 'number', example: 45 },
            completedTrips: { type: 'number', example: 40 },
            completionRate: { type: 'number', example: 88.89 },
            averageTripDuration: { type: 'number', example: 48.5 },
          },
        },
        statusCode: { type: 'number', example: 200 },
      },
    },
  })
  async getTripAnalytics(
    @Query() filter: AnalyticsFilterDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    const tripData = await this.analyticsService.getTripAnalytics(
      startDate,
      endDate,
      req.user.tenantId,
      filter.userId,
    );

    return {
      success: true,
      message: 'Trip analytics retrieved successfully',
      data: { trips: tripData },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('loads')
  @ApiOperation({
    summary: 'Get load analytics',
    description: 'Retrieve load management analytics and performance metrics',
  })
  @ApiOkResponse({
    description: 'Load analytics retrieved successfully',
  })
  async getLoadAnalytics(
    @Query() filter: AnalyticsFilterDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    const loadData = await this.analyticsService.getLoadAnalytics(
      startDate,
      endDate,
      req.user.tenantId,
      filter.userId,
    );

    return {
      success: true,
      message: 'Load analytics retrieved successfully',
      data: { loads: loadData },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('payments')
  @ApiOperation({
    summary: 'Get payment analytics',
    description: 'Retrieve payment processing analytics and financial metrics',
  })
  @ApiOkResponse({
    description: 'Payment analytics retrieved successfully',
  })
  async getPaymentAnalytics(
    @Query() filter: AnalyticsFilterDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    const paymentData = await this.analyticsService.getPaymentAnalytics(
      startDate,
      endDate,
      req.user.tenantId,
      filter.userId,
    );

    return {
      success: true,
      message: 'Payment analytics retrieved successfully',
      data: { payments: paymentData },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('users')
  @ApiOperation({
    summary: 'Get user analytics',
    description: 'Retrieve user growth and engagement analytics',
  })
  @ApiOkResponse({
    description: 'User analytics retrieved successfully',
  })
  async getUserAnalytics(
    @Query() filter: AnalyticsFilterDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    const userData = await this.analyticsService.getUserAnalytics(
      startDate,
      endDate,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'User analytics retrieved successfully',
      data: { users: userData },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('fleet')
  @ApiOperation({
    summary: 'Get fleet analytics',
    description: 'Retrieve fleet utilization and performance analytics',
  })
  @ApiOkResponse({
    description: 'Fleet analytics retrieved successfully',
  })
  async getFleetAnalytics(
    @Query() filter: AnalyticsFilterDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    const fleetData = await this.analyticsService.getFleetAnalytics(
      startDate,
      endDate,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Fleet analytics retrieved successfully',
      data: { fleet: fleetData },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('matching')
  @ApiOperation({
    summary: 'Get matching analytics',
    description: 'Retrieve AI matching performance analytics',
  })
  @ApiOkResponse({
    description: 'Matching analytics retrieved successfully',
  })
  async getMatchingAnalytics(
    @Query() filter: AnalyticsFilterDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    const matchingData = await this.analyticsService.getMatchingAnalytics(
      startDate,
      endDate,
      req.user.tenantId,
    );

    return {
      success: true,
      message: 'Matching analytics retrieved successfully',
      data: { matching: matchingData },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('notifications')
  @ApiOperation({
    summary: 'Get notification analytics',
    description: 'Retrieve notification engagement and delivery analytics',
  })
  @ApiOkResponse({
    description: 'Notification analytics retrieved successfully',
  })
  async getNotificationAnalytics(
    @Query() filter: AnalyticsFilterDto,
    @Request() req,
  ): Promise<ApiResponseDto> {
    const startDate = filter.startDate
      ? new Date(filter.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = filter.endDate ? new Date(filter.endDate) : new Date();

    const notificationData =
      await this.analyticsService.getNotificationAnalytics(
        startDate,
        endDate,
        req.user.tenantId,
        filter.userId,
      );

    return {
      success: true,
      message: 'Notification analytics retrieved successfully',
      data: { notifications: notificationData },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/eta')
  @ApiOperation({ summary: 'Get ETA confidence and predictions for a route' })
  async getETAPrediction(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
  ): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getRouteETAConfidence(origin, destination);
    return {
      success: true,
      message: 'ETA predictive data retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/demand-heatmap')
  @ApiOperation({ summary: 'Get global demand heatmap for logistics hotspots' })
  async getDemandHeatmap(): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getGlobalDemandHeatmap();
    return {
      success: true,
      message: 'Demand heatmap data retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/pricing-engine')
  @ApiOperation({ summary: 'Calculate optimal pricing recommendations for a route' })
  async getPricingRecommendation(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('weight') weight?: number,
  ): Promise<ApiResponseDto> {
    const data = await this.predictiveService.calculateDynamicPricing(origin, destination, weight);
    return {
      success: true,
      message: 'Pricing recommendations generated successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/benchmarking')
  @ApiOperation({ summary: 'Compare performance against market benchmarks' })
  async getBenchmarking(@Request() req): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getStrategicBenchmarking(req.user.tenantId);
    return {
      success: true,
      message: 'Benchmarking data retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/recommendations')
  @ApiOperation({ summary: 'Get AI-driven lane optimization recommendations' })
  async getLaneRecommendations(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
  ): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getAutomatedLaneOptimizations(origin, destination);
    return {
      success: true,
      message: 'Lane recommendations generated successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/carrier-scores')
  @ApiOperation({ summary: 'Get ranked carrier performance scorecards' })
  async getCarrierScores(@Request() req): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getCarrierPerformanceScorecards(req.user.tenantId);
    return {
      success: true,
      message: 'Carrier scorecards retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/sustainability')
  @ApiOperation({ summary: 'Get carbon footprint and sustainability metrics' })
  async getSustainability(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('weight') weight: number,
  ): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getSustainabilityMetrics(origin, destination, weight);
    return {
      success: true,
      message: 'Sustainability metrics generated successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/consolidation')
  @ApiOperation({ summary: 'Get automated cargo consolidation opportunities' })
  async getConsolidation(@Request() req): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getConsolidationOpportunities(req.user.tenantId);
    return {
      success: true,
      message: 'Consolidation opportunities retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/driver-safety')
  @ApiOperation({ summary: 'Get driver health and safety scorecards' })
  async getDriverSafety(@Request() req): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getDriverSafetyScorecards(req.user.tenantId);
    return {
      success: true,
      message: 'Driver safety scorecards retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/maintenance')
  @ApiOperation({ summary: 'Get predictive maintenance scorecards' })
  async getMaintenance(@Request() req): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getPredictiveMaintenanceScorecards(req.user.tenantId);
    return {
      success: true,
      message: 'Predictive maintenance scorecards retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/diversions')
  @ApiOperation({ summary: 'Get neural route diversion opportunities' })
  async getDiversions(@Request() req): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getRouteDiversions(req.user.tenantId);
    return {
      success: true,
      message: 'Route diversions retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/damage')
  @ApiOperation({ summary: 'Get cargo damage risk forecasts' })
  async getDamageRisk(@Request() req): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getPredictiveDamageMetrics(req.user.tenantId);
    return {
      success: true,
      message: 'Cargo damage risk forecasts retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/capacity')
  @ApiOperation({ summary: 'Get regional fleet capacity forecasts' })
  async getCapacityForecast(@Request() req): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getCapacityForecast(req.user.tenantId);
    return {
      success: true,
      message: 'Fleet capacity forecasts retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/utilization')
  @ApiOperation({ summary: 'Get AI-driven fleet utilization audit' })
  async getUtilization(@Request() req): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getFleetUtilization(req.user.tenantId);
    return {
      success: true,
      message: 'Fleet utilization audit retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('predictive/anomalies')
  @ApiOperation({ summary: 'Get AI-driven cyber-intelligence & anomaly audit' })
  async getAnomalies(@Request() req): Promise<ApiResponseDto> {
    const data = await this.predictiveService.getAnomalyAudit(req.user.tenantId);
    return {
      success: true,
      message: 'Anomaly & fraud audit completed successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }
}
