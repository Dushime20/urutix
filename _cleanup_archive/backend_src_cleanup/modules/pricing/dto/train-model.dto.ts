import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsArray,
  IsEnum,
  IsDateString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ModelType } from '../entities/pricing-model.entity';

export class HyperparametersDto {
  @ApiProperty({
    description: 'Learning rate for gradient-based models',
    example: 0.001,
    minimum: 0.0001,
    maximum: 1.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  @Max(1.0)
  learningRate?: number;

  @ApiProperty({
    description: 'Number of training epochs',
    example: 100,
    minimum: 1,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  epochs?: number;

  @ApiProperty({
    description: 'Batch size for training',
    example: 32,
    minimum: 1,
    maximum: 512,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(512)
  batchSize?: number;

  @ApiProperty({
    description: 'Number of hidden layers for neural networks',
    example: 3,
    minimum: 1,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  hiddenLayers?: number;

  @ApiProperty({
    description: 'Number of neurons per hidden layer',
    example: 64,
    minimum: 8,
    maximum: 512,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(512)
  neuronsPerLayer?: number;

  @ApiProperty({
    description: 'Dropout rate for regularization',
    example: 0.2,
    minimum: 0,
    maximum: 0.9,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.9)
  dropoutRate?: number;

  @ApiProperty({
    description: 'L2 regularization strength',
    example: 0.01,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  l2Regularization?: number;

  @ApiProperty({
    description: 'Number of trees for ensemble models',
    example: 100,
    minimum: 10,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  nEstimators?: number;

  @ApiProperty({
    description: 'Maximum depth of trees',
    example: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxDepth?: number;

  @ApiProperty({
    description: 'Minimum samples required to split a node',
    example: 5,
    minimum: 2,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(100)
  minSamplesSplit?: number;

  @ApiProperty({
    description: 'Random state for reproducibility',
    example: 42,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  randomState?: number;

  @ApiProperty({
    description: 'Early stopping patience',
    example: 10,
    minimum: 1,
    maximum: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  earlyStoppingPatience?: number;

  @ApiProperty({
    description: 'Validation split ratio',
    example: 0.2,
    minimum: 0.1,
    maximum: 0.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(0.5)
  validationSplit?: number;

  @ApiProperty({
    description: 'Cross-validation folds',
    example: 5,
    minimum: 2,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(10)
  crossValidationFolds?: number;
}

export class FeatureSelectionDto {
  @ApiProperty({
    description: 'List of features to include in training',
    example: ['distance', 'weight', 'volume', 'marketDemand', 'fuelPrice'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeFeatures?: string[];

  @ApiProperty({
    description: 'List of features to exclude from training',
    example: ['outlier_feature', 'noisy_feature'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeFeatures?: string[];

  @ApiProperty({
    description: 'Feature selection method',
    example: 'mutual_info',
    enum: ['mutual_info', 'f_regression', 'rfe', 'lasso', 'none'],
    required: false,
  })
  @IsOptional()
  @IsString()
  selectionMethod?: string;

  @ApiProperty({
    description: 'Number of features to select',
    example: 20,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  nFeatures?: number;

  @ApiProperty({
    description: 'Feature importance threshold',
    example: 0.01,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  importanceThreshold?: number;
}

export class DataRangeDto {
  @ApiProperty({
    description: 'Start date for training data',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for training data',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Minimum number of data points required',
    example: 1000,
    minimum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  minDataPoints?: number;

  @ApiProperty({
    description: 'Maximum number of data points to use',
    example: 100000,
    minimum: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1000)
  maxDataPoints?: number;
}

export class BiasMitigationDto {
  @ApiProperty({
    description: 'Enable bias detection and mitigation',
    example: true,
    required: false,
  })
  @IsOptional()
  biasDetectionEnabled?: boolean;

  @ApiProperty({
    description: 'Bias mitigation method',
    example: 'reweighing',
    enum: ['reweighing', 'adversarial_debiasing', 'prejudice_remover', 'none'],
    required: false,
  })
  @IsOptional()
  @IsString()
  mitigationMethod?: string;

  @ApiProperty({
    description: 'Sensitive attributes to check for bias',
    example: ['driver_gender', 'driver_age', 'location'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sensitiveAttributes?: string[];

  @ApiProperty({
    description: 'Bias threshold for detection',
    example: 0.1,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  biasThreshold?: number;
}

export class MonitoringConfigDto {
  @ApiProperty({
    description: 'Enable model monitoring',
    example: true,
    required: false,
  })
  @IsOptional()
  monitoringEnabled?: boolean;

  @ApiProperty({
    description: 'Data drift threshold',
    example: 0.1,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  driftThreshold?: number;

  @ApiProperty({
    description: 'Performance degradation threshold',
    example: 0.05,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  performanceThreshold?: number;

  @ApiProperty({
    description: 'Retraining threshold (days)',
    example: 30,
    minimum: 1,
    maximum: 365,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  retrainingThreshold?: number;

  @ApiProperty({
    description: 'Email addresses for alerts',
    example: ['admin@company.com', 'ml-team@company.com'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alertEmails?: string[];

  @ApiProperty({
    description: 'Webhook URLs for alerts',
    example: ['https://api.company.com/alerts'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alertWebhooks?: string[];
}

export class TrainModelDto {
  @ApiProperty({
    description: 'Model name',
    example: 'Dynamic Pricing Model v2.1',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Model description',
    example: 'Advanced dynamic pricing model with real-time market adaptation',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Model type',
    example: ModelType.GRADIENT_BOOSTING,
    enum: ModelType,
  })
  @IsEnum(ModelType)
  modelType: ModelType;

  @ApiProperty({
    description: 'Model hyperparameters',
    type: HyperparametersDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => HyperparametersDto)
  hyperparameters?: HyperparametersDto;

  @ApiProperty({
    description: 'Feature selection configuration',
    type: FeatureSelectionDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FeatureSelectionDto)
  featureSelection?: FeatureSelectionDto;

  @ApiProperty({
    description: 'Training data range',
    type: DataRangeDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DataRangeDto)
  dataRange?: DataRangeDto;

  @ApiProperty({
    description: 'Bias mitigation configuration',
    type: BiasMitigationDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BiasMitigationDto)
  biasMitigation?: BiasMitigationDto;

  @ApiProperty({
    description: 'Model monitoring configuration',
    type: MonitoringConfigDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonitoringConfigDto)
  monitoringConfig?: MonitoringConfigDto;

  @ApiProperty({
    description: 'User who initiated the training',
    example: 'ml-engineer@company.com',
  })
  @IsString()
  createdBy: string;

  @ApiProperty({
    description: 'Additional training configuration',
    example: { priority: 'high', environment: 'production' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
