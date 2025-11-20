import { IsEnum, IsString, IsDateString, IsNumber, IsOptional, IsArray, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InspectionType {
  PRE_TRIP = 'pre_trip',
  POST_TRIP = 'post_trip',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
  RANDOM = 'random',
}

export enum InspectionStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  CONDITIONAL = 'conditional',
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
}

export class InspectionItemDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  category: string;

  @ApiProperty()
  @IsString()
  item: string;

  @ApiProperty()
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  critical?: boolean;
}

export class CreateSafetyInspectionDto {
  @ApiProperty({ enum: InspectionType })
  @IsEnum(InspectionType)
  type: InspectionType;

  @ApiProperty()
  @IsString()
  inspector: string;

  @ApiProperty()
  @IsDateString()
  inspectionDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  truckId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  truckPlate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiProperty({ enum: InspectionStatus })
  @IsEnum(InspectionStatus)
  status: InspectionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxScore?: number;

  @ApiPropertyOptional({ type: [InspectionItemDto] })
  @IsOptional()
  @IsArray()
  items?: InspectionItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextInspectionDate?: string;

  @ApiPropertyOptional({ enum: ComplianceStatus })
  @IsOptional()
  @IsEnum(ComplianceStatus)
  complianceStatus?: ComplianceStatus;
}

