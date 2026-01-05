import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import { CommissionStatus } from '../../../entities/broker-commission.entity';

export class UpdateCommissionStatusDto {
  @IsNotEmpty()
  @IsEnum(CommissionStatus)
  status: CommissionStatus;

  @IsOptional()
  @IsString()
  paymentReference?: string;
}

