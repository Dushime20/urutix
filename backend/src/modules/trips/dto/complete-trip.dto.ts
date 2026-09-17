import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { COMPLETE_CIRCUMSTANCES } from '../trip-overdue.util';

export class CompleteTripDto {
  @ApiPropertyOptional({
    description: 'Circumstance under which the fleet owner is completing the trip',
    enum: COMPLETE_CIRCUMSTANCES,
    example: 'Cargo delivered successfully',
  })
  @IsOptional()
  @IsString()
  @IsIn([...COMPLETE_CIRCUMSTANCES])
  circumstance?: string;

  @ApiPropertyOptional({
    description: 'Additional notes. Required when circumstance is Other.',
    example: 'Consignee confirmed receipt by phone; driver could not capture ePOD.',
  })
  @ValidateIf((o) => o.circumstance === 'Other')
  @IsNotEmpty({ message: 'Please describe the circumstance when Other is selected' })
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
