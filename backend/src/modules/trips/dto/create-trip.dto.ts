import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { TripStatus } from '../../../entities/trip.entity';

export class CreateTripDto {
  @ApiProperty({
    description: 'Load ID for the trip',
    example: 'load-uuid',
    type: String,
  })
  @IsUUID()
  loadId: string;

  @ApiProperty({
    description: 'Truck ID for the trip',
    example: 'truck-uuid',
    type: String,
  })
  @IsUUID()
  truckId: string;

  @ApiProperty({
    description: 'Driver ID for the trip',
    example: 'driver-uuid',
    type: String,
  })
  @IsUUID()
  driverId: string;

  @ApiProperty({
    description: 'Planned start time of the trip',
    example: '2024-01-15T10:00:00.000Z',
    type: String,
  })
  @IsDateString()
  plannedStartTime: Date;

  @ApiProperty({
    description: 'Planned end time of the trip',
    example: '2024-01-16T18:00:00.000Z',
    type: String,
  })
  @IsDateString()
  plannedEndTime: Date;

  @ApiProperty({
    description: 'Agreed price for the trip',
    example: 2500.0,
    type: Number,
  })
  @IsNumber()
  agreedPrice: number;

  @ApiProperty({
    description: 'Trip status',
    example: 'PLANNED',
    enum: TripStatus,
    default: TripStatus.PLANNED,
  })
  @IsEnum(TripStatus)
  @IsOptional()
  status?: TripStatus;

  @ApiProperty({
    description: 'Additional notes for the trip',
    example: 'Handle with care - Fragile cargo',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Route description',
    example: 'LA to NYC via I-40',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  routeDescription?: string;
}

export class CreateTripResponseDto {
  @ApiProperty({
    description: 'Trip ID',
    example: 'trip-uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Trip number',
    example: 'TRIP-2024-001',
  })
  tripNumber: string;

  @ApiProperty({
    description: 'Trip status',
    example: 'PLANNED',
  })
  status: string;

  @ApiProperty({
    description: 'Agreed price',
    example: 2500.0,
  })
  agreedPrice: number;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-01-15T10:00:00.000Z',
  })
  createdAt: Date;
}
