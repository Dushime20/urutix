import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ValidationPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MLPricingService } from './services/ml-pricing.service';
import { CreatePricingPredictionDto } from './dto/create-pricing-prediction.dto';
import { TrainModelDto } from './dto/train-model.dto';
import {
  PricingModel,
  ModelStatus,
  ModelType,
} from './entities/pricing-model.entity';
import { PricingPrediction } from './entities/pricing-prediction.entity';

@ApiTags('Dynamic Pricing ML')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly mlPricingService: MLPricingService) { }

  @Post('predict')
  @ApiOperation({
    summary: 'Get dynamic pricing prediction',
    description:
      'Generate a dynamic pricing prediction using the active ML model for the given trip parameters',
  })
  @ApiBody({ type: CreatePricingPredictionDto })
  @ApiCreatedResponse({
    description: 'Price prediction generated successfully',
    schema: {
      type: 'object',
      properties: {
        predictedPrice: { type: 'number', example: 1250.5 },
        confidenceInterval: {
          type: 'object',
          properties: {
            lower: { type: 'number', example: 1150.25 },
            upper: { type: 'number', example: 1350.75 },
            confidence: { type: 'number', example: 0.95 },
          },
        },
        featureContributions: {
          type: 'object',
          example: { distance: 0.35, weight: 0.25, marketDemand: 0.2 },
        },
        modelVersion: { type: 'string', example: 'v2.1' },
        inferenceTime: { type: 'number', example: 45 },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async predictPrice(
    @Body(ValidationPipe) predictionDto: CreatePricingPredictionDto,
    @Request() req,
  ): Promise<{
    predictedPrice: number;
    confidenceInterval: { lower: number; upper: number; confidence: number };
    featureContributions: Record<string, number>;
    modelVersion: string;
    inferenceTime: number;
  }> {
    return this.mlPricingService.predictPrice(predictionDto, req.user.tenantId);
  }

  @Post('models/train')
  @ApiOperation({
    summary: 'Train a new pricing model',
    description:
      'Train a new ML model for dynamic pricing with specified configuration and hyperparameters',
  })
  @ApiBody({ type: TrainModelDto })
  @ApiCreatedResponse({
    description: 'Model training initiated successfully',
    schema: {
      type: 'object',
      properties: {
        modelId: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440001',
        },
        trainingMetrics: { type: 'object' },
        performanceMetrics: { type: 'object' },
        status: { type: 'string', example: 'completed' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid training configuration' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async trainModel(
    @Body(ValidationPipe) trainDto: TrainModelDto,
    @Request() req,
  ): Promise<{
    modelId: string;
    trainingMetrics: any;
    performanceMetrics: any;
    status: string;
  }> {
    return this.mlPricingService.trainModel(trainDto, req.user.tenantId);
  }

  @Get('models')
  @ApiOperation({
    summary: 'Get all pricing models',
    description:
      'Retrieve a list of all pricing models for the tenant with filtering options',
  })
  @ApiQuery({ name: 'status', enum: ModelStatus, required: false })
  @ApiQuery({ name: 'modelType', enum: ModelType, required: false })
  @ApiQuery({ name: 'page', type: Number, schema: { minimum: 1 }, required: false })
  @ApiQuery({
    name: 'limit',
    type: Number,
    schema: { minimum: 1, maximum: 100 },
    required: false,
  })
  @ApiOkResponse({
    description: 'Models retrieved successfully',
    type: [PricingModel],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getModels(
    @Request() req,
    @Query('status') status?: ModelStatus,
    @Query('modelType') modelType?: ModelType,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{
    models: PricingModel[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Implementation would be added to service
    return { models: [], total: 0, page, limit };
  }

  @Get('models/:id')
  @ApiOperation({
    summary: 'Get model by ID',
    description: 'Retrieve detailed information about a specific pricing model',
  })
  @ApiParam({ name: 'id', description: 'Model ID', type: String })
  @ApiOkResponse({
    description: 'Model details retrieved successfully',
    type: PricingModel,
  })
  @ApiNotFoundResponse({ description: 'Model not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getModel(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ model: PricingModel }> {
    const model = await this.mlPricingService.getModelById(
      id,
      req.user.tenantId,
    );
    return { model: model || null };
  }

  @Get('models/:id/performance')
  @ApiOperation({
    summary: 'Get model performance metrics',
    description:
      'Retrieve comprehensive performance metrics and monitoring data for a specific model',
  })
  @ApiParam({ name: 'id', description: 'Model ID', type: String })
  @ApiOkResponse({
    description: 'Performance metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        modelId: { type: 'string' },
        modelVersion: { type: 'string' },
        performanceMetrics: { type: 'object' },
        recentPerformance: { type: 'object' },
        driftMetrics: { type: 'object' },
        biasDrift: { type: 'object' },
        totalInferences: { type: 'number' },
        averageInferenceTime: { type: 'number' },
        lastTrainingDate: { type: 'string', format: 'date-time' },
        nextRetrainingDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Model not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getModelPerformance(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<any> {
    return this.mlPricingService.getModelPerformance(id, req.user.tenantId);
  }

  @Post('models/:id/retrain')
  @ApiOperation({
    summary: 'Retrain model',
    description:
      'Retrain an existing model with new data and compare performance',
  })
  @ApiParam({ name: 'id', description: 'Model ID', type: String })
  @ApiOkResponse({
    description: 'Model retraining completed',
    schema: {
      type: 'object',
      properties: {
        newModelId: { type: 'string' },
        performance: { type: 'object' },
        status: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Model not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async retrainModel(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{
    newModelId: string;
    performance: any;
    status: string;
  }> {
    return this.mlPricingService.retrainModel(id, req.user.tenantId);
  }

  @Get('predictions/:id/explain')
  @ApiOperation({
    summary: 'Explain prediction',
    description:
      'Generate detailed explanation for a specific prediction including feature contributions and SHAP values',
  })
  @ApiParam({ name: 'id', description: 'Prediction ID', type: String })
  @ApiOkResponse({
    description: 'Prediction explanation generated successfully',
    schema: {
      type: 'object',
      properties: {
        prediction: { type: 'object' },
        featureContributions: { type: 'object' },
        shapValues: { type: 'object' },
        limeExplanation: { type: 'object' },
        globalFeatureImportance: { type: 'object' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Prediction not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async explainPrediction(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{
    prediction: any;
    featureContributions: Record<string, number>;
    shapValues: Record<string, number>;
    limeExplanation: any;
    globalFeatureImportance: Record<string, number>;
  }> {
    return this.mlPricingService.explainPrediction(id, req.user.tenantId);
  }

  @Get('models/:id/bias')
  @ApiOperation({
    summary: 'Detect model bias',
    description:
      'Analyze model predictions for potential bias across different demographic and geographic dimensions',
  })
  @ApiParam({ name: 'id', description: 'Model ID', type: String })
  @ApiOkResponse({
    description: 'Bias analysis completed successfully',
    schema: {
      type: 'object',
      properties: {
        biasMetrics: { type: 'object' },
        biasDetected: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Model not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async detectBias(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{
    biasMetrics: any;
    biasDetected: boolean;
    recommendations: string[];
  }> {
    return this.mlPricingService.detectBias(id, req.user.tenantId);
  }

  @Post('models/:id/ab-test')
  @ApiOperation({
    summary: 'Setup A/B test',
    description:
      'Configure A/B testing for comparing model performance with traffic splitting',
  })
  @ApiParam({ name: 'id', description: 'Model ID', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        treatmentModelId: { type: 'string', format: 'uuid' },
        trafficSplit: { type: 'number', minimum: 0, maximum: 1 },
        testEndDate: { type: 'string', format: 'date-time' },
        successMetrics: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiOkResponse({
    description: 'A/B test configured successfully',
    schema: {
      type: 'object',
      properties: {
        testId: { type: 'string' },
        controlGroup: { type: 'string' },
        treatmentGroup: { type: 'string' },
        trafficSplit: { type: 'number' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Model not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async setupABTest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() abTestConfig: any,
    @Request() req,
  ): Promise<{
    testId: string;
    controlGroup: string;
    treatmentGroup: string;
    trafficSplit: number;
  }> {
    return this.mlPricingService.setupABTest(
      id,
      abTestConfig,
      req.user.tenantId,
    );
  }

  @Get('predictions')
  @ApiOperation({
    summary: 'Get prediction history',
    description:
      'Retrieve historical predictions with filtering and pagination',
  })
  @ApiQuery({ name: 'modelId', type: String, required: false })
  @ApiQuery({
    name: 'status',
    enum: ['pending', 'processed', 'failed', 'validated', 'rejected'],
    required: false,
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
  })
  @ApiQuery({ name: 'page', type: Number, schema: { minimum: 1 }, required: false })
  @ApiQuery({
    name: 'limit',
    type: Number,
    schema: { minimum: 1, maximum: 100 },
    required: false,
  })
  @ApiOkResponse({
    description: 'Predictions retrieved successfully',
    type: [PricingPrediction],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getPredictions(
    @Request() req,
    @Query('modelId') modelId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<{
    predictions: PricingPrediction[];
    total: number;
    page: number;
    limit: number;
  }> {
    // Implementation would be added to service
    return { predictions: [], total: 0, page, limit };
  }

  @Get('analytics/performance')
  @ApiOperation({
    summary: 'Get performance analytics',
    description:
      'Retrieve comprehensive analytics on model performance, predictions, and business impact',
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
  })
  @ApiQuery({ name: 'modelId', type: String, required: false })
  @ApiOkResponse({
    description: 'Analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalPredictions: { type: 'number' },
        averageAccuracy: { type: 'number' },
        totalRevenue: { type: 'number' },
        revenueIncrease: { type: 'number' },
        modelPerformance: { type: 'object' },
        featureImportance: { type: 'object' },
        predictionDistribution: { type: 'object' },
        timeSeriesData: { type: 'array' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getPerformanceAnalytics(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('modelId') modelId?: string,
  ): Promise<any> {
    // Implementation would be added to service
    return {
      totalPredictions: 0,
      averageAccuracy: 0,
      totalRevenue: 0,
      revenueIncrease: 0,
      modelPerformance: {},
      featureImportance: {},
      predictionDistribution: {},
      timeSeriesData: [],
    };
  }

  @Get('analytics/drift')
  @ApiOperation({
    summary: 'Get data drift analytics',
    description:
      'Analyze data drift patterns and provide recommendations for model maintenance',
  })
  @ApiQuery({ name: 'modelId', type: String, required: false })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
  })
  @ApiOkResponse({
    description: 'Drift analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overallDrift: { type: 'number' },
        featureDrift: { type: 'object' },
        conceptDrift: { type: 'number' },
        dataDrift: { type: 'number' },
        affectedFeatures: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        timeSeriesDrift: { type: 'array' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getDriftAnalytics(
    @Request() req,
    @Query('modelId') modelId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    // Implementation would be added to service
    return {
      overallDrift: 0,
      featureDrift: {},
      conceptDrift: 0,
      dataDrift: 0,
      affectedFeatures: [],
      recommendations: [],
      timeSeriesDrift: [],
    };
  }

  @Get('analytics/bias')
  @ApiOperation({
    summary: 'Get bias analytics',
    description:
      'Analyze model bias across different dimensions and provide mitigation recommendations',
  })
  @ApiQuery({ name: 'modelId', type: String, required: false })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
  })
  @ApiOkResponse({
    description: 'Bias analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overallBias: { type: 'number' },
        demographicBias: { type: 'object' },
        geographicBias: { type: 'object' },
        temporalBias: { type: 'object' },
        biasTrends: { type: 'array' },
        mitigationStrategies: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getBiasAnalytics(
    @Request() req,
    @Query('modelId') modelId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    // Implementation would be added to service
    return {
      overallBias: 0,
      demographicBias: {},
      geographicBias: {},
      temporalBias: {},
      biasTrends: [],
      mitigationStrategies: [],
    };
  }

  @Delete('models/:id')
  @ApiOperation({
    summary: 'Delete model',
    description: 'Delete a pricing model (only inactive models can be deleted)',
  })
  @ApiParam({ name: 'id', description: 'Model ID', type: String })
  @ApiOkResponse({ description: 'Model deleted successfully' })
  @ApiBadRequestResponse({ description: 'Cannot delete active model' })
  @ApiNotFoundResponse({ description: 'Model not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async deleteModel(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    // Implementation would be added to service
    return { message: 'Model deleted successfully' };
  }
}
