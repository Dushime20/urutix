import { IsString, IsOptional, IsNotEmpty, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CargoConditionOnDelivery {
  INTACT        = 'INTACT',
  PARTIAL_DAMAGE = 'PARTIAL_DAMAGE',
  FULL_DAMAGE    = 'FULL_DAMAGE',
  SHORT_DELIVERY = 'SHORT_DELIVERY',
}

export class SubmitEpodDto {
  // ── Recipient ──────────────────────────────────────────────────────────────
  @ApiProperty({ description: 'Full legal name of the person who received the cargo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  recipientName: string;

  @ApiPropertyOptional({ description: 'Phone number of the recipient' })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiPropertyOptional({ description: 'ID / passport number of the recipient for high-value cargo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientIdNumber?: string;

  @ApiPropertyOptional({ description: 'Company or organisation the recipient represents' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  recipientCompany?: string;

  // ── Delivery location ──────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Actual delivery address (if different from load destination)' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ description: 'GPS latitude at delivery' })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'GPS longitude at delivery' })
  @IsOptional()
  longitude?: number;

  // ── Vehicle & operational ──────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Truck odometer reading at point of delivery (km)' })
  @IsOptional()
  @IsString()
  odometerReading?: string;

  @ApiPropertyOptional({ description: 'Actual delivery date and time (ISO 8601). Defaults to submission time.' })
  @IsOptional()
  @IsString()
  deliveredAt?: string;

  // ── Cargo condition ────────────────────────────────────────────────────────
  @ApiPropertyOptional({
    description: 'Overall cargo condition on delivery',
    enum: CargoConditionOnDelivery,
    default: CargoConditionOnDelivery.INTACT,
  })
  @IsOptional()
  @IsEnum(CargoConditionOnDelivery)
  cargoCondition?: CargoConditionOnDelivery;

  @ApiPropertyOptional({ description: 'Number of pieces/units actually delivered (for partial delivery reconciliation)' })
  @IsOptional()
  @IsString()
  unitsDelivered?: string;

  // ── Notes & exceptions ─────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'General delivery notes, exceptions, or remarks' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  deliveryNotes?: string;

  @ApiPropertyOptional({ description: 'Exception / damage description if cargo condition is not INTACT' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  exceptionNotes?: string;
}
