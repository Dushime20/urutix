import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsObject,
  IsArray,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RouteComplexityDto {
  @ApiProperty({
    description: 'Percentage of highway driving',
    example: 0.7,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  highwayPercentage: number;

  @ApiProperty({
    description: 'Percentage of urban driving',
    example: 0.2,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  urbanPercentage: number;

  @ApiProperty({
    description: 'Percentage of rural driving',
    example: 0.1,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  ruralPercentage: number;

  @ApiProperty({
    description: 'Number of toll roads on route',
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  tollRoads: number;

  @ApiProperty({
    description: 'Number of border crossings',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  borderCrossings: number;

  @ApiProperty({
    description: 'Total elevation change in feet',
    example: 1500,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  elevationChange: number;
}

export class MarketConditionsDto {
  @ApiProperty({
    description: 'Market demand level (0-1)',
    example: 0.8,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  demandLevel: number;

  @ApiProperty({
    description: 'Market supply level (0-1)',
    example: 0.6,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  supplyLevel: number;

  @ApiProperty({
    description: 'Average competitor pricing per mile',
    example: 2.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  competitorPricing: number;

  @ApiProperty({
    description: 'Seasonal factor multiplier',
    example: 1.2,
    minimum: 0.5,
    maximum: 2.0,
  })
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  seasonalFactor: number;

  @ApiProperty({
    description: 'Current fuel price per gallon',
    example: 3.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  fuelPrice: number;

  @ApiProperty({
    description: 'Market volatility index (0-1)',
    example: 0.3,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  marketVolatility: number;
}

export class TruckAvailabilityDto {
  @ApiProperty({
    description: 'Number of available trucks',
    example: 15,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  availableTrucks: number;

  @ApiProperty({
    description: 'Current truck utilization rate (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  truckUtilization: number;

  @ApiProperty({
    description: 'Type of truck required',
    example: 'flatbed',
    enum: ['flatbed', 'reefer', 'dry_van', 'tanker', 'specialized'],
  })
  @IsString()
  truckType: string;

  @ApiProperty({
    description: 'Capacity utilization rate (0-1)',
    example: 0.75,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  capacityUtilization: number;

  @ApiProperty({
    description: 'Required equipment for the load',
    example: ['liftgate', 'pallet_jacks'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  equipmentRequirements: string[];
}

export class DriverMetricsDto {
  @ApiProperty({
    description: 'Driver rating (0-5)',
    example: 4.2,
    minimum: 0,
    maximum: 5,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  driverRating: number;

  @ApiProperty({
    description: 'Driver safety score (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  safetyScore: number;

  @ApiProperty({
    description: 'Years of driving experience',
    example: 8,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  experienceYears: number;

  @ApiProperty({
    description: 'On-time delivery rate (0-1)',
    example: 0.95,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  onTimeDeliveryRate: number;

  @ApiProperty({
    description: 'Total number of trips completed',
    example: 150,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  totalTrips: number;

  @ApiProperty({
    description: 'Average earnings per trip',
    example: 450.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  averageEarnings: number;
}

export class EnvironmentalFactorsDto {
  @ApiProperty({
    description: 'Weather conditions',
    example: 'clear',
    enum: ['clear', 'rain', 'snow', 'fog', 'storm', 'adverse'],
  })
  @IsString()
  weatherConditions: string;

  @ApiProperty({
    description: 'Traffic conditions',
    example: 'moderate',
    enum: ['light', 'moderate', 'heavy', 'congested'],
  })
  @IsString()
  trafficConditions: string;

  @ApiProperty({
    description: 'Road conditions',
    example: 'good',
    enum: ['excellent', 'good', 'fair', 'poor'],
  })
  @IsString()
  roadConditions: string;

  @ApiProperty({
    description: 'Temperature in Fahrenheit',
    example: 65,
    minimum: -50,
    maximum: 120,
  })
  @IsNumber()
  @Min(-50)
  @Max(120)
  temperature: number;

  @ApiProperty({
    description: 'Precipitation in inches',
    example: 0.1,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  precipitation: number;

  @ApiProperty({
    description: 'Wind speed in mph',
    example: 10,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  windSpeed: number;
}

export class TemporalFeaturesDto {
  @ApiProperty({
    description: 'Day of week (0-6, 0=Sunday)',
    example: 2,
    minimum: 0,
    maximum: 6,
  })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    description: 'Month (1-12)',
    example: 6,
    minimum: 1,
    maximum: 12,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Season',
    example: 'summer',
    enum: ['spring', 'summer', 'fall', 'winter'],
  })
  @IsString()
  season: string;

  @ApiProperty({
    description: 'Whether it is a holiday',
    example: false,
  })
  @IsBoolean()
  isHoliday: boolean;

  @ApiProperty({
    description: 'Whether it is a weekend',
    example: false,
  })
  @IsBoolean()
  isWeekend: boolean;

  @ApiProperty({
    description: 'Time of day (0-23)',
    example: 14,
    minimum: 0,
    maximum: 23,
  })
  @IsNumber()
  @Min(0)
  @Max(23)
  timeOfDay: number;
}

export class CargoFeaturesDto {
  @ApiProperty({
    description: 'Type of cargo',
    example: 'general_freight',
    enum: [
      'general_freight',
      'hazmat',
      'refrigerated',
      'oversized',
      'fragile',
      'live_animals',
    ],
  })
  @IsString()
  cargoType: string;

  @ApiProperty({
    description: 'Whether cargo is hazardous material',
    example: false,
  })
  @IsBoolean()
  isHazmat: boolean;

  @ApiProperty({
    description: 'Whether cargo requires refrigeration',
    example: false,
  })
  @IsBoolean()
  isRefrigerated: boolean;

  @ApiProperty({
    description: 'Whether cargo is fragile',
    example: false,
  })
  @IsBoolean()
  isFragile: boolean;

  @ApiProperty({
    description: 'Whether cargo requires special handling',
    example: false,
  })
  @IsBoolean()
  requiresSpecialHandling: boolean;

  @ApiProperty({
    description: 'Insurance value of cargo',
    example: 50000.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  insuranceValue: number;
}

export class CreatePricingPredictionDto {
  @ApiProperty({
    description: 'Trip ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiProperty({
    description: 'Load ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  loadId?: string;

  @ApiProperty({
    description: 'Truck ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  truckId?: string;

  @ApiProperty({
    description: 'Driver ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({
    description: 'Origin location',
    example: 'New York, NY',
  })
  @IsString()
  originLocation: string;

  @ApiProperty({
    description: 'Destination location',
    example: 'Los Angeles, CA',
  })
  @IsString()
  destinationLocation: string;

  @ApiProperty({
    description: 'Distance in miles',
    example: 2789.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  distance: number;

  @ApiProperty({
    description: 'Weight in pounds',
    example: 15000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiProperty({
    description: 'Volume in cubic feet',
    example: 1200,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  volume: number;

  @ApiProperty({
    description: 'Route complexity information',
    type: RouteComplexityDto,
  })
  @ValidateNested()
  @Type(() => RouteComplexityDto)
  routeComplexity: RouteComplexityDto;

  @ApiProperty({
    description: 'Market conditions',
    type: MarketConditionsDto,
  })
  @ValidateNested()
  @Type(() => MarketConditionsDto)
  marketConditions: MarketConditionsDto;

  @ApiProperty({
    description: 'Truck availability information',
    type: TruckAvailabilityDto,
  })
  @ValidateNested()
  @Type(() => TruckAvailabilityDto)
  truckAvailability: TruckAvailabilityDto;

  @ApiProperty({
    description: 'Driver metrics',
    type: DriverMetricsDto,
  })
  @ValidateNested()
  @Type(() => DriverMetricsDto)
  driverMetrics: DriverMetricsDto;

  @ApiProperty({
    description: 'Environmental factors',
    type: EnvironmentalFactorsDto,
  })
  @ValidateNested()
  @Type(() => EnvironmentalFactorsDto)
  environmentalFactors: EnvironmentalFactorsDto;

  @ApiProperty({
    description: 'Temporal features',
    type: TemporalFeaturesDto,
  })
  @ValidateNested()
  @Type(() => TemporalFeaturesDto)
  temporalFeatures: TemporalFeaturesDto;

  @ApiProperty({
    description: 'Cargo features',
    type: CargoFeaturesDto,
  })
  @ValidateNested()
  @Type(() => CargoFeaturesDto)
  cargoFeatures: CargoFeaturesDto;

  @ApiProperty({
    description: 'Additional metadata',
    example: { priority: 'high', specialInstructions: 'Handle with care' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
