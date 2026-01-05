import { IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { CommissionStatus } from '../../../entities/broker-commission.entity';

export class CommissionQueryDto {
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @IsOptional()
  @IsUUID()
  brokerId?: string;

  @IsOptional()
  @IsUUID()
  loadId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

