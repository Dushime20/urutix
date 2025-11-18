import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GeoBoundsDto {
  @ApiProperty({
    description: 'Southwest corner coordinates',
    example: { latitude: 40.0, longitude: -74.0 },
  })
  @IsObject()
  southwest: { latitude: number; longitude: number };

  @ApiProperty({
    description: 'Northeast corner coordinates',
    example: { latitude: 41.0, longitude: -73.0 },
  })
  @IsObject()
  northeast: { latitude: number; longitude: number };
}

export class LoadSearchDto {
  @ApiProperty({
    description: 'Search term for title, description, or location names',
    example: 'electronics warehouse',
    required: false,
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiProperty({
    description: 'Geographic bounds for search',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoBoundsDto)
  geoBounds?: GeoBoundsDto;

  @ApiProperty({
    description: 'Maximum distance from a point in kilometers',
    example: 50,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxDistance?: number;

  @ApiProperty({
    description: 'Center point for distance-based search',
    example: { latitude: 40.7128, longitude: -74.006 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  centerPoint?: { latitude: number; longitude: number };

  @ApiProperty({
    description: 'Minimum weight in kg',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minWeight?: number;

  @ApiProperty({
    description: 'Maximum weight in kg',
    example: 5000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxWeight?: number;

  @ApiProperty({
    description: 'Minimum cargo value',
    example: 10000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minValue?: number;

  @ApiProperty({
    description: 'Maximum cargo value',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @ApiProperty({
    description: 'Start date for pickup',
    example: '2024-01-15T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  pickupDateFrom?: string;

  @ApiProperty({
    description: 'End date for pickup',
    example: '2024-01-20T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  pickupDateTo?: string;

  @ApiProperty({
    description: 'Start date for delivery',
    example: '2024-01-17T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  deliveryDateFrom?: string;

  @ApiProperty({
    description: 'End date for delivery',
    example: '2024-01-25T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  deliveryDateTo?: string;
}
