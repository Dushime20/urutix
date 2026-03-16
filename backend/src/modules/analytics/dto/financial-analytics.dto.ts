import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TimeRange {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_6_MONTHS = 'last_6_months',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

export enum GroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export class DateRangeDto {
  @ApiProperty({ description: 'Start date in ISO format' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date in ISO format' })
  @IsDateString()
  endDate: string;
}

export class CostFiltersDto {
  @ApiPropertyOptional({ enum: TimeRange, description: 'Predefined time range' })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @ApiPropertyOptional({ type: DateRangeDto, description: 'Custom date range (required if timeRange is CUSTOM)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @ApiPropertyOptional({ enum: GroupBy, description: 'Group results by time period' })
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy;

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

  @ApiPropertyOptional({ description: 'Minimum cost threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minCost?: number;

  @ApiPropertyOptional({ description: 'Maximum cost threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCost?: number;
}

export class ProfitabilityFiltersDto extends CostFiltersDto {
  @ApiPropertyOptional({ description: 'Minimum profit margin percentage' })
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(1000)
  minProfitMargin?: number;

  @ApiPropertyOptional({ description: 'Maximum profit margin percentage' })
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(1000)
  maxProfitMargin?: number;

  @ApiPropertyOptional({ description: 'Include only profitable shipments' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  profitableOnly?: boolean;
}

export class CostTrendDataPoint {
  @ApiProperty({ description: 'Date of the data point' })
  date: string;

  @ApiProperty({ description: 'Total cost for the period' })
  totalCost: number;

  @ApiProperty({ description: 'Average cost per shipment' })
  averageCost: number;

  @ApiProperty({ description: 'Number of shipments' })
  shipmentCount: number;

  @ApiProperty({ description: 'Cost per kilometer' })
  costPerKm: number;

  @ApiProperty({ description: 'Cost per kilogram' })
  costPerKg: number;
}

export class CostTrendsResponseDto {
  @ApiProperty({ type: [CostTrendDataPoint], description: 'Cost trend data points' })
  trends: CostTrendDataPoint[];

  @ApiProperty({ description: 'Total cost for the entire period' })
  totalCost: number;

  @ApiProperty({ description: 'Average cost per shipment' })
  averageCostPerShipment: number;

  @ApiProperty({ description: 'Total number of shipments' })
  totalShipments: number;

  @ApiProperty({ description: 'Cost change percentage from previous period' })
  costChangePercentage: number;

  @ApiProperty({ description: 'Period comparison label' })
  comparisonPeriod: string;
}

export class ShipmentProfitabilityDto {
  @ApiProperty({ description: 'Load ID' })
  loadId: string;

  @ApiProperty({ description: 'Route description' })
  route: string;

  @ApiProperty({ description: 'Total cost' })
  totalCost: number;

  @ApiProperty({ description: 'Revenue (if available)' })
  revenue?: number;

  @ApiProperty({ description: 'Profit margin percentage' })
  profitMargin: number;

  @ApiProperty({ description: 'Cargo weight in kg' })
  cargoWeightKg: number;

  @ApiProperty({ description: 'Cost per kg' })
  costPerKg: number;

  @ApiProperty({ description: 'Distance in km' })
  distanceKm?: number;

  @ApiProperty({ description: 'Cost per km' })
  costPerKm?: number;

  @ApiProperty({ description: 'Booking date' })
  bookingDate: Date;

  @ApiProperty({ description: 'Delivery status' })
  deliveryStatus: string;
}

export class ProfitabilityAnalysisResponseDto {
  @ApiProperty({ type: [ShipmentProfitabilityDto], description: 'Shipment profitability data' })
  shipments: ShipmentProfitabilityDto[];

  @ApiProperty({ description: 'Average profit margin' })
  averageProfitMargin: number;

  @ApiProperty({ description: 'Most profitable route' })
  mostProfitableRoute?: string;

  @ApiProperty({ description: 'Least profitable route' })
  leastProfitableRoute?: string;

  @ApiProperty({ description: 'Total profitable shipments' })
  profitableShipments: number;

  @ApiProperty({ description: 'Total unprofitable shipments' })
  unprofitableShipments: number;

  @ApiProperty({ description: 'Profitability trend (improving/declining/stable)' })
  trend: string;
}

export class RouteSpecDto {
  @ApiProperty({ description: 'Origin city' })
  @IsString()
  originCity: string;

  @ApiProperty({ description: 'Destination city' })
  @IsString()
  destinationCity: string;

  @ApiProperty({ description: 'Cargo weight in kg' })
  @IsNumber()
  @Min(0.1)
  weight: number;

  @ApiPropertyOptional({ description: 'Cargo type' })
  @IsOptional()
  @IsString()
  cargoType?: string;

  @ApiPropertyOptional({ description: 'Distance in km' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  distance?: number;
}

export class PricingRecommendationDto {
  @ApiProperty({ description: 'Current market price' })
  currentPrice: number;

  @ApiProperty({ description: 'Recommended price' })
  recommendedPrice: number;

  @ApiProperty({ description: 'Potential savings' })
  potentialSavings: number;

  @ApiProperty({ description: 'Confidence score (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Recommendation reasoning' })
  reasoning: string;

  @ApiProperty({ description: 'Alternative carriers or routes' })
  alternatives: Array<{
    option: string;
    price: number;
    savings: number;
    tradeoffs: string[];
  }>;

  @ApiProperty({ description: 'Market factors affecting pricing' })
  marketFactors: string[];
}

export class CostBreakdownDto {
  @ApiProperty({ description: 'Base transportation cost' })
  baseCost: number;

  @ApiProperty({ description: 'Fuel surcharge' })
  fuelSurcharge?: number;

  @ApiProperty({ description: 'Additional fees' })
  additionalFees?: number;

  @ApiProperty({ description: 'Insurance cost' })
  insurance?: number;

  @ApiProperty({ description: 'Taxes and duties' })
  taxes?: number;

  @ApiProperty({ description: 'Total cost' })
  totalCost: number;

  @ApiProperty({ description: 'Cost breakdown by category' })
  breakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export class FinancialSummaryDto {
  @ApiProperty({ description: 'Total spending in the period' })
  totalSpending: number;

  @ApiProperty({ description: 'Average cost per shipment' })
  averageCostPerShipment: number;

  @ApiProperty({ description: 'Cost per kg average' })
  averageCostPerKg: number;

  @ApiProperty({ description: 'Cost per km average' })
  averageCostPerKm: number;

  @ApiProperty({ description: 'Spending change from previous period' })
  spendingChange: {
    amount: number;
    percentage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };

  @ApiProperty({ description: 'Top spending categories' })
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Cost efficiency metrics' })
  efficiency: {
    costPerKgTrend: 'improving' | 'declining' | 'stable';
    costPerKmTrend: 'improving' | 'declining' | 'stable';
    overallEfficiency: number; // 0-100 score
  };
}