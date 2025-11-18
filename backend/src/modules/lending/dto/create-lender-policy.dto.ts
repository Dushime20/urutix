import { IsNumber, IsPositive, Min, Max, IsOptional } from 'class-validator';

export class CreateLenderPolicyDto {
  @IsNumber()
  @Min(0.001)
  @Max(1)
  interest_rate: number;

  @IsNumber()
  @IsPositive()
  repayment_term_days: number;

  @IsNumber()
  @IsPositive()
  max_advance_per_trip: number;

  @IsNumber()
  @IsPositive()
  max_exposure: number;

  @IsNumber()
  @Min(0.1)
  @Max(1)
  @IsOptional()
  advance_percentage?: number = 0.7;
}
