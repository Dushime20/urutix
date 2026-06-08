import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomsInspectionStatus, CustomsRiskLevel, InspectionChannel, ExamType, HoldType } from '../../../entities/customs-inspection.entity';
import { CheckpointType } from '../../../entities/customs-checkpoint.entity';
import { ComplianceResponseStatus } from '../../../entities/customs-compliance-response.entity';

export class CreateInspectionDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() tripId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() plateNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() containerNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shipmentReference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() driverName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() driverId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() truckType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() originCountry?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() destinationCountry?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cargoType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cargoCategory?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() declaredWeight?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() actualWeight?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() declaredQuantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() actualQuantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() hsCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sealNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingCompany?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasDangerousGoods?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRestrictedGoods?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsEnum(CustomsRiskLevel) riskLevel?: CustomsRiskLevel;
  @ApiPropertyOptional() @IsOptional() @IsEnum(InspectionChannel) inspectionChannel?: InspectionChannel;
  @ApiPropertyOptional() @IsOptional() @IsEnum(ExamType) examType?: ExamType;
  @ApiPropertyOptional() @IsOptional() @IsEnum(HoldType) holdType?: HoldType;
  @ApiPropertyOptional() @IsOptional() @IsString() declarationNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() countryOfOrigin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() modeOfTransport?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imdgClass?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() declaredValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() dutyAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() taxAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() aeoNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() deniedPartyFlag?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sanctionsScreened?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() checkpointId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() checkpointName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() inspectionNotes?: string;
  @ApiPropertyOptional() @IsOptional() estimatedReleaseAt?: Date;
}

export class UpdateInspectionStatusDto {
  @ApiProperty({ enum: CustomsInspectionStatus })
  @IsEnum(CustomsInspectionStatus)
  status: CustomsInspectionStatus;

  @ApiPropertyOptional() @IsOptional() @IsString() rejectionReason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() inspectionNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(CustomsRiskLevel) riskLevel?: CustomsRiskLevel;
  @ApiPropertyOptional() @IsOptional() @IsEnum(InspectionChannel) inspectionChannel?: InspectionChannel;
  @ApiPropertyOptional() @IsOptional() @IsEnum(ExamType) examType?: ExamType;
  @ApiPropertyOptional() @IsOptional() @IsEnum(HoldType) holdType?: HoldType;
  @ApiPropertyOptional() @IsOptional() @IsNumber() dutyAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() taxAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() deniedPartyFlag?: boolean;
  @ApiPropertyOptional() @IsOptional() estimatedReleaseAt?: Date;
  @ApiPropertyOptional() @IsOptional() documentsVerified?: Record<string, boolean>;
  @ApiPropertyOptional() @IsOptional() @IsArray() evidenceUrls?: string[];
}

export class SearchTruckDto {
  @ApiPropertyOptional() @IsOptional() @IsString() plateNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shipmentReference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() containerNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() driverId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() driverName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tripId?: string;
}

export class CreateCheckpointDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(CheckpointType) type?: CheckpointType;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
}

// ─── Compliance Response DTOs ─────────────────────────────────────────────────

export class SubmitComplianceResponseDto {
  @ApiProperty({ description: 'Explanation of what was resolved / documents provided' })
  @IsString()
  notes: string;

  @ApiPropertyOptional({
    description: 'IDs of documents already uploaded via /documents endpoint',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds?: string[];
}

export class ReviewComplianceResponseDto {
  @ApiProperty({ enum: ComplianceResponseStatus, description: 'ACCEPTED or REJECTED' })
  @IsEnum(ComplianceResponseStatus)
  status: ComplianceResponseStatus;

  @ApiPropertyOptional({ description: 'Officer review notes / reason for rejection' })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
