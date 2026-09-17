import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { CANCEL_REASONS } from '../trip-overdue.util';

export class CancelTripDto {
  @ApiProperty({
    description: 'Circumstance that requires stopping the trip during shipping',
    enum: CANCEL_REASONS,
    example: 'Vehicle Breakdown',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn([...CANCEL_REASONS])
  cancelReason: string;

  @ApiPropertyOptional({
    description: 'Additional explanation. Required when cancelReason is Other.',
    example: 'Engine seized 40km from the delivery site; cargo cannot continue on this truck.',
  })
  @ValidateIf((o) => o.cancelReason === 'Other')
  @IsNotEmpty({ message: 'Please describe the circumstance when the reason is Other' })
  @IsString()
  @MaxLength(2000)
  cancelDescription?: string;
}
