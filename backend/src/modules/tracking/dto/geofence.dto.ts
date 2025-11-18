import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsObject,
} from 'class-validator';
import { GeofenceType } from '../entities/geofence.entity';

export class CreateGeofenceDto {
  @ApiProperty({
    description: 'Name of the geofence',
    example: 'Downtown Pickup Zone',
    type: String,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the geofence',
    example: 'Designated pickup area in downtown',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of geofence',
    example: 'PICKUP',
    enum: GeofenceType,
    type: String,
  })
  @IsEnum(GeofenceType)
  type: GeofenceType;

  @ApiProperty({
    description: 'Latitude coordinate of geofence center',
    example: 40.7128,
    type: Number,
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate of geofence center',
    example: -74.006,
    type: Number,
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    description: 'Radius of the geofence in meters',
    example: 500,
    type: Number,
  })
  @IsNumber()
  radius: number;

  @ApiProperty({
    description: 'Complex polygon coordinates for irregular shapes',
    example: [
      { lat: 40.7128, lng: -74.006 },
      { lat: 40.7138, lng: -74.007 },
      { lat: 40.7148, lng: -74.005 },
    ],
    type: Array,
    required: false,
  })
  @IsOptional()
  @IsArray()
  polygon?: Array<{ lat: number; lng: number }>;

  @ApiProperty({
    description: 'Whether the geofence is active',
    example: true,
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Geofence settings and rules',
    example: {
      alertOnEntry: true,
      alertOnExit: false,
      speedLimit: 50,
      restrictedHours: {
        start: '22:00',
        end: '06:00',
      },
    },
    type: Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  settings?: {
    alertOnEntry?: boolean;
    alertOnExit?: boolean;
    speedLimit?: number;
    restrictedHours?: { start: string; end: string };
  };

  @ApiProperty({
    description: 'Additional metadata for the geofence',
    example: {
      zoneId: 'ZONE_001',
      responsibleManager: 'John Doe',
      contactNumber: '+1234567890',
    },
    type: Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateGeofenceDto extends CreateGeofenceDto {
  @ApiProperty({
    description: 'Geofence ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @IsString()
  id: string;
}

export class GeofenceResponseDto {
  @ApiProperty({
    description: 'Geofence ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Geofence name',
    example: 'Downtown Pickup Zone',
  })
  name: string;

  @ApiProperty({
    description: 'Geofence type',
    example: 'PICKUP',
  })
  type: GeofenceType;

  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.006,
  })
  longitude: number;

  @ApiProperty({
    description: 'Radius in meters',
    example: 500,
  })
  radius: number;

  @ApiProperty({
    description: 'Whether geofence is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}
