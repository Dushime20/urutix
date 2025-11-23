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
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ClaimType,
  ClaimStatus,
  ClaimPriority,
} from '../entities/insurance-claim.entity';

export class CreateClaimDto {
  @ApiProperty({ description: 'Claim number (unique identifier)' })
  @IsString()
  @MaxLength(50)
  claimNumber: string;

  @ApiProperty({ enum: ClaimType, description: 'Type of insurance claim' })
  @IsEnum(ClaimType)
  claimType: ClaimType;

  @ApiProperty({
    enum: ClaimStatus,
    description: 'Status of the claim',
    default: ClaimStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @ApiProperty({
    enum: ClaimPriority,
    description: 'Priority level of the claim',
    default: ClaimPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(ClaimPriority)
  priority?: ClaimPriority;

  @ApiProperty({ description: 'Detailed description of the incident' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Date when the incident occurred' })
  @Type(() => Date)
  @IsDate()
  incidentDate: Date;

  @ApiProperty({ description: 'Date when the claim was reported' })
  @Type(() => Date)
  @IsDate()
  reportedDate: Date;

  @ApiProperty({ description: 'Estimated claim amount', minimum: 0 })
  @IsNumber()
  @Min(0)
  estimatedAmount: number;

  @ApiPropertyOptional({ description: 'Approved claim amount', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  @ApiPropertyOptional({ description: 'Amount already paid', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'Insurance adjuster name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  adjusterName?: string;

  @ApiPropertyOptional({ description: 'Insurance adjuster phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  adjusterPhone?: string;

  @ApiPropertyOptional({ description: 'Insurance adjuster email' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  adjusterEmail?: string;

  @ApiPropertyOptional({ description: 'Adjuster notes' })
  @IsOptional()
  @IsString()
  adjusterNotes?: string;

  @ApiPropertyOptional({ description: 'Investigation notes' })
  @IsOptional()
  @IsString()
  investigationNotes?: string;

  @ApiPropertyOptional({ description: 'Reason for claim denial' })
  @IsOptional()
  @IsString()
  denialReason?: string;

  @ApiPropertyOptional({ description: 'List of document URLs' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  documents?: string[];

  @ApiPropertyOptional({ description: 'List of photo URLs' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photos?: string[];

  @ApiPropertyOptional({ description: 'Location where incident occurred' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ description: 'Police report number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policeReportNumber?: string;

  @ApiPropertyOptional({ description: 'Witness name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  witnessName?: string;

  @ApiPropertyOptional({ description: 'Witness phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  witnessPhone?: string;

  @ApiPropertyOptional({ description: 'Witness statement' })
  @IsOptional()
  @IsString()
  witnessStatement?: string;

  @ApiPropertyOptional({
    description: 'Whether the insured is at fault',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFault?: boolean;

  @ApiPropertyOptional({ description: 'Description of fault if applicable' })
  @IsOptional()
  @IsString()
  faultDescription?: string;

  @ApiPropertyOptional({ description: 'Date when claim was settled' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  settlementDate?: Date;

  @ApiPropertyOptional({ description: 'Settlement notes' })
  @IsOptional()
  @IsString()
  settlementNotes?: string;

  @ApiProperty({ description: 'Insurance policy ID this claim belongs to' })
  @IsUUID()
  policyId: string;

  @ApiPropertyOptional({ description: 'User ID assigned to handle this claim' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;
}
