import {
  IsOptional,
  IsDateString,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum AnalyticsPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export enum AnalyticsMetric {
  REVENUE = 'revenue',
  TRIPS = 'trips',
  LOADS = 'loads',
  PAYMENTS = 'payments',
  USERS = 'users',
  FLEET = 'fleet',
  MATCHING = 'matching',
  NOTIFICATIONS = 'notifications',
}

export class AnalyticsFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod;

  @IsOptional()
  @IsEnum(AnalyticsMetric)
  metric?: AnalyticsMetric;

  @IsOptional()
  @IsString()
  entityType?: string; // 'trip', 'load', 'payment', 'user', etc.

  @IsOptional()
  @IsString()
  category?: string; // For grouping analytics

  @IsOptional()
  @IsString()
  userId?: string; // For user-specific analytics

  @IsOptional()
  @IsString()
  tenantId?: string; // For tenant-specific analytics

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsString()
  groupBy?: string; // 'day', 'week', 'month', 'category', etc.

  @IsOptional()
  @IsString()
  sortBy?: string; // Field to sort by

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
