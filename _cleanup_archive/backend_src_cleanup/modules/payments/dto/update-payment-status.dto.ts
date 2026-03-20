import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { PaymentStatus } from '../../../entities/payment.entity';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  gatewayResponse?: string;

  @IsOptional()
  @IsDateString()
  processedAt?: Date;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  @IsNumber()
  processingFee?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
