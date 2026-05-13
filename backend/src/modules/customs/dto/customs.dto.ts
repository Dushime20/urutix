import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomsInspectionStatus, CustomsRiskLevel } from '../../../entities/customs-inspection.entity';
import { CheckpointType } from '../../../entities/customs-checkpoint.entity';

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
  @ApiPropertyOptional() @IsOptional() @IsString() checkpointId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() checkpointName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() inspectionNotes?: string;
}

export class UpdateInspectionStatusDto {
  @ApiProperty({ enum: CustomsInspectionStatus })
  @IsEnum(CustomsInspectionStatus)
  status: CustomsInspectionStatus;

  @ApiPropertyOptional() @IsOptional() @IsString() rejectionReason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() inspectionNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(CustomsRiskLevel) riskLevel?: CustomsRiskLevel;
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
