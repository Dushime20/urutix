import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InspectionDecision } from '../../../entities/cargo-inspection.entity';

export class PreTripVerificationDto {
  @IsOptional()
  identityVerified?: boolean;

  @IsOptional()
  quantityVerified?: boolean;

  @IsOptional()
  actualQuantity?: number;

  @IsOptional()
  weightVerified?: boolean;

  @IsOptional()
  actualWeight?: number;

  @IsOptional()
  dimensionsVerified?: boolean;

  @IsOptional()
  actualDimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };

  @IsOptional()
  packagingVerified?: boolean;

  @IsOptional()
  conditionVerified?: boolean;

  @IsOptional()
  documentationVerified?: boolean;

  @IsOptional()
  sealVerified?: boolean;

  @IsOptional()
  sealNumber?: string;
}

export class PreTripInspectionIssueDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  severity: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  actionRequired?: string;
}

export class SubmitPreTripInspectionDto {
  @IsNotEmpty()
  @IsEnum(InspectionDecision)
  decision: InspectionDecision;

  @IsNotEmpty()
  @IsString()
  notes: string;

  @IsOptional()
  @IsArray()
  checklist?: Array<{
    id: string;
    label: string;
    verified: boolean;
    notes?: string;
    discrepancy?: boolean;
  }>;

  @IsOptional()
  @ValidateNested()
  @Type(() => PreTripVerificationDto)
  verification?: PreTripVerificationDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreTripInspectionIssueDto)
  issues?: PreTripInspectionIssueDto[];

  @IsOptional()
  @IsArray()
  photos?: string[];

  @IsOptional()
  @IsArray()
  documents?: Array<{
    id: string;
    url: string;
    type: 'photo' | 'document' | 'signature';
    label?: string;
    uploadedAt: string;
  }>;
}

export class MarkReadyForReInspectionDto {
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class ApprovePreTripInspectionDto {
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}
