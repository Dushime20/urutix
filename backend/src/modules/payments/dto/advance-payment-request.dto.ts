import { IsString, IsNumber, IsEnum, IsOptional, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AdvanceUrgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class AdvancePaymentRequestDto {
  @ApiProperty({
    description: 'Trip ID for which advance payment is requested',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  tripId: string;

  @ApiProperty({
    description: 'Requested advance payment amount',
    example: 500.0,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Reason for advance payment request',
    example: 'Need funds for fuel and driver wages before trip start',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Urgency level of the advance payment request',
    enum: AdvanceUrgency,
    default: AdvanceUrgency.MEDIUM,
  })
  @IsEnum(AdvanceUrgency)
  @IsOptional()
  urgency?: AdvanceUrgency = AdvanceUrgency.MEDIUM;
}

