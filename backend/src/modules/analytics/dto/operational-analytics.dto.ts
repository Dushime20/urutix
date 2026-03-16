import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

// Enums for operational analytics
export enum RecommendationLevel {
  PREFERRED = 'preferred',
  ACCEPTABLE = 'acceptable',
  AVOID = 'avoid',
  INSUFFICIENT_DATA = 'insufficient_data',
}

export enum RouteSpecialization {
  EXPERT = 'expert',
  EXPERIENCED = 'experienced',
  FAMILIAR = 'familiar',
  NEW = 'new',
}

export enum MarketPosition {
  COMPETITIVE_ADVANTAGE = 'competitive_advantage',
  MIXED_PERFORMANCE = 'mixed_performance',
  IMPROVEMENT_NEEDED = 'improvement_needed',
}

// Request DTOs
export class OperationalFiltersDto {
  @ApiPropertyOptional({ description: 'Start date for analysis period' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for analysis period' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by cargo type' })
  @IsOptional()
  @IsString()
  cargoType?: string;

  @ApiPropertyOptional({ description: 'Filter by specific route hash' })
  @IsOptional()
  @IsString()
  routeHash?: string;

  @ApiPropertyOptional({ description: 'Filter by carrier ID' })
  @IsOptional()
  @IsString()
  carrierId?: string;

