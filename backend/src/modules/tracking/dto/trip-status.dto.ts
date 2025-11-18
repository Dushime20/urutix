import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDate,
  IsNumber,
  IsObject,
} from 'class-validator';

export class TripStatusUpdateDto {
  @ApiProperty({
    description: 'Trip ID for the status update',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @IsString()
  tripId: string;

  @ApiProperty({
    description: 'New trip status',
    example: 'PICKUP_ARRIVED',
    enum: [
      'STARTED',
      'PICKUP_ARRIVED',
      'PICKUP_COMPLETED',
      'DELIVERY_ARRIVED',
      'DELIVERY_COMPLETED',
      'COMPLETED',
      'CANCELLED',
    ],
    type: String,
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Estimated time of arrival',
    example: '2024-01-15T14:30:00Z',
    type: Date,
    required: false,
  })
  @IsOptional()
  @IsDate()
  eta?: Date;

  @ApiProperty({
    description: 'Distance to destination in kilometers',
    example: 150.5,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiProperty({
    description: 'Estimated duration in minutes',
    example: 120,
    type: Number,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({
    description: 'Additional metadata for the status update',
    example: {
      customerContacted: true,
      weatherConditions: 'rainy',
      trafficConditions: 'moderate',
    },
    type: Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
