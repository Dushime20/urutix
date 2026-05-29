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
  // SMART MATCHING ENGINE v3 - 12 DIMENSION SCORING MODEL
  // =====================================================
  // Base 5 dimensions (always calculated with fixed weights)
  // 1. Capacity (30%) - Weight & volume utilization
  // 2. Equipment (25%) - Forklift, crane, reefer, hazmat compatibility
  // 3. Distance (20%) - Proximity to pickup location
  // 4. Availability (15%) - Truck status and next available time
  // 5. GPS Tracking (10%) - GPS availability for monitoring
  // =====================================================

  @IsNumber()
  capacityScore: number; // 0-1 scale - Weight & volume utilization (30%)

  @IsNumber()
  equipmentScore: number; // 0-1 scale - Required equipment compatibility (25%)

  @IsNumber()
  distanceScore: number; // 0-1 scale - Proximity to pickup (20%)

  @IsNumber()
  availabilityScore: number; // 0-1 scale - Truck availability status (15%)

  @IsNumber()
  gpsTrackingScore: number; // 0-1 scale - GPS availability for monitoring (10%)

  @IsNumber()
  routeScore: number; // 0-1 scale - Route compatibility (dynamic weight)

  // =====================================================
  // DYNAMIC 7 DIMENSIONS (weighted based on cargo type per FR-MATCH-001 to FR-MATCH-005)
  // 6. Temperature (0-35%) - Refrigeration match for temp-controlled cargo
  // 7. Security (0-20%) - GPS monitoring, insurance, camera systems
  // 8. Route Compatibility (0-15%) - Road type clearance, escort requirements
  // 9. Time (0-20%) - Urgency vs carrier availability window
  // 10. Experience (0-15%) - Track record with specific cargo type
  // 11. Rating (0-15%) - Historical performance score from prior trips
  // 12. Cost (0-15%) - Market-competitive pricing alignment
  // =====================================================

  @IsOptional()
  @IsNumber()
  temperatureScore?: number; // 0-1 scale - Temperature control match

  @IsOptional()
  @IsNumber()
  securityScore?: number; // 0-1 scale - Security features match

  @IsOptional()
  @IsNumber()
  timeScore?: number; // 0-1 scale - Time window compatibility

  @IsOptional()
  @IsNumber()
  experienceScore?: number; // 0-1 scale - Driver cargo experience

  @IsOptional()
  @IsNumber()
  ratingScore?: number; // 0-1 scale - Historical performance

  @IsOptional()
  @IsNumber()
  costScore?: number; // 0-1 scale - Price competitiveness

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
