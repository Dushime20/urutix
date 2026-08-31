import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DELAY_REASONS } from '../trip-overdue.util';

export class ReportTripDelayDto {
  @ApiProperty({
    description: 'Structured delay reason',
    enum: DELAY_REASONS,
    example: 'Vehicle Breakdown',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([...DELAY_REASONS])
  delayReason: string;

  @ApiPropertyOptional({
    description: 'Additional explanation. Required when delayReason is Other.',
    example: 'Engine overheated near the border checkpoint.',
  })
  @ApiPropertyOptional({
    description: 'Additional explanation. Required when delayReason is Other.',
    example: 'Engine overheated near the border checkpoint.',
  })
  @ValidateIf((o) => o.delayReason === 'Other')
  @IsNotEmpty({ message: 'Please provide an explanation when the delay reason is Other' })
  @IsString()
  @MaxLength(2000)
  delayDescription?: string;

  @ApiProperty({
    description: 'New estimated arrival (ISO-8601, interpreted as UTC if no offset)',
    example: '2026-09-01T08:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  newEstimatedArrival: string;
}
