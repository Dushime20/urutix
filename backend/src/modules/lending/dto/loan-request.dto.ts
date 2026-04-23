import {
  IsString,
  IsUUID,
  IsNumber,
  IsPositive,
  IsArray,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsEnum,
  Min,
  Max,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BeneficiaryType {
  FUEL = 'fuel',
  DRIVER = 'driver',
  MAINTENANCE = 'maintenance',
  TOLLS = 'tolls',
  TRUCK_OWNER = 'truck_owner',
  OTHER = 'other',
}

export class BeneficiaryDto {
  @IsEnum(BeneficiaryType, { message: 'Invalid beneficiary type' })
  @IsNotEmpty({ message: 'Beneficiary type is required' })
  type: BeneficiaryType;

  @IsUUID('4', { message: 'Invalid beneficiary ID format' })
  @IsNotEmpty({ message: 'Beneficiary ID is required' })
  id: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be positive' })
  @Min(0.01, { message: 'Amount must be at least 0.01' })
  @Max(1000000, { message: 'Amount cannot exceed 1,000,000' })
  amount: number;
}

export class CreateLoanRequestDto {
  @IsUUID('4', { message: 'Invalid tenant ID format' })
  @IsNotEmpty({ message: 'Tenant ID is required' })
  tenant_id: string;

  @IsUUID('4', { message: 'Invalid cargo ID format' })
  @IsNotEmpty({ message: 'Cargo ID is required' })
  cargo_id: string;

  @IsUUID('4', { message: 'Invalid trip ID format' })
  @IsNotEmpty({ message: 'Trip ID is required' })
  trip_id: string;

  @IsUUID('4', { message: 'Invalid lender ID format' })
  @IsOptional()
  lender_id?: string;

  @IsNumber({}, { message: 'Requested amount must be a number' })
  @IsPositive({ message: 'Requested amount must be positive' })
  @Min(1, { message: 'Requested amount must be at least 1' })
  @Max(1000000, { message: 'Requested amount cannot exceed 1,000,000' })
  requested_amount: number;

  @IsArray({ message: 'Requested split must be an array' })
  @ValidateNested({ each: true, message: 'Each beneficiary must be valid' })
  @Type(() => BeneficiaryDto)
  requested_split: BeneficiaryDto[];

  @IsUUID('4', { message: 'Invalid created by ID format' })
  @IsNotEmpty({ message: 'Created by ID is required' })
  created_by: string;

  @IsDateString({}, { message: 'Invalid due date format' })
  @IsOptional()
  due_date?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class LoanApprovalDto {
  @IsString()
  status: 'approved' | 'rejected';

  @IsNumber()
  @IsPositive()
  @IsOptional()
  approved_amount?: number;

  @IsString()
  @IsOptional()
  external_loan_ref?: string;

  @IsNumber()
  @IsOptional()
  interest_amount?: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsOptional()
  disbursement_instruction?: {
    mode: 'platform_initiated' | 'lender_initiated';
    expected_disbursement_date?: string;
  };
}
