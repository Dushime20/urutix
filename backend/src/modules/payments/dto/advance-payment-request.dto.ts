import {
  IsUUID,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UrgencyLevel {
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
  @IsNotEmpty()
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
    description: 'Reason for requesting advance payment',
    example: 'Need funds for fuel and maintenance before trip completion',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Urgency level of the advance payment request',
    enum: UrgencyLevel,
    example: UrgencyLevel.MEDIUM,
  })
  @IsEnum(UrgencyLevel)
  urgency: UrgencyLevel;
}

