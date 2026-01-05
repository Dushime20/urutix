import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MatchRecommendationType } from '../../../entities/broker-intelligence.entity';

export class GenerateRecommendationsDto {
  @IsString()
  loadId: string;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class AcceptRecommendationDto {
  @IsString()
  recommendationId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RouteOptimizationDto {
  @IsString()
  loadId: string;

  @IsString()
  truckId: string;
}

export class BundlingOpportunityDto {
  @IsString()
  loadId: string;

  @IsArray()
  @IsString({ each: true })
  candidateLoadIds: string[];
}

export class BackhaulOpportunityDto {
  @IsString()
  loadId: string;

  @IsString()
  transporterId: string;
}

