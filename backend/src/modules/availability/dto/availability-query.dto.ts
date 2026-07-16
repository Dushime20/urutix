import { IsDateString, IsOptional, IsNumber, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TruckAvailabilityQueryDto {
  @ApiProperty({ description: 'Pickup date-time (ISO 8601)', example: '2026-07-10T08:00:00Z' })
  @IsDateString()
  pickupDateTime: string;

  @ApiProperty({ description: 'Delivery date-time (ISO 8601)', example: '2026-07-12T18:00:00Z' })
  @IsDateString()
  deliveryDateTime: string;

  @ApiPropertyOptional({ description: 'Minimum capacity in kg', example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  capacityWeight?: number;

  @ApiPropertyOptional({ description: 'Required truck type', example: 'VAN' })
  @IsOptional()
  @IsString()
  truckType?: string;
}

export class DriverAvailabilityQueryDto {
  @ApiProperty({ description: 'Pickup date-time (ISO 8601)', example: '2026-07-10T08:00:00Z' })
  @IsDateString()
  pickupDateTime: string;

  @ApiProperty({ description: 'Delivery date-time (ISO 8601)', example: '2026-07-12T18:00:00Z' })
  @IsDateString()
  deliveryDateTime: string;

  @ApiPropertyOptional({ description: 'When set, only return drivers assigned to this truck' })
  @IsOptional()
  @IsUUID()
  truckId?: string;
}
