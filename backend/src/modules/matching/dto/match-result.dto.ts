import {
  IsUUID,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class MatchResultDto {
  @IsUUID()
  truckId: string;

  @IsUUID()
  loadId: string;

  @IsNumber()
  overallScore: number; // 0-1 scale

  // =====================================================
  // 6 CORE MATCHING CRITERIA SCORES
  // =====================================================

  @IsNumber()
  capacityScore: number; // 0-1 scale - Weight & volume utilization

  @IsNumber()
  equipmentScore: number; // 0-1 scale - Required equipment compatibility

  @IsNumber()
  distanceScore: number; // 0-1 scale - Proximity to pickup

  @IsNumber()
  gpsTrackingScore: number; // 0-1 scale - GPS availability for monitoring

  @IsNumber()
  availabilityScore: number; // 0-1 scale - Truck availability status

  @IsNumber()
  routeScore: number; // 0-1 scale - Route compatibility (origin/destination match)

  // =====================================================
  // LEGACY SCORES (Optional - kept for backward compatibility)
  // =====================================================

  @IsOptional()
  @IsNumber()
  ratingScore?: number; // 0-1 scale

  @IsOptional()
  @IsNumber()
  priceScore?: number; // 0-1 scale

  // =====================================================
  // METRICS & ESTIMATES
  // =====================================================

  @IsNumber()
  distanceKm: number;

  @IsNumber()
  estimatedCost: number;

  @IsNumber()
  estimatedRevenue: number;

  @IsNumber()
  profitMargin: number;

  @IsString()
  truckMake: string;

  @IsString()
  truckModel: string;

  @IsString()
  plateNumber: string;

  @IsNumber()
  capacityWeight: number;

  @IsNumber()
  capacityVolume: number;

  @IsNumber()
  truckRating: number;

  @IsBoolean()
  hasRefrigeration: boolean;

  @IsBoolean()
  hasLiftGate: boolean;

  @IsBoolean()
  hasHazmatPermit: boolean;

  @IsOptional()
  @IsBoolean()
  hasGps?: boolean; // NEW: GPS availability

  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsNumber()
  driverRating?: number;

  @IsOptional()
  @IsString()
  driverLicenseNumber?: string;

  @IsString()
  matchReason: string; // explanation of why this match was selected

  @IsOptional()
  @IsNumber()
  successProbability?: number;

  @IsOptional()
  @IsNumber()
  estimatedDeliveryTime?: number;

  @IsOptional()
  @IsNumber()
  riskScore?: number;

  @IsOptional()
  @IsNumber()
  recommendedPrice?: number;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  // Enhanced scoring factors
  @IsOptional()
  @IsNumber()
  temperatureScore?: number; // 0-1 scale

  @IsOptional()
  @IsNumber()
  securityScore?: number; // 0-1 scale

  @IsOptional()
  @IsNumber()
  timeScore?: number; // 0-1 scale

  @IsOptional()
  @IsNumber()
  experienceScore?: number; // 0-1 scale

  // NOTE: availabilityScore and routeScore are now core criteria, not optional

  @IsOptional()
  @IsNumber()
  specialRequirementsScore?: number; // 0-1 scale

  // Additional truck information
  @IsOptional()
  @IsString()
  truckType?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsNumber()
  truckAge?: number; // in years

  @IsOptional()
  @IsNumber()
  mileage?: number;

  @IsOptional()
  @IsString()
  ownerName?: string;

  @IsOptional()
  @IsString()
  ownerRating?: number;

  // Route and timing information
  @IsOptional()
  @IsNumber()
  estimatedPickupTime?: number; // hours from now

  @IsOptional()
  @IsNumber()
  estimatedTransitTime?: number; // hours

  @IsOptional()
  @IsNumber()
  totalEstimatedTime?: number; // total hours

  // Cost breakdown
  @IsOptional()
  @IsNumber()
  fuelCost?: number;

  @IsOptional()
  @IsNumber()
  laborCost?: number;

  @IsOptional()
  @IsNumber()
  maintenanceCost?: number;

  @IsOptional()
  @IsNumber()
  insuranceCost?: number;

  @IsOptional()
  @IsNumber()
  tollsCost?: number;

  // Environmental impact
  @IsOptional()
  @IsNumber()
  co2Emissions?: number; // kg CO2

  @IsOptional()
  @IsNumber()
  fuelConsumption?: number; // liters

  @IsOptional()
  @IsNumber()
  ecoScore?: number; // 0-1 scale

  // Route optimization
  @IsOptional()
  routeInfo?: {
    distance: number;
    duration: number;
    tolls: number;
    fuelCost: number;
    waypoints: Array<{
      latitude: number;
      longitude: number;
      name: string;
    }>;
  };

  // Risk analysis
  @IsOptional()
  riskFactors?: {
    equipmentRisk: number;
    capacityRisk: number;
    ratingRisk: number;
    availabilityRisk: number;
    costRisk: number;
    totalRisk: number;
  };

  // Detailed scoring breakdown
  @IsOptional()
  scoringBreakdown?: {
    dimensionalCompatibility: number;
    capacityUtilization: number;
    equipmentMatch: number;
    temperatureControl: number;
    securityRequirements: number;
    routeCompatibility: number;
    timeCompatibility: number;
    distance: number;
    reliability: number;
    costEfficiency: number;
  };

  // Alternative matches (if requested)
  @IsOptional()
  alternativeMatches?: MatchResultDto[];

  // Market context
  @IsOptional()
  marketContext?: {
    averageCost: number;
    costPercentile: number; // 0-100
    availabilityPercentile: number; // 0-100
    qualityPercentile: number; // 0-100
    marketBalance: string; // 'Truck Surplus' | 'Load Surplus' | 'Balanced'
  };

  // Performance metrics
  @IsOptional()
  performanceMetrics?: {
    processingTime: number; // milliseconds
    algorithmUsed: string;
    confidenceLevel: number; // 0-1
    dataQuality: number; // 0-1
  };

  // Compliance and certifications
  @IsOptional()
  compliance?: {
    hasRequiredCertifications: boolean;
    insuranceCoverage: number;
    safetyRating: number;
    environmentalCompliance: boolean;
    regulatoryCompliance: boolean;
  };

  // Special handling capabilities
  @IsOptional()
  specialCapabilities?: {
    hasTemperatureControl: boolean;
    hasHumidityControl: boolean;
    hasShockMonitoring: boolean;
    hasTiltMonitoring: boolean;
    hasDoorMonitoring: boolean;
    hasCargoMonitoring: boolean;
    hasWeightMonitoring: boolean;
    hasVolumeMonitoring: boolean;
  };

  // Historical performance
  @IsOptional()
  historicalPerformance?: {
    totalTrips: number;
    successfulDeliveries: number;
    onTimeDeliveries: number;
    averageRating: number;
    totalRevenue: number;
    fuelEfficiency: number;
  };

  // Real-time status
  @IsOptional()
  realTimeStatus?: {
    currentLocation: {
      latitude: number;
      longitude: number;
    };
    lastUpdated: Date;
    estimatedAvailableTime: Date;
    currentStatus: string;
    isOnline: boolean;
  };
}
