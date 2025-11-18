import { IsOptional, IsArray, IsString, IsEnum } from 'class-validator';
import { AnalyticsPeriod } from './analytics-filter.dto';

export class DashboardRequestDto {
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metrics?: string[]; // Array of metric names to include

  @IsOptional()
  @IsString()
  userId?: string; // For user-specific dashboard

  @IsOptional()
  @IsString()
  tenantId?: string; // For tenant-specific dashboard

  @IsOptional()
  @IsString()
  category?: string; // For category-specific dashboard
}
