import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  LoadStatusV2,
  CargoTypeV2,
  UrgencyLevelV2,
} from './create-load-v2.dto';

export class LoadsQueryV2Dto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
    required: false,
    enum: [
      'id',
      'title',
      'weight',
      'loadValue',
      'pickupDate',
      'deliveryDate',
      'status',
      'createdAt',
      'updatedAt',
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    example: 'DESC',
    required: false,
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({
    description: 'Filter by load status',
    enum: LoadStatusV2,
    required: false,
  })
  @IsOptional()
  @IsEnum(LoadStatusV2)
  status?: LoadStatusV2;

  @ApiProperty({
    description: 'Filter by cargo type',
    enum: CargoTypeV2,
    required: false,
  })
  @IsOptional()
  @IsEnum(CargoTypeV2)
  cargoType?: CargoTypeV2;

  @ApiProperty({
    description: 'Filter by urgency level',
    enum: UrgencyLevelV2,
    required: false,
  })
  @IsOptional()
  @IsEnum(UrgencyLevelV2)
  urgencyLevel?: UrgencyLevelV2;

  @ApiProperty({
    description: 'Filter hazardous cargo',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isHazardous?: boolean;

  @ApiProperty({
    description: 'Filter refrigerated cargo',
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  requiresRefrigeration?: boolean;

  @ApiProperty({
    description: 'Filter time-critical cargo',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isTimeCritical?: boolean;

  @ApiProperty({
    description: 'Search in title, description, and cargo type',
    example: 'electronics',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by pickup date (start)',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Filter by delivery date (end)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Minimum weight in kg',
    example: 1000,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minWeight?: number;

  @ApiProperty({
    description: 'Maximum weight in kg',
    example: 5000,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxWeight?: number;

  @ApiProperty({
    description: 'Minimum load value in USD',
    example: 10000,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minValue?: number;

  @ApiProperty({
    description: 'Maximum load value in USD',
    example: 50000,
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxValue?: number;

  @ApiProperty({ description: 'Filter by cargo owner ID', required: false })
  @IsOptional()
  @IsString()
  cargoOwnerId?: string;

  @ApiProperty({ description: 'Filter by pickup location ID', required: false })
  @IsOptional()
  @IsString()
  pickupLocationId?: string;

  @ApiProperty({
    description: 'Filter by delivery location ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  deliveryLocationId?: string;
}
