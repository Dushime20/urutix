import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum InsightTypeFilter {
  ALL = 'all',
  COST_OPTIMIZATION = 'cost_optimization',
  CARRIER_RECOMMENDATION = 'carrier_recommendation',
  ROUTE_ANALYSIS = 'route_analysis',
  DEMAND_PREDICTION = 'demand_prediction',
  RISK_ALERT = 'risk_alert',
  PERFORMANCE_IMPROVEMENT = 'performance_improvement',
  MARKET_OPPORTUNITY = 'market_opportunity',
}

export enum InsightStatusFilter {
  ALL = 'all',
  ACTIVE = 'active',
  DISMISSED = 'dismissed',
  IMPLEMENTED = 'implemented',
  EXPIRED = 'expired',
}

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder, description: 'Sort order', default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}

export class BaseAnalyticsFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Start date for filtering (ISO format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (ISO format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search term for text-based filtering' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by cargo type' })
  @IsOptional()
  @IsString()
  cargoType?: string;

  @ApiPropertyOptional({ description: 'Filter by origin city' })
  @IsOptional()
  @IsString()
  originCity?: string;

  @ApiPropertyOptional({ description: 'Filter by destination city' })
  @IsOptional()
  @IsString()
  destinationCity?: string;

  @ApiPropertyOptional({ description: 'Filter by carrier ID' })
  @IsOptional()
  @IsString()
  carrierId?: string;

  @ApiPropertyOptional({ description: 'Filter by season' })
  @IsOptional()
  @IsString()
  season?: string;
}

export class InsightsFiltersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: InsightTypeFilter, description: 'Filter by insight type' })
  @IsOptional()
  @IsEnum(InsightTypeFilter)
  insightType?: InsightTypeFilter;

  @ApiPropertyOptional({ enum: InsightStatusFilter, description: 'Filter by insight status' })
  @IsOptional()
  @IsEnum(InsightStatusFilter)
  status?: InsightStatusFilter;

  @ApiPropertyOptional({ description: 'Minimum confidence score (0-1)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minConfidence?: number;

  @ApiPropertyOptional({ description: 'Include only insights with potential cost savings' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  withCostSavings?: boolean;

  @ApiPropertyOptional({ description: 'Include only insights expiring soon (within 7 days)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  expiringSoon?: boolean;
}

export class PerformanceFiltersDto extends BaseAnalyticsFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by on-time delivery status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  onTimeDelivery?: boolean;

  @ApiPropertyOptional({ description: 'Filter by damage reported status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  damageReported?: boolean;

  @ApiPropertyOptional({ description: 'Minimum performance score (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minPerformanceScore?: number;

  @ApiPropertyOptional({ description: 'Maximum delay hours' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDelayHours?: number;
}

export class RouteAnalyticsFiltersDto extends BaseAnalyticsFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by route hash' })
  @IsOptional()
  @IsString()
  routeHash?: string;

  @ApiPropertyOptional({ description: 'Minimum distance in km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minDistance?: number;

  @ApiPropertyOptional({ description: 'Maximum distance in km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDistance?: number;

  @ApiPropertyOptional({ description: 'Minimum shipment count for route' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minShipmentCount?: number;
}

export class ExportOptionsDto {
  @ApiProperty({ description: 'Export format', enum: ['csv', 'xlsx', 'pdf'] })
  @IsEnum(['csv', 'xlsx', 'pdf'])
  format: 'csv' | 'xlsx' | 'pdf';

  @ApiPropertyOptional({ description: 'Include detailed breakdown' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeDetails?: boolean;

  @ApiPropertyOptional({ description: 'Include charts and visualizations (PDF only)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeCharts?: boolean;

  @ApiPropertyOptional({ description: 'Custom filename (without extension)' })
  @IsOptional()
  @IsString()
  filename?: string;
}

export class BenchmarkFiltersDto {
  @ApiPropertyOptional({ description: 'Industry sector for comparison' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ description: 'Geographic region for comparison' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Company size category for comparison' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ description: 'Include only anonymized data' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  anonymizedOnly?: boolean = true;
}

export class AlertPreferencesDto {
  @ApiProperty({ description: 'Enable cost threshold alerts' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  costAlerts: boolean;

  @ApiProperty({ description: 'Cost threshold amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costThreshold?: number;

  @ApiProperty({ description: 'Enable performance alerts' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  performanceAlerts: boolean;

  @ApiProperty({ description: 'Enable carrier recommendation alerts' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  carrierAlerts: boolean;

  @ApiProperty({ description: 'Enable route optimization alerts' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  routeAlerts: boolean;

  @ApiProperty({ description: 'Alert frequency in hours' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(168) // Max once per week
  alertFrequency: number;

  @ApiProperty({ description: 'Email notifications enabled' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  emailNotifications: boolean;

  @ApiProperty({ description: 'In-app notifications enabled' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  inAppNotifications: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of data items' })
  data: T[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiProperty({ description: 'Applied filters' })
  filters: Record<string, any>;

  @ApiProperty({ description: 'Sort information' })
  sort: {
    field: string;
    order: SortOrder;
  };
}

export class AnalyticsMetricsDto {
  @ApiProperty({ description: 'Total number of shipments analyzed' })
  totalShipments: number;

  @ApiProperty({ description: 'Date range of analysis' })
  dateRange: {
    start: string;
    end: string;
  };

  @ApiProperty({ description: 'Data freshness timestamp' })
  lastUpdated: string;

  @ApiProperty({ description: 'Analysis completion percentage' })
  completeness: number;

  @ApiProperty({ description: 'Data quality score (0-100)' })
  dataQuality: number;
}