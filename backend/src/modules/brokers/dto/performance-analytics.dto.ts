import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CalculatePerformanceDto {
  @IsString()
  transporterId: string;
}

export class PerformanceQueryDto {
  @IsOptional()
  @IsString()
  transporterId?: string;

  @IsOptional()
  @IsNumber()
  minReliabilityScore?: number;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}

