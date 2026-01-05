import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { PaymentTermType } from '../../../entities/broker-intelligence.entity';

export class PerformCreditCheckDto {
  @IsString()
  transporterId: string;
}

export class UpdatePaymentTermsDto {
  @IsEnum(PaymentTermType)
  paymentTerms: PaymentTermType;

  @IsOptional()
  @IsNumber()
  customPaymentDays?: number;

  @IsOptional()
  @IsNumber()
  creditLimit?: number;
}

export class CreditQueryDto {
  @IsOptional()
  @IsString()
  transporterId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

