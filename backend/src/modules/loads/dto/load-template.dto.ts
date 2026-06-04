import { IsString, IsOptional, IsBoolean, IsObject, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoadTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Load configuration data (all load fields)' })
  @IsObject()
  templateData: Record<string, any>;
}

export class UpdateLoadTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateLoadFromTemplateDto {
  @ApiPropertyOptional({ description: 'Field overrides on top of template data' })
  @IsOptional()
  @IsObject()
  overrides?: Record<string, any>;
}

export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export class ScheduleTemplateDto {
  @ApiProperty({ enum: RecurrenceFrequency })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiProperty({ description: 'Start date for recurrence (ISO string)' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ description: 'End date for recurrence (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Day of week (0=Sun, 1=Mon...) for WEEKLY' })
  @IsOptional()
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: 'Day of month (1-31) for MONTHLY' })
  @IsOptional()
  dayOfMonth?: number;
}
