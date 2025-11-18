import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDate,
  IsObject,
} from 'class-validator';

export class LocationUpdateDto {
  @ApiProperty({
    description: 'Trip ID for the location update',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @IsString()
  tripId: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
    type: Number,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.006,
    type: Number,
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    description: 'Vehicle speed in km/h',
    example: 65,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiProperty({
    description: 'Vehicle heading in degrees (0-360)',
    example: 180,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  heading?: number;

  @ApiProperty({
    description: 'GPS accuracy in meters',
    example: 5,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({
    description: 'Device battery level percentage',
    example: 85,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  batteryLevel?: number;

  @ApiProperty({
    description: 'Whether the vehicle is currently moving',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isMoving?: boolean;

  @ApiProperty({
    description: 'Timestamp of the location update',
    example: '2024-01-15T10:30:00Z',
    type: Date,
  })
  @IsDate()
  timestamp: Date;

  @ApiProperty({
    description: 'Additional metadata for the location update',
    example: {
      engineTemp: 85,
      fuelLevel: 75,
      weather: 'sunny',
      roadConditions: 'dry',
    },
    type: Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
