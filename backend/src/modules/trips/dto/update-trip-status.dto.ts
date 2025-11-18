import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { TripStatus } from '../../../entities/trip.entity';

export class UpdateTripStatusDto {
  @IsEnum(TripStatus)
  status: TripStatus;

  @IsOptional()
  @IsDateString()
  actualStartTime?: Date;

  @IsOptional()
  @IsDateString()
  actualEndTime?: Date;

  @IsOptional()
  @IsString()
  currentLocation?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  estimatedArrival?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  issues?: string;
}
