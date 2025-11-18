import { IsString, IsEnum, IsNumber, IsDate, IsOptional, IsBoolean, IsArray, IsUUID, Min, MaxLength, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PolicyType, PolicyStatus } from '../entities/insurance-policy.entity';

export class CreatePolicyDto {
  @ApiProperty({ description: 'Policy number (unique identifier)' })
  @IsString()
  @MaxLength(50)
  policyNumber: string;

  @ApiProperty({ description: 'Insurance company name' })
  @IsString()
  @MaxLength(100)
  insuranceCompany: string;

  @ApiProperty({ enum: PolicyType, description: 'Type of insurance policy' })
  @IsEnum(PolicyType)
  policyType: PolicyType;

  @ApiProperty({ enum: PolicyStatus, description: 'Status of the policy', default: PolicyStatus.PENDING })
  @IsOptional()
  @IsEnum(PolicyStatus)
  status?: PolicyStatus;

  @ApiProperty({ description: 'Total coverage amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  coverageAmount: number;

  @ApiProperty({ description: 'Monthly premium amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  monthlyPremium: number;

  @ApiProperty({ description: 'Deductible amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  deductible: number;

  @ApiProperty({ description: 'Policy start date' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ description: 'Policy end date' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Coverage details as JSON object' })
  @IsOptional()
  @IsObject()
  coverageDetails?: Record<string, any>;

  @ApiPropertyOptional({ description: 'List of policy exclusions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclusions?: string[];

  @ApiPropertyOptional({ description: 'Policy conditions as JSON object' })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether policy auto-renews', default: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ description: 'Insurance agent name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  agentName?: string;

  @ApiPropertyOptional({ description: 'Insurance agent phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  agentPhone?: string;

  @ApiPropertyOptional({ description: 'Insurance agent email' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  agentEmail?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'List of document URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiProperty({ description: 'Truck ID this policy covers' })
  @IsUUID()
  truckId: string;
}
