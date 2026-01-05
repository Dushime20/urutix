import { IsNotEmpty, IsUUID, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class AssignBrokerToLoadDto {
  @IsNotEmpty()
  @IsUUID()
  brokerId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number; // Override default commission rate for this load
}

