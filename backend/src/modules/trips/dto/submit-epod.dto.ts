import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitEpodDto {
  @ApiProperty({ description: 'Full name of the person who received the cargo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  recipientName: string;

  @ApiPropertyOptional({ description: 'Phone number of the recipient' })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiPropertyOptional({ description: 'Any notes about the delivery condition' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  deliveryNotes?: string;

  @ApiPropertyOptional({ description: 'Odometer reading at delivery' })
  @IsOptional()
  @IsString()
  odometerReading?: string;

  @ApiPropertyOptional({ description: 'Delivery address if different from load destination' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ description: 'GPS latitude at delivery' })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'GPS longitude at delivery' })
  @IsOptional()
  longitude?: number;
}
