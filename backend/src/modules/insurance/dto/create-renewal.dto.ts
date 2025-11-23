import {
  IsString,
  IsEnum,
  IsNumber,
  IsDate,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  Min,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RenewalStatus, RenewalType } from '../entities/policy-renewal.entity';

export class CreateRenewalDto {
  @ApiProperty({ description: 'Renewal number (unique identifier)' })
  @IsString()
  @MaxLength(50)
  renewalNumber: string;

  @ApiProperty({
    enum: RenewalStatus,
    description: 'Status of the renewal',
    default: RenewalStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RenewalStatus)
  status?: RenewalStatus;

  @ApiProperty({ enum: RenewalType, description: 'Type of renewal' })
  @IsEnum(RenewalType)
  renewalType: RenewalType;

  @ApiProperty({ description: 'Current policy end date' })
  @Type(() => Date)
  @IsDate()
  currentEndDate: Date;

  @ApiProperty({ description: 'Renewal date' })
  @Type(() => Date)
  @IsDate()
  renewalDate: Date;

  @ApiPropertyOptional({ description: 'New policy start date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  newStartDate?: Date;

  @ApiPropertyOptional({ description: 'New policy end date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  newEndDate?: Date;

  @ApiProperty({ description: 'Current monthly premium', minimum: 0 })
  @IsNumber()
  @Min(0)
  currentPremium: number;

  @ApiPropertyOptional({ description: 'New monthly premium', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newPremium?: number;

  @ApiPropertyOptional({ description: 'Premium change amount' })
  @IsOptional()
  @IsNumber()
  premiumChange?: number;

  @ApiPropertyOptional({ description: 'New coverage amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newCoverageAmount?: number;

  @ApiPropertyOptional({ description: 'New deductible amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newDeductible?: number;

  @ApiPropertyOptional({ description: 'List of coverage changes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coverageChanges?: string[];

  @ApiPropertyOptional({ description: 'New coverage details as JSON object' })
  @IsOptional()
  @IsObject()
  newCoverageDetails?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether renewal is automatic',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ description: 'Reason for renewal' })
  @IsOptional()
  @IsString()
  renewalReason?: string;

  @ApiPropertyOptional({ description: 'Reason for rejection if applicable' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'List of document URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({ description: 'Date when reminder was sent' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reminderSentDate?: Date;

  @ApiPropertyOptional({ description: 'Date when renewal was approved' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  approvalDate?: Date;

  @ApiPropertyOptional({ description: 'Date when renewal was completed' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completionDate?: Date;

  @ApiPropertyOptional({ description: 'User ID who approved the renewal' })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @ApiProperty({ description: 'Insurance policy ID this renewal belongs to' })
  @IsUUID()
  policyId: string;
}
