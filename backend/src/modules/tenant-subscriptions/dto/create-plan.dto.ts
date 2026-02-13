import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, Min } from 'class-validator';
import { PlanDuration, PlanTargetUser } from '../../../entities/tenant-plan.entity';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PlanTargetUser)
  targetUser: PlanTargetUser;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(PlanDuration)
  duration: PlanDuration;

  @IsOptional()
  @IsNumber()
  maxShipments?: number;

  @IsOptional()
  @IsNumber()
  maxTrucks?: number;

  @IsOptional()
  @IsNumber()
  maxDrivers?: number;

  @IsOptional()
  @IsNumber()
  maxTransactions?: number;

  @IsOptional()
  @IsBoolean()
  advancedAnalytics?: boolean;

  @IsOptional()
  @IsBoolean()
  prioritySupport?: boolean;

  @IsOptional()
  @IsBoolean()
  apiAccess?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;
}
