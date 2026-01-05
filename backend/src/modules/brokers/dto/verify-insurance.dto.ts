import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationType } from '../../../entities/insurance-verification.entity';

export class VerifyInsuranceDto {
  @ApiProperty({ description: 'Transporter ID to verify' })
  @IsUUID()
  transporterId: string;

  @ApiPropertyOptional({ description: 'Load ID if verification is for specific load' })
  @IsUUID()
  @IsOptional()
  loadId?: string;

  @ApiProperty({ enum: VerificationType, description: 'Type of verification' })
  @IsEnum(VerificationType)
  verificationType: VerificationType;

  @ApiPropertyOptional({ description: 'Policy number' })
  @IsString()
  @IsOptional()
  policyNumber?: string;

  @ApiPropertyOptional({ description: 'License number' })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'DOT number' })
  @IsString()
  @IsOptional()
  dotNumber?: string;

  @ApiPropertyOptional({ description: 'MC number' })
  @IsString()
  @IsOptional()
  mcNumber?: string;

  @ApiPropertyOptional({ description: 'Insurance company name' })
  @IsString()
  @IsOptional()
  insuranceCompany?: string;

  @ApiPropertyOptional({ description: 'Coverage amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  coverageAmount?: number;

  @ApiPropertyOptional({ description: 'Effective date' })
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Verification notes' })
  @IsString()
  @IsOptional()
  verificationNotes?: string;
}

