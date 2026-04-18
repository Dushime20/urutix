import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  Min,
  Max,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Import enums from entities
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum BusinessType {
  INDIVIDUAL = 'individual',
  SME = 'sme',
  CORPORATION = 'corporation',
  COOPERATIVE = 'cooperative',
}

export enum EligibilityCategory {
  CREDIT_SCORE = 'credit_score',
  BUSINESS_AGE = 'business_age',
  REVENUE = 'revenue',
  COLLATERAL = 'collateral',
  GUARANTOR = 'guarantor',
  DOCUMENTS = 'documents',
  INDUSTRY = 'industry',
  LOCATION = 'location',
}

export enum ComparisonOperator {
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  EQUAL_TO = 'equal_to',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
}

export enum RiskFactor {
  CREDIT_SCORE = 'credit_score',
  PAYMENT_HISTORY = 'payment_history',
  DEBT_TO_INCOME = 'debt_to_income',
  BUSINESS_AGE = 'business_age',
  INDUSTRY_RISK = 'industry_risk',
  COLLATERAL_VALUE = 'collateral_value',
  CASH_FLOW = 'cash_flow',
  MARKET_CONDITIONS = 'market_conditions',
}

export enum RepaymentFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  ANNUALLY = 'annually',
}

export enum PenaltyType {
  FIXED_AMOUNT = 'fixed_amount',
  PERCENTAGE = 'percentage',
  COMPOUND_INTEREST = 'compound_interest',
}

export enum CargoCategory {
  GENERAL = 'general',
  FRAGILE = 'fragile',
  HAZARDOUS = 'hazardous',
  REFRIGERATED = 'refrigerated',
  LIQUID = 'liquid',
  OVERSIZED = 'oversized',
  VALUABLE = 'valuable',
  PERISHABLE = 'perishable',
  CHEMICALS = 'chemicals',
  MACHINERY = 'machinery',
}

export enum ApprovalMode {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  HYBRID = 'hybrid',
}

export enum ComplianceLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  STRICT = 'strict',
  REGULATORY = 'regulatory',
}

// Base DTO
export class BaseLendingPolicyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;
}

// Interest Rate Policy DTOs
export class AdjustmentFactorsDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  credit_score: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  loan_history: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  collateral: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  business_type: number;
}

export class CreateInterestRatePolicyDto extends BaseLendingPolicyDto {
  @ApiProperty({ enum: RiskLevel })
  @IsEnum(RiskLevel)
  risk_level: RiskLevel;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  base_rate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  min_rate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  max_rate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => AdjustmentFactorsDto)
  adjustment_factors?: AdjustmentFactorsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];
}

export class UpdateInterestRatePolicyDto extends CreateInterestRatePolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

// Loan Limit Policy DTOs
export class CreateLoanLimitPolicyDto extends BaseLendingPolicyDto {
  @ApiProperty({ enum: BusinessType })
  @IsEnum(BusinessType)
  business_type: BusinessType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  min_amount: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  max_amount: number;

  @ApiProperty()
  @IsNumber()
  @Min(300)
  @Max(850)
  credit_score_requirement: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(200)
  collateral_requirement: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  max_utilization: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_concurrent_loans?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  annual_income_requirement?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  business_age_requirement?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additional_requirements?: string[];
}

export class UpdateLoanLimitPolicyDto extends CreateLoanLimitPolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

// Eligibility Criteria DTOs
export class CreateEligibilityPolicyDto extends BaseLendingPolicyDto {
  @ApiProperty({ enum: EligibilityCategory })
  @IsEnum(EligibilityCategory)
  category: EligibilityCategory;

  @ApiProperty()
  @IsString()
  requirement: string;

  @ApiPropertyOptional({ enum: ComparisonOperator })
  @IsOptional()
  @IsEnum(ComparisonOperator)
  operator?: ComparisonOperator;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minimum_value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maximum_value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_values?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excluded_values?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failure_message?: string;
}

export class UpdateEligibilityPolicyDto extends CreateEligibilityPolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

// Risk Assessment DTOs
export class ScoringCriteriaDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => Object)
  excellent: { min: number; max: number; score: number };

  @ApiProperty()
  @ValidateNested()
  @Type(() => Object)
  good: { min: number; max: number; score: number };

  @ApiProperty()
  @ValidateNested()
  @Type(() => Object)
  fair: { min: number; max: number; score: number };

  @ApiProperty()
  @ValidateNested()
  @Type(() => Object)
  poor: { min: number; max: number; score: number };
}

export class CreateRiskAssessmentPolicyDto extends BaseLendingPolicyDto {
  @ApiProperty({ enum: RiskFactor })
  @IsEnum(RiskFactor)
  factor: RiskFactor;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ScoringCriteriaDto)
  scoring_criteria: ScoringCriteriaDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  threshold_score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  adjustment_rules?: Array<{
    condition: string;
    adjustment: number;
    type: 'add' | 'multiply' | 'subtract';
  }>;
}

export class UpdateRiskAssessmentPolicyDto extends CreateRiskAssessmentPolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

// Repayment Policy DTOs
export class CreateRepaymentPolicyDto extends BaseLendingPolicyDto {
  @ApiProperty({ enum: RepaymentFrequency })
  @IsEnum(RepaymentFrequency)
  frequency: RepaymentFrequency;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  grace_period_days: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  late_fee_amount: number;

  @ApiProperty({ enum: PenaltyType })
  @IsEnum(PenaltyType)
  late_fee_type: PenaltyType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  penalty_rate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  max_extensions: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  default_threshold_days: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  early_payment_discount?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allow_partial_payments?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minimum_payment_percentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  payment_methods?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  escalation_rules?: Array<{
    days_overdue: number;
    action: string;
    notification_template: string;
  }>;
}

export class UpdateRepaymentPolicyDto extends CreateRepaymentPolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

// Cargo Type Policy DTOs
export class CreateCargoTypePolicyDto extends BaseLendingPolicyDto {
  @ApiProperty({ enum: CargoCategory })
  @IsEnum(CargoCategory)
  cargo_category: CargoCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cargo_type?: string;

  @ApiProperty({ enum: RiskLevel })
  @IsEnum(RiskLevel)
  risk_level: RiskLevel;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  risk_multiplier: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  max_loan_amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(10)
  interest_rate_adjustment?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  insurance_required?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimum_insurance_coverage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_certifications?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  special_conditions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prohibited_routes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  required_equipment?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_transit_days?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(5)
  collateral_requirement_multiplier?: number;
}

export class UpdateCargoTypePolicyDto extends CreateCargoTypePolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}

// System Config DTOs
export class CreateSystemConfigPolicyDto extends BaseLendingPolicyDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  auto_approval_limit: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  manual_review_threshold: number;

  @ApiProperty({ enum: ApprovalMode })
  @IsEnum(ApprovalMode)
  approval_mode: ApprovalMode;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_concurrent_loans?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  total_exposure_limit: number;

  @ApiPropertyOptional({ default: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  max_portfolio_utilization?: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cooldown_period_days?: number;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  default_interest_rate?: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  default_repayment_term_days?: number;

  @ApiPropertyOptional({ default: 70 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  default_advance_percentage?: number;

  @ApiProperty({ enum: ComplianceLevel })
  @IsEnum(ComplianceLevel)
  compliance_level: ComplianceLevel;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  audit_trail_enabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  kyc_verification_required?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  aml_screening_enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  notification_settings?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  business_hours?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  integration_settings?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  risk_thresholds?: any;
}

export class UpdateSystemConfigPolicyDto extends CreateSystemConfigPolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  updated_by?: string;
}