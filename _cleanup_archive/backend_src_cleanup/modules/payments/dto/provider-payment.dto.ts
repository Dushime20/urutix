import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';

export enum ProviderPaymentStatus {
  COMPLETED = 'completed',
  FAILED = 'failed',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export class ProviderPaymentDto {
  @ApiProperty({
    description: 'Unique transaction ID from payment provider',
    example: 'TXN_123456789',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  transactionId: string;

  @ApiProperty({
    description: 'Payment amount in smallest currency unit (cents)',
    example: 10000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Payment status from provider',
    enum: ProviderPaymentStatus,
    example: 'completed',
  })
  @IsEnum(ProviderPaymentStatus)
  status: ProviderPaymentStatus;

  @ApiProperty({
    description: '3-letter currency code',
    example: 'USD',
    maxLength: 3,
  })
  @IsString()
  @MaxLength(3)
  currency: string;

  @ApiProperty({
    description: 'Payment processing timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'Processing fee charged by provider',
    example: 2.9,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  processingFee?: number;

  @ApiProperty({
    description: 'Error message if payment failed',
    example: 'Insufficient funds',
    required: false,
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({
    description: 'Error code if payment failed',
    example: 'INSUFFICIENT_FUNDS',
    required: false,
  })
  @IsOptional()
  @IsString()
  errorCode?: string;

  @ApiProperty({
    description: 'Additional metadata from provider',
    example: { customerId: 'CUST_123', orderId: 'ORDER_456' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ReconciliationRequestDto {
  @ApiProperty({
    description: 'List of payments from provider to reconcile',
    type: [ProviderPaymentDto],
  })
  providerPayments: ProviderPaymentDto[];

  @ApiProperty({
    description: 'Provider name for reconciliation',
    example: 'stripe',
    required: false,
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({
    description: 'Reconciliation date range start',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Reconciliation date range end',
    example: '2024-01-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class ReconciliationMismatchDto {
  @ApiProperty({
    description: 'Internal payment record',
    type: 'object',
    additionalProperties: true,
  })
  internalPayment: Record<string, any>;

  @ApiProperty({
    description: 'Provider payment record',
    type: 'object',
    additionalProperties: true,
  })
  providerPayment: Record<string, any>;

  @ApiProperty({
    description: 'Type of mismatch',
    example: 'amount_mismatch',
  })
  mismatchType: string;

  @ApiProperty({
    description: 'Description of the mismatch',
    example: 'Amount differs between internal and provider records',
  })
  description: string;
}

export class ReconciliationResponseDto {
  @ApiProperty({
    description: 'Reconciliation status',
    example: 'completed',
  })
  status: string;

  @ApiProperty({
    description: 'Number of payments processed',
    example: 150,
  })
  processedCount: number;

  @ApiProperty({
    description: 'Number of mismatches found',
    example: 3,
  })
  mismatchCount: number;

  @ApiProperty({
    description: 'List of mismatches found',
    type: [ReconciliationMismatchDto],
  })
  mismatches: ReconciliationMismatchDto[];

  @ApiProperty({
    description: 'Reconciliation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;
}
