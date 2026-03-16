import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../../guards/permission.guard';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { MLPipelineService } from '../services/ml-pipeline.service';
import { RealTimeProcessorService } from '../services/real-time-processor.service';
import { ApiMarketplaceService } from '../services/api-marketplace.service';

@ApiTags('Advanced Analytics & ML Pipeline')
@ApiBearerAuth()
@Controller('analytics/advanced')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AdvancedAnalyticsController {
  constructor(
    private readonly mlPipelineService: MLPipelineService,
    private readonly realTimeProcessor: RealTimeProcessorService,
    private readonly apiMarketplaceService: ApiMarketplaceService,
  ) {}

  // ML Pipeline Endpoints
  @Post('ml/train-model')
  @RequirePermissions('analytics:ml_models')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Train advanced ML model for cost prediction' })
  @ApiResponse({ status: 201, description: 'ML model training initiated successfully' })
  async trainMLModel(
    @Request() req,
    @Body() modelConfig: any
  ) {
    const { tenantId, userId } = req.user;
    return this.mlPipelineService.trainCostPredictionModel(tenantId, userId, modelConfig);
  }

  @Get('ml/predictions')
  @RequirePermissions('analytics:ml_models')
  @ApiOperation({ summary: 'Generate advanced ML predictions' })
  @ApiResponse({ status: 200, description: 'ML predictions generated successfully' })
  async generateMLPredictions(
    @Request() req,
    @Query() predictionRequest: any
  ) {
    const { tenantId, userId } = req.user;
    return this.mlPipelineService.generateAdvancedPredictions(tenantId, userId, predictionRequest);
  }

  @Post('ml/optimize-routes')
  @RequirePermissions('analytics:ml_models')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Optimize routes using ML algorithms' })
  @ApiResponse({ status: 200, description: 'Route optimization completed successfully' })
  async optimizeRoutesML(
    @Request() req,
    @Body() routes: any[]
  ) {
    const { tenantId, userId } = req.user;
    return this.mlPipelineService.optimizeRoutesML(tenantId, userId, routes);
  }

  @Get('ml/demand-forecast')
  @RequirePermissions('analytics:ml_models')
  @ApiOperation({ summary: 'Generate advanced demand forecast using multiple ML models' })
  @ApiResponse({ status: 200, description: 'Demand forecast generated successfully' })
  async forecastDemandAdvanced(
    @Request() req,
    @Query('horizon') horizon?: number
  ) {
    const { tenantId, userId } = req.user;
    return this.mlPipelineService.forecastDemandAdvanced(tenantId, userId, horizon);
  }

  // Real-time Processing Endpoints
  @Post('realtime/stream')
  @RequirePermissions('analytics:realtime')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process real-time analytics stream event' })
  @ApiResponse({ status: 201, description: 'Stream event processed successfully' })
  async processStreamEvent(
    @Request() req,
    @Body() streamData: { streamType: string; eventData: any }
  ) {
    const { tenantId } = req.user;
    return this.realTimeProcessor.processAnalyticsStream(
      tenantId,
      streamData.streamType,
      streamData.eventData
    );
  }

  @Get('realtime/dashboard')
  @RequirePermissions('analytics:realtime')
  @ApiOperation({ summary: 'Get real-time analytics dashboard' })
  @ApiResponse({ status: 200, description: 'Real-time dashboard data retrieved successfully' })
  async getRealTimeDashboard(@Request() req) {
    const { tenantId } = req.user;
    return this.realTimeProcessor.getRealTimeDashboard(tenantId);
  }

  @Post('realtime/monitoring/start')
  @RequirePermissions('analytics:realtime')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start real-time monitoring for tenant' })
  @ApiResponse({ status: 201, description: 'Real-time monitoring started successfully' })
  async startRealTimeMonitoring(
    @Request() req,
    @Body() monitoringConfig: any
  ) {
    const { tenantId } = req.user;
    return this.realTimeProcessor.startRealTimeMonitoring(tenantId, monitoringConfig);
  }

  @Post('realtime/batch-process')
  @RequirePermissions('analytics:realtime')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process batch analytics updates' })
  @ApiResponse({ status: 200, description: 'Batch processing completed successfully' })
  async processBatchUpdates(
    @Request() req,
    @Body() updates: any[]
  ) {
    const { tenantId } = req.user;
    return this.realTimeProcessor.processBatchUpdates(tenantId, updates);
  }

  // API Marketplace Management Endpoints
  @Post('api-marketplace/keys')
  @RequirePermissions('analytics:api_marketplace')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate new API key for marketplace access' })
  @ApiResponse({ status: 201, description: 'API key generated successfully' })
  async generateApiKey(
    @Request() req,
    @Body() keyConfig: {
      keyName: string;
      permissions: string[];
      rateLimit?: number;
      expiresInDays?: number;
    }
  ) {
    const { tenantId } = req.user;
    return this.apiMarketplaceService.generateApiKey(
      tenantId,
      keyConfig.keyName,
      keyConfig.permissions,
      keyConfig.rateLimit,
      keyConfig.expiresInDays
    );
  }

  @Get('api-marketplace/usage')
  @RequirePermissions('analytics:api_marketplace')
  @ApiOperation({ summary: 'Get API usage analytics' })
  @ApiResponse({ status: 200, description: 'API usage analytics retrieved successfully' })
  async getApiUsageAnalytics(
    @Request() req,
    @Query('timeRange') timeRange?: string
  ) {
    const { tenantId } = req.user;
    return this.apiMarketplaceService.getApiUsageAnalytics(tenantId, timeRange);
  }

  @Put('api-marketplace/keys/:apiKey/permissions')
  @RequirePermissions('analytics:api_marketplace')
  @ApiOperation({ summary: 'Update API key permissions' })
  @ApiResponse({ status: 200, description: 'API key permissions updated successfully' })
  async updateApiKeyPermissions(
    @Request() req,
    @Param('apiKey') apiKey: string,
    @Body() permissions: { permissions: string[] }
  ) {
    const { tenantId } = req.user;
    return this.apiMarketplaceService.updateApiKeyPermissions(
      tenantId,
      apiKey,
      permissions.permissions
    );
  }

  @Delete('api-marketplace/keys/:apiKey')
  @RequirePermissions('analytics:api_marketplace')
  @ApiOperation({ summary: 'Deactivate API key' })
  @ApiResponse({ status: 200, description: 'API key deactivated successfully' })
  async deactivateApiKey(
    @Request() req,
    @Param('apiKey') apiKey: string
  ) {
    const { tenantId } = req.user;
    return this.apiMarketplaceService.deactivateApiKey(tenantId, apiKey);
  }

  @Get('api-marketplace/documentation')
  @RequirePermissions('analytics:api_marketplace')
  @ApiOperation({ summary: 'Get API marketplace documentation' })
  @ApiResponse({ status: 200, description: 'API documentation retrieved successfully' })
  async getApiDocumentation() {
    return this.apiMarketplaceService.getApiDocumentation();
  }
}

