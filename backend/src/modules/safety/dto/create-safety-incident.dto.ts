import {
  IsEnum,
  IsString,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IncidentType {
  ACCIDENT = 'accident',
  NEAR_MISS = 'near_miss',
  INJURY = 'injury',
  PROPERTY_DAMAGE = 'property_damage',
  TRAFFIC_VIOLATION = 'traffic_violation',
}

export enum IncidentSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export enum IncidentStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export class CreateSafetyIncidentDto {
  @ApiProperty({ enum: IncidentType })
  @IsEnum(IncidentType)
  type: IncidentType;

  @ApiProperty({ enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverName?: string;

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
  @IsString()
  weatherConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roadConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  injuries?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  propertyDamage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  policeReport?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportNumber?: string;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  correctiveActions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  insuranceClaim?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  claimNumber?: string;
}
