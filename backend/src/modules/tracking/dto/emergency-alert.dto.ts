import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class EmergencyAlertDto {
  @ApiProperty({
    description: 'Trip ID for the emergency alert',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @IsString()
  tripId: string;

  @ApiProperty({
    description: 'Type of emergency',
    example: 'ACCIDENT',
    enum: ['ACCIDENT', 'BREAKDOWN', 'MEDICAL', 'SECURITY', 'WEATHER', 'OTHER'],
    type: String,
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Emergency message description',
    example: 'Vehicle involved in minor collision, driver needs assistance',
    type: String,
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Location coordinates where emergency occurred',
    example: {
      lat: 40.7128,
      lng: -74.006,
    },
    type: Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  location?: {
    lat: number;
    lng: number;
  };

  @ApiProperty({
    description: 'Additional emergency details',
    example: {
      severity: 'HIGH',
      requiresImmediateResponse: true,
      contactNumber: '+1234567890',
    },
    type: Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}
