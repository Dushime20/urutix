import { IsString, IsNumber, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PayoutMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  PAYPAL = 'PAYPAL',
  OTHER = 'OTHER',
}

export class CreatePayoutRequestDto {
  @ApiProperty({ description: 'Commission ID to payout' })
  @IsUUID()
  commissionId: string;

  @ApiProperty({ description: 'Payout method', enum: PayoutMethod })
  @IsEnum(PayoutMethod)
  payoutMethod: PayoutMethod;

  @ApiProperty({ description: 'Account details (account number, phone number, etc.)' })
  @IsString()
  accountDetails: string;

  @ApiPropertyOptional({ description: 'Bank name (if applicable)' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Account holder name' })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePayoutRequestDto {
  @ApiPropertyOptional({ description: 'Payout status', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ description: 'Transaction ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Failure reason (if failed)' })
  @IsOptional()
  @IsString()
  failureReason?: string;
}

