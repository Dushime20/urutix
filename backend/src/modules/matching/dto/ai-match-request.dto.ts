import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OptimizationStrategy {
  FASTEST = 'fastest',
  CHEAPEST = 'cheapest',
  BALANCED = 'balanced',
  FUEL_EFFICIENT = 'fuel_efficient',
}

export enum AlgorithmVersion {
  V2_0 = 'v2.0',
  V2_1_BETA = 'v2.1-beta',
}

export class AIMatchRequestDto {
  @ApiProperty({
    description: 'Load ID to match',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  loadId: string;

  @ApiProperty({
    description: 'Maximum number of matches to return',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({
    description: 'Maximum distance in kilometers',
    example: 500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDistance?: number;

  @ApiProperty({
    description: 'Minimum truck rating',
    example: 4.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiProperty({
    description: 'Maximum price in USD',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({
    description: 'Requires refrigeration',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresRefrigeration?: boolean;

  @ApiProperty({
    description: 'Requires hazmat permit',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresHazmat?: boolean;

  @ApiProperty({
    description: 'Requires lift gate',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresLiftGate?: boolean;

  @ApiProperty({
    description: 'Include driver information in results',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDrivers?: boolean = true;

  @ApiProperty({
    description: 'Optimization strategy',
    enum: OptimizationStrategy,
    example: OptimizationStrategy.BALANCED,
    required: false,
  })
  @IsOptional()
  @IsEnum(OptimizationStrategy)
  optimizationStrategy?: OptimizationStrategy = OptimizationStrategy.BALANCED;

  @ApiProperty({
    description: 'Algorithm version to use',
    enum: AlgorithmVersion,
    example: AlgorithmVersion.V2_0,
    required: false,
  })
  @IsOptional()
  @IsEnum(AlgorithmVersion)
  algorithmVersion?: AlgorithmVersion = AlgorithmVersion.V2_0;

  @ApiProperty({
    description: 'Use A/B testing',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  useABTest?: boolean = false;

  @ApiProperty({
    description: 'Preferred truck types',
    example: ['flatbed', 'box_truck'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredTruckTypes?: string[];

  @ApiProperty({
    description: 'Excluded truck IDs',
    example: ['truck-123', 'truck-456'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedTruckIds?: string[];

  @ApiProperty({
    description: 'Preferred driver IDs',
    example: ['driver-123', 'driver-456'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredDriverIds?: string[];

  @ApiProperty({
    description: 'Minimum capacity utilization percentage',
    example: 70,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minCapacityUtilization?: number;

  @ApiProperty({
    description: 'Maximum capacity utilization percentage',
    example: 90,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxCapacityUtilization?: number;

  @ApiProperty({
    description: 'Include route optimization',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeRouteOptimization?: boolean = true;

  @ApiProperty({
    description: 'Include ML predictions',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeMLPredictions?: boolean = true;

  @ApiProperty({
    description: 'Custom scoring weights',
    example: {
      capacity: 0.3,
      proximity: 0.2,
      performance: 0.2,
      route: 0.1,
      fuel: 0.1,
      time: 0.05,
      price: 0.05,
    },
    required: false,
  })
  @IsOptional()
  customWeights?: {
    capacity?: number;
    proximity?: number;
    performance?: number;
    route?: number;
    fuel?: number;
    time?: number;
    price?: number;
  };
}
