import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReleaseTrigger } from '../../../entities/escrow-account.entity';

export class ReleaseScheduleItemDto {
  @ApiProperty({ description: 'Milestone name' })
  @IsString()
  milestone: string;

  @ApiProperty({ description: 'Amount to release' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Percentage of total (alternative to amount)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  percentage?: number;

  @ApiProperty({ enum: ReleaseTrigger })
  @IsEnum(ReleaseTrigger)
  trigger: ReleaseTrigger;
}

export class CreateEscrowDto {
  @ApiProperty({ description: 'Load ID' })
  @IsUUID()
  loadId: string;

  @ApiPropertyOptional({ description: 'Trip ID if trip exists' })
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @ApiProperty({ description: 'Payer ID (cargo owner)' })
  @IsUUID()
  payerId: string;

  @ApiProperty({ description: 'Payee ID (transporter)' })
  @IsUUID()
  payeeId: string;

  @ApiProperty({ description: 'Total amount to hold in escrow' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ description: 'Currency code', default: 'KES' })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiProperty({ description: 'Commission amount for broker' })
  @IsNumber()
  @Min(0)
  commissionAmount: number;

  @ApiPropertyOptional({ description: 'Payment method' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Release schedule', type: [ReleaseScheduleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReleaseScheduleItemDto)
  @IsOptional()
  releaseSchedule?: ReleaseScheduleItemDto[];

  @ApiPropertyOptional({ description: 'Auto-release configuration' })
  @IsObject()
  @IsOptional()
  autoReleaseConfig?: {
    enabled: boolean;
    trigger: ReleaseTrigger;
    delayHours?: number;
    requireConfirmation?: boolean;
  };
}

