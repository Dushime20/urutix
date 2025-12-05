import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsOptional, Min } from 'class-validator';

export class InitiateMobileMoneyPaymentDto {
  @ApiProperty({ description: 'Trip ID for the payment' })
  @IsUUID()
  tripId: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code (e.g., RWF)', default: 'RWF' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Phone number for mobile money payment (e.g., 0783544364 or 250783544364)' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'Payment type', required: false })
  @IsOptional()
  @IsString()
  paymentType?: string;

  @ApiProperty({ description: 'Description of the payment', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Reference number', required: false })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: {
    lenderId?: string;
    lenderName?: string;
    financedAmount?: number;
    isLenderPayment?: boolean;
    [key: string]: any;
  };
}

