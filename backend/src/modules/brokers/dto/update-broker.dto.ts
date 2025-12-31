import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateBrokerDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  defaultCommissionRate?: number; // Percentage (e.g., 5.00 for 5%)
}

