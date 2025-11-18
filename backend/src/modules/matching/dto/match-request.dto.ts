import {
  IsUUID,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { MatchingAlgorithm } from '../matching.service';

export class MatchRequestDto {
  @IsUUID()
  loadId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDistance?: number; // in kilometers

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minRating?: number; // 0-1 scale

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsBoolean()
  requiresRefrigeration?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresHazmat?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresLiftGate?: boolean;

  @IsOptional()
  @IsString()
  preferredTruckType?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number; // number of matches to return

  @IsOptional()
  @IsBoolean()
  includeDrivers?: boolean; // whether to include driver information

  @IsOptional()
  @IsEnum(MatchingAlgorithm)
  algorithm?: MatchingAlgorithm; // which matching algorithm to use

  @IsOptional()
  @IsBoolean()
  includeRouteOptimization?: boolean; // include route optimization data

  @IsOptional()
  @IsBoolean()
  includeEnvironmentalImpact?: boolean; // include environmental impact data

  @IsOptional()
  @IsBoolean()
  includeRiskAnalysis?: boolean; // include risk analysis

  @IsOptional()
  @IsBoolean()
  includeSuccessProbability?: boolean; // include success probability

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minCompatibilityScore?: number; // minimum compatibility score (0-1)

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  maxRiskScore?: number; // maximum risk score (0-1)

  @IsOptional()
  @IsBoolean()
  prioritizeCost?: boolean; // prioritize cost over other factors

  @IsOptional()
  @IsBoolean()
  prioritizeSpeed?: boolean; // prioritize speed/distance over other factors

  @IsOptional()
  @IsBoolean()
  prioritizeQuality?: boolean; // prioritize quality/rating over other factors

  @IsOptional()
  @IsString()
  preferredCarrierId?: string; // preferred carrier ID

  @IsOptional()
  @IsString()
  excludedCarrierId?: string; // excluded carrier ID

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxHoursToAvailability?: number; // maximum hours until truck is available

  @IsOptional()
  @IsBoolean()
  includeUnavailable?: boolean; // include currently unavailable trucks

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTruckAge?: number; // maximum truck age in years

  @IsOptional()
  @IsNumber()
  @Min(0)
  minDriverExperience?: number; // minimum driver experience in years

  @IsOptional()
  @IsString({ each: true })
  requiredCertifications?: string[]; // required driver certifications

  @IsOptional()
  @IsBoolean()
  requireInsurance?: boolean; // require insurance coverage

  @IsOptional()
  @IsNumber()
  @Min(0)
  minInsuranceCoverage?: number; // minimum insurance coverage amount

  @IsOptional()
  @IsString({ each: true })
  requiredFeatures?: string[]; // required truck features

  @IsOptional()
  @IsString({ each: true })
  preferredCarriers?: string[]; // preferred carrier IDs

  @IsOptional()
  @IsString({ each: true })
  excludedCarriers?: string[]; // excluded carrier IDs

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minCarrierRating?: number; // minimum carrier rating (0-1)

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxBudget?: number; // maximum budget for the load

  @IsOptional()
  @IsString()
  preferredPaymentTerms?: string; // preferred payment terms

  @IsOptional()
  @IsBoolean()
  requiresTracking?: boolean; // require GPS tracking

  @IsOptional()
  @IsBoolean()
  requiresInsurance?: boolean; // require insurance

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTransitTime?: number; // maximum transit time in hours

  @IsOptional()
  @IsBoolean()
  isTimeCritical?: boolean; // is this a time-critical load

  @IsOptional()
  @IsString()
  urgencyLevel?: string; // urgency level (LOW, NORMAL, HIGH, CRITICAL)

  @IsOptional()
  @IsBoolean()
  includeDetailedScoring?: boolean; // include detailed scoring breakdown

  @IsOptional()
  @IsBoolean()
  includeAlternativeMatches?: boolean; // include alternative matches

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxProcessingTime?: number; // maximum processing time in seconds
}
