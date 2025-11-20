import { IsEnum, IsString, IsDateString, IsNumber, IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TrainingType {
  DEFENSIVE_DRIVING = 'defensive_driving',
  HAZMAT = 'hazmat',
  FIRST_AID = 'first_aid',
  EMERGENCY_PROCEDURES = 'emergency_procedures',
  REGULATIONS = 'regulations',
  TECHNOLOGY = 'technology',
}

export enum TrainingFrequency {
  ONCE = 'once',
  ANNUALLY = 'annually',
  BIANNUALLY = 'biannually',
  QUARTERLY = 'quarterly',
}

export enum TrainingStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  OVERDUE = 'overdue',
}

export class CreateSafetyTrainingDto {
  @ApiProperty({ enum: TrainingType })
  @IsEnum(TrainingType)
  type: TrainingType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  duration: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ enum: TrainingFrequency })
  @IsOptional()
  @IsEnum(TrainingFrequency)
  frequency?: TrainingFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  lastCompleted?: string;

  @ApiProperty()
  @IsDateString()
  nextDue: string;

  @ApiPropertyOptional({ enum: TrainingStatus })
  @IsOptional()
  @IsEnum(TrainingStatus)
  status?: TrainingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiProperty()
  @IsString()
  instructor: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificate?: string;

  @ApiProperty()
  @IsDateString()
  scheduledDate: string; // When the training is scheduled to occur
}

