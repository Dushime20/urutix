import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsArray,
} from 'class-validator';
import {
  MaintenanceStatus,
  MaintenanceType,
} from '../../../entities/maintenance-log.entity';

export class CreateMaintenanceLogDto {
  @ApiProperty({ description: 'Truck ID' })
  @IsUUID()
  truckId: string;

  @ApiPropertyOptional({ description: 'Driver ID' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({
    description: 'Maintenance type',
    enum: MaintenanceType,
    default: MaintenanceType.ROUTINE,
  })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ description: 'Task name' })
  @IsString()
  taskName: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Service date', example: '2026-03-24' })
  @IsOptional()
  @IsDateString()
  serviceDate?: string;

  @ApiPropertyOptional({ description: 'Provider name' })
  @IsOptional()
  @IsString()
  providerName?: string;

  @ApiPropertyOptional({
    description: 'Maintenance status',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ description: 'Maintenance cost', default: 0 })
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional({ description: 'Odometer reading' })
  @IsOptional()
  @IsNumber()
  odometerReading?: number;

  @ApiPropertyOptional({ description: 'List of parts replaced' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  partsReplaced?: string[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMaintenanceLogDto extends CreateMaintenanceLogDto {
  // Inherits all properties from CreateMaintenanceLogDto
}
