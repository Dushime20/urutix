import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class SendMobileMoneyPaymentDto {
  @ApiProperty({ 
    description: 'Receiver phone number (the person who will receive the money)',
    example: '0783544364 or 250783544364'
  })
  @IsString()
  receiverPhoneNumber: string;

  @ApiProperty({ 
    description: 'Amount to send',
    example: 50000
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ 
    description: 'Currency code (e.g., RWF)', 
    default: 'RWF' 
  })
  @IsString()
  currency: string;

  @ApiProperty({ 
    description: 'Trip ID (optional, for trip-related payments)',
    required: false
  })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiProperty({ 
    description: 'Payment description/message that will be sent to receiver',
    example: 'Payment for cargo transportation services',
    required: false
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ 
    description: 'Reference number (optional, will be auto-generated if not provided)',
    required: false
  })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiProperty({ 
    description: 'Additional metadata (e.g., lenderId, isLenderPayment)',
    required: false
  })
  @IsOptional()
  metadata?: {
    lenderId?: string;
    lenderName?: string;
    isLenderPayment?: boolean;
    cargoOwnerId?: string;
    [key: string]: any;
  };
}