  @ApiPropertyOptional({ description: 'Minimum reliability score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseFloat(value))
  minReliabilityScore?: number;
}

export class MarketTrendsFiltersDto {
  @ApiPropertyOptional({ description: 'Route hash for specific route analysis' })
  @IsOptional()
  @IsString()
  routeHash?: string;

  @ApiPropertyOptional({ description: 'Cargo type for market analysis' })
  @IsOptional()
  @IsString()
  cargoType?: string;

  @ApiPropertyOptional({ 
    description: 'Timeframe for trend analysis',
    enum: ['monthly', 'quarterly'],
    default: 'monthly'
  })
  @IsOptional()
  @IsEnum(['monthly', 'quarterly'])
  timeframe?: 'monthly' | 'quarterly';
}

// Response DTOs
export class PerformanceMetricsDto {
  @ApiProperty({ description: 'Total number of shipments in period' })
  totalShipments: number;

  @ApiProperty({ description: 'On-time delivery rate (percentage)' })
  onTimeRate: number;

  @ApiProperty({ description: 'Damage incident rate (percentage)' })
  damageRate: number;

  @ApiProperty({ description: 'Average transit time in hours' })
  averageTransitTime: number;

  @ApiProperty({ description: 'Average cost per kilometer' })
  averageCostPerKm: number;

  @ApiProperty({ description: 'Number of active carriers used' })
  activeCarriers: number;

  @ApiProperty({ description: 'Number of active routes' })
  activeRoutes: number;

  @ApiProperty({ description: 'Overall efficiency score (0-100)' })
  efficiencyScore: number;
}

export class RoutePerformanceDto {
  @ApiProperty({ description: 'Route hash identifier' })
  routeHash: string;

  @ApiProperty({ description: 'Human-readable route description' })
  route: string;

  @ApiProperty({ description: 'Average cost for this route' })
  averageCost: number;

  @ApiProperty({ description: 'Average transit time in hours' })
  averageTransitTime: number;

  @ApiProperty({ description: 'Number of shipments on this route' })
  shipmentCount: number;

  @ApiProperty({ description: 'On-time delivery rate for this route' })
  onTimeRate: number;

  @ApiProperty({ description: 'Distance in kilometers' })
  distanceKm?: number;

  @ApiProperty({ description: 'Profitability score (0-100)' })
  profitabilityScore?: number;
}

export class CarrierPerformanceDto {
  @ApiProperty({ description: 'Carrier identifier' })
  carrierId: string;

  @ApiProperty({ description: 'Total shipments with this carrier' })
  totalShipments: number;

  @ApiProperty({ description: 'On-time delivery rate (percentage)' })
  onTimeRate: number;

  @ApiProperty({ description: 'Damage incident rate (percentage)' })
  damageRate: number;

  @ApiProperty({ description: 'Average cost for shipments' })
  averageCost: number;

  @ApiProperty({ description: 'Average cost per kilometer' })
  averageCostPerKm: number;

  @ApiProperty({ description: 'Average carrier rating (1-5)' })
  averageRating: number;

  @ApiProperty({ description: 'Calculated reliability score (0-100)' })
  reliabilityScore: number;

  @ApiProperty({ 
    description: 'Recommendation level for this carrier',
    enum: RecommendationLevel
  })
  recommendation: RecommendationLevel;

  @ApiProperty({ description: 'Relationship duration in days' })
  relationshipDuration: number;
}

export class CarrierScorecardDto {
  @ApiProperty({ description: 'Carrier identifier' })
  carrierId: string;

  @ApiProperty({ description: 'Total shipments handled' })
  totalShipments: number;

  @ApiProperty({ description: 'On-time delivery rate (percentage)' })
  onTimeRate: number;

  @ApiProperty({ description: 'Average carrier rating (1-5)' })
  averageRating: number;

  @ApiProperty({ description: 'Average cost per shipment' })
  averageCost: number;

  @ApiProperty({ 
    description: 'Overall recommendation',
    enum: RecommendationLevel
  })
  recommendation: RecommendationLevel;
}

export class CarrierRouteRecommendationDto {
  @ApiProperty({ description: 'Carrier identifier' })
  carrierId: string;

  @ApiProperty({ description: 'Number of shipments on this route' })
  routeExperience: number;

  @ApiProperty({ description: 'On-time rate for this specific route' })
  routeOnTimeRate: number;

  @ApiProperty({ description: 'Average cost for this route' })
  routeAverageCost: number;

  @ApiProperty({ description: 'Average transit time for this route' })
  routeAverageTransitTime: number;

  @ApiProperty({ 
    description: 'Route specialization level',
    enum: RouteSpecialization
  })
  routeSpecialization: RouteSpecialization;
}

export class MarketBenchmarksDto {
  @ApiProperty({ description: 'Market average cost' })
  averageCost: number;

  @ApiProperty({ description: 'Market average cost per kilometer' })
  averageCostPerKm: number;

  @ApiProperty({ description: 'Market average transit time' })
  averageTransitTime: number;

  @ApiProperty({ description: 'Market on-time delivery rate' })
  onTimeRate: number;

  @ApiProperty({ description: 'Cost range (25th to 75th percentile)' })
  costRange: {
    p25: number;
    p75: number;
  };
}

export class UserPerformanceDto {
  @ApiProperty({ description: 'User average cost' })
  averageCost: number;

  @ApiProperty({ description: 'User average cost per kilometer' })
  averageCostPerKm: number;

  @ApiProperty({ description: 'User average transit time' })
  averageTransitTime: number;

  @ApiProperty({ description: 'User on-time delivery rate' })
  onTimeRate: number;

  @ApiProperty({ description: 'Total shipments in analysis period' })
  totalShipments: number;
}

export class IndustryBenchmarksResponseDto {
  @ApiProperty({ description: 'Market-wide benchmarks (anonymized)' })
  marketBenchmarks: MarketBenchmarksDto;

  @ApiProperty({ description: 'User performance metrics' })
  userPerformance: UserPerformanceDto;

  @ApiProperty({ description: 'Performance comparison with market' })
  comparison: {
    costComparison: number; // Percentage difference
    transitTimeComparison: number;
    onTimeRateComparison: number;
  };
}

export class MarketTrendDto {
  @ApiProperty({ description: 'Time period for this data point' })
  period: string;

  @ApiProperty({ description: 'Average cost in this period' })
  averageCost: number;

  @ApiProperty({ description: 'Average cost per kilometer' })
  averageCostPerKm: number;

  @ApiProperty({ description: 'Number of shipments in period' })
  shipmentCount: number;

  @ApiProperty({ description: 'Average transit time' })
  averageTransitTime: number;

  @ApiProperty({ 
    description: 'Trend direction',
    enum: ['increasing', 'decreasing', 'stable']
  })
  trend: 'increasing' | 'decreasing' | 'stable';
}

export class CompetitivePositioningDto {
  @ApiProperty({ description: 'User performance metrics' })
  userMetrics: UserPerformanceDto;

  @ApiProperty({ description: 'Market benchmark metrics' })
  marketBenchmarks: MarketBenchmarksDto;

  @ApiProperty({ description: 'Competitive positioning analysis' })
  positioning: {
    cost: 'below_market' | 'above_market';
    speed: 'faster' | 'slower';
    reliability: 'above_market' | 'below_market';
    overall: MarketPosition;
  };

  @ApiProperty({ description: 'Actionable recommendations' })
  recommendations: string[];
}