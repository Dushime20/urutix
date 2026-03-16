import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

// Enums for AI insights
export enum InsightType {
  COST_FORECAST = 'cost_forecast',
  DEMAND_PREDICTION = 'demand_prediction',
  RISK_ALERT = 'risk_alert',
  OPTIMIZATION_OPPORTUNITY = 'optimization_opportunity',
}

export enum RecommendationType {
  COST_OPTIMIZATION = 'cost_optimization',
  CARRIER_SELECTION = 'carrier_selection',
  ROUTE_PLANNING = 'route_planning',
  RISK_MITIGATION = 'risk_mitigation',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum PredictionTrend {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
}

// Request DTOs
export class AIInsightsFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by insight type' })
  @IsOptional()
  @IsEnum(InsightType)
  insightType?: InsightType;

  @ApiPropertyOptional({ description: 'Minimum confidence score (0-1)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  minConfidence?: number;

  @ApiPropertyOptional({ description: 'Number of days ahead for predictions' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Transform(({ value }) => parseInt(value))
  daysAhead?: number;

  @ApiPropertyOptional({ description: 'Filter by route hash' })
  @IsOptional()
  @IsString()
  routeHash?: string;

  @ApiPropertyOptional({ description: 'Filter by cargo type' })
  @IsOptional()
  @IsString()
  cargoType?: string;

  @ApiPropertyOptional({ description: 'Filter by carrier ID' })
  @IsOptional()
  @IsString()
  carrierId?: string;
}

export class PredictionRequestDto {
  @ApiPropertyOptional({ description: 'Route hash for route-specific predictions' })
  @IsOptional()
  @IsString()
  routeHash?: string;

  @ApiProperty({ description: 'Number of days ahead to predict', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  @Transform(({ value }) => parseInt(value))
  daysAhead?: number = 30;

  @ApiPropertyOptional({ description: 'Cargo type for type-specific predictions' })
  @IsOptional()
  @IsString()
  cargoType?: string;
}

// Response DTOs
export class PredictiveInsightDto {
  @ApiProperty({ description: 'Unique insight identifier' })
  id: string;

  @ApiProperty({ description: 'Type of insight', enum: InsightType })
  insightType: InsightType;

  @ApiProperty({ description: 'Target entity type' })
  targetEntity: string;

  @ApiProperty({ description: 'Target entity ID' })
  targetId: string;

  @ApiProperty({ description: 'Prediction horizon in days' })
  predictionHorizon: number;

  @ApiProperty({ description: 'Predicted value' })
  predictedValue: number;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  confidenceScore: number;

  @ApiProperty({ description: 'Confidence interval' })
  confidenceInterval: {
    lower: number;
    upper: number;
  };

  @ApiProperty({ description: 'Model version used' })
  modelVersion: string;

  @ApiProperty({ description: 'Baseline value for comparison' })
  baselineValue: number;

  @ApiProperty({ description: 'Percentage change from baseline' })
  predictionChange: number;

  @ApiProperty({ description: 'Prediction validity date' })
  validUntil: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;
}

export class AIRecommendationDto {
  @ApiProperty({ description: 'Unique recommendation identifier' })
  id: string;

  @ApiProperty({ description: 'Type of recommendation', enum: RecommendationType })
  recommendationType: RecommendationType;

  @ApiProperty({ description: 'Recommendation title' })
  title: string;

  @ApiProperty({ description: 'Detailed description' })
  description: string;

  @ApiProperty({ description: 'Priority level' })
  priority: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({ description: 'AI confidence in recommendation (0-1)' })
  aiConfidence: number;

  @ApiProperty({ description: 'AI-generated reasoning' })
  reasoning: string;

  @ApiProperty({ description: 'Potential cost savings' })
  potentialSavings: number;

  @ApiProperty({ description: 'Potential time savings in hours' })
  potentialTimeSavings: number;

  @ApiProperty({ description: 'Risk reduction score (0-1)' })
  riskReductionScore: number;

  @ApiProperty({ description: 'Implementation effort level' })
  implementationEffort: 'low' | 'medium' | 'high';

  @ApiProperty({ description: 'Actionable steps' })
  actionItems: Array<{
    action: string;
    priority: number;
    effort: string;
    timeline: string;
  }>;

  @ApiProperty({ description: 'Estimated implementation timeline' })
  estimatedTimeline: string;

  @ApiProperty({ description: 'Success metrics' })
  successMetrics: Record<string, any>;

  @ApiProperty({ description: 'Current status' })
  status: 'pending' | 'accepted' | 'rejected' | 'implemented' | 'expired';

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Expiration timestamp' })
  expiresAt: string;
}

export class CostPredictionDto {
  @ApiProperty({ description: 'Predicted cost value' })
  prediction: number;

  @ApiProperty({ description: 'Prediction confidence (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Trend direction', enum: PredictionTrend })
  trend: PredictionTrend;

  @ApiProperty({ description: 'Baseline cost for comparison' })
  baseline: number;

  @ApiProperty({ description: 'Percentage change from baseline' })
  changePercentage: number;

  @ApiProperty({ description: 'Prediction horizon in days' })
  horizonDays: number;

  @ApiProperty({ description: 'Factors influencing the prediction' })
  influencingFactors: string[];
}

export class CarrierPredictionDto {
  @ApiProperty({ description: 'Carrier identifier' })
  carrierId: string;

  @ApiProperty({ description: 'Predicted on-time delivery rate' })
  predictedOnTimeRate: number;

  @ApiProperty({ description: 'Predicted average rating' })
  predictedRating: number;

  @ApiProperty({ description: 'Predicted average cost' })
  predictedCost: number;

  @ApiProperty({ description: 'Prediction confidence (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Performance trend' })
  trend: 'improving' | 'declining' | 'stable';

  @ApiProperty({ description: 'Recommendation level' })
  recommendation: 'highly_recommended' | 'recommended' | 'acceptable_with_monitoring' | 'consider_alternatives';

  @ApiProperty({ description: 'Risk factors' })
  riskFactors: string[];
}

export class RouteOptimizationDto {
  @ApiProperty({ description: 'Route identifier' })
  routeHash: string;

  @ApiProperty({ description: 'Human-readable route description' })
  route: string;

  @ApiProperty({ description: 'Optimization type' })
  type: 'cost_optimization' | 'performance_optimization' | 'risk_reduction';

  @ApiProperty({ description: 'Identified issue' })
  issue: string;

  @ApiProperty({ description: 'Current performance metric' })
  currentValue: number;

  @ApiProperty({ description: 'Target performance metric' })
  targetValue: number;

  @ApiProperty({ description: 'Potential improvement' })
  potentialImprovement: number;

  @ApiProperty({ description: 'Confidence in optimization (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Optimization recommendations' })
  recommendations: string[];

  @ApiProperty({ description: 'Implementation complexity' })
  complexity: 'low' | 'medium' | 'high';
}

export class RiskAlertDto {
  @ApiProperty({ description: 'Alert type' })
  type: 'cost_spike' | 'performance_drop' | 'anomaly_detected' | 'threshold_breach';

  @ApiProperty({ description: 'Alert severity', enum: AlertSeverity })
  severity: AlertSeverity;

  @ApiProperty({ description: 'Alert message' })
  message: string;

  @ApiProperty({ description: 'Threshold value that triggered alert' })
  threshold: number;

  @ApiProperty({ description: 'Current value that triggered alert' })
  currentValue: number;

  @ApiProperty({ description: 'Confidence in alert (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Affected entities' })
  affectedEntities: string[];

  @ApiProperty({ description: 'Recommended actions' })
  recommendedActions: string[];

  @ApiProperty({ description: 'Alert timestamp' })
  timestamp: string;
}

export class ComprehensiveInsightsDto {
  @ApiProperty({ description: 'Cost predictions' })
  costPredictions: CostPredictionDto;

  @ApiProperty({ description: 'Route optimizations' })
  routeOptimizations: RouteOptimizationDto[];

  @ApiProperty({ description: 'Demand forecasts' })
  demandForecasts: any;

  @ApiProperty({ description: 'Risk alerts' })
  riskAlerts: RiskAlertDto[];

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: string;

  @ApiProperty({ description: 'Insights summary' })
  summary: {
    totalInsights: number;
    highPriorityAlerts: number;
    potentialSavings: number;
    keyRecommendations: string[];
  };
}

export class AIDashboardSummaryDto {
  @ApiProperty({ description: 'Summary of all insights' })
  summary: {
    totalInsights: number;
    highPriorityAlerts: number;
    potentialSavings: number;
    keyRecommendations: string[];
  };

  @ApiProperty({ description: 'Latest cost prediction' })
  latestPrediction: CostPredictionDto;

  @ApiProperty({ description: 'Number of active high-severity alerts' })
  activeAlerts: number;

  @ApiProperty({ description: 'Total insights generated' })
  totalInsights: number;

  @ApiProperty({ description: 'Dashboard generation timestamp' })
  generatedAt: string;
}