// Public API Marketplace Controller (no authentication required)
@ApiTags('Public Analytics API')
@Controller('public/analytics')
export class PublicAnalyticsController {
  constructor(
    private readonly apiMarketplaceService: ApiMarketplaceService,
  ) {}

  @Get('cost-trends')
  @ApiHeader({ name: 'X-API-Key', description: 'API Key for authentication' })
  @ApiOperation({ summary: 'Get public cost trend analytics' })
  @ApiResponse({ status: 200, description: 'Cost trends retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async getPublicCostTrends(
    @Headers('x-api-key') apiKey: string,
    @Query() filters: any
  ) {
    return this.apiMarketplaceService.getPublicAnalytics(
      apiKey,
      '/public/analytics/cost-trends',
      filters
    );
  }

  @Get('market-benchmarks')
  @ApiHeader({ name: 'X-API-Key', description: 'API Key for authentication' })
  @ApiOperation({ summary: 'Get public market benchmark data' })
  @ApiResponse({ status: 200, description: 'Market benchmarks retrieved successfully' })
  async getPublicMarketBenchmarks(
    @Headers('x-api-key') apiKey: string,
    @Query() filters: any
  ) {
    return this.apiMarketplaceService.getPublicAnalytics(
      apiKey,
      '/public/analytics/market-benchmarks',
      filters
    );
  }

  @Get('route-performance')
  @ApiHeader({ name: 'X-API-Key', description: 'API Key for authentication' })
  @ApiOperation({ summary: 'Get public route performance analytics' })
  @ApiResponse({ status: 200, description: 'Route performance retrieved successfully' })
  async getPublicRoutePerformance(
    @Headers('x-api-key') apiKey: string,
    @Query() filters: any
  ) {
    return this.apiMarketplaceService.getPublicAnalytics(
      apiKey,
      '/public/analytics/route-performance',
      filters
    );
  }

  @Get('demand-forecast')
  @ApiHeader({ name: 'X-API-Key', description: 'API Key for authentication' })
  @ApiOperation({ summary: 'Get public demand forecast data' })
  @ApiResponse({ status: 200, description: 'Demand forecast retrieved successfully' })
  async getPublicDemandForecast(
    @Headers('x-api-key') apiKey: string,
    @Query() filters: any
  ) {
    return this.apiMarketplaceService.getPublicAnalytics(
      apiKey,
      '/public/analytics/demand-forecast',
      filters
    );
  }

  @Get('documentation')
  @ApiOperation({ summary: 'Get public API documentation' })
  @ApiResponse({ status: 200, description: 'API documentation retrieved successfully' })
  async getPublicApiDocumentation() {
    return this.apiMarketplaceService.getApiDocumentation();
  }
}