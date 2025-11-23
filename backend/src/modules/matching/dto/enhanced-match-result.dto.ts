import { MatchResultDto } from './match-result.dto';

export interface EnhancedMatchResult extends MatchResultDto {
  // Additional scoring factors
  proximityScore: number;
  performanceScore: number;
  routeScore: number;
  fuelScore: number;
  timeScore: number;
  priceScore: number;

  // Seasonal and performance scores
  seasonalScore: number;
  driverPerformanceScore: number;
  equipmentCompatibilityScore: number;

  // Market context
  marketContext: {
    averageCost: number;
    costPercentile: number;
    availabilityPercentile: number;
    qualityPercentile: number;
    marketBalance: string;
  };

  // Environmental impact
  environmentalImpact: {
    co2Emissions: number;
    fuelConsumption: number;
    ecoScore: number;
  };

  // Risk assessment
  riskAssessment: {
    equipmentRisk: number;
    capacityRisk: number;
    ratingRisk: number;
    availabilityRisk: number;
    costRisk: number;
    totalRisk: number;
  };

  // Success probability
  successProbability: number;

  // Alternative matches
  alternativeMatches: EnhancedMatchResult[];
}
