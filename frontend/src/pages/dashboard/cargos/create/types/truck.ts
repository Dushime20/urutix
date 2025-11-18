export interface TruckMatch {
  truckId: string;
  loadId: string;
  overallScore: number;
  capacityScore: number;
  distanceScore: number;
  equipmentScore: number;
  ratingScore: number;
  priceScore: number;
  distanceKm: number;
  estimatedCost: number;
  estimatedRevenue: number;
  profitMargin: number;
  truckMake: string;
  truckModel: string;
  plateNumber: string;
  capacityWeight: number;
  capacityVolume: number;
  truckRating: number;
  hasRefrigeration: boolean;
  hasLiftGate: boolean;
  hasHazmatPermit: boolean;
  driverId?: string;
  driverName?: string;
  driverRating?: number;
  driverLicenseNumber?: string;
  matchReason: string;
  successProbability?: number;
  estimatedDeliveryTime?: number;
  estimatedPickupTime?: number;
  estimatedTransitTime?: number;
  totalEstimatedTime?: number;
  recommendedPrice?: number;
  confidence?: number;
  temperatureScore?: number;
  securityScore?: number;
  routeScore?: number;
  timeScore?: number;
  experienceScore?: number;
  availabilityScore?: number;
  specialRequirementsScore?: number;
  truckType?: string;
  fuelType?: string;
  truckAge?: number;
  mileage?: number;
  ownerName?: string;
  ownerRating?: number;
  fuelCost?: number;
  laborCost?: number;
  maintenanceCost?: number;
  insuranceCost?: number;
  tollsCost?: number;
  co2Emissions?: number;
  fuelConsumption?: number;
  ecoScore?: number;
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
  riskFactors?: {
    equipmentRisk: number;
    capacityRisk: number;
    ratingRisk: number;
    availabilityRisk: number;
    costRisk: number;
    totalRisk: number;
  };
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
  marketContext?: {
    averageCost: number;
    costPercentile: number;
    availabilityPercentile: number;
    qualityPercentile: number;
    marketBalance: string;
  };
  performanceMetrics?: {
    processingTime: number;
    algorithmUsed: string;
    confidenceLevel: number;
    dataQuality: number;
  };
  compliance?: {
    hasRequiredCertifications: boolean;
    insuranceCoverage: number;
    safetyRating: number;
    environmentalCompliance: boolean;
    regulatoryCompliance: boolean;
  };
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
  historicalPerformance?: {
    totalTrips: number;
    successfulDeliveries: number;
    onTimeDeliveries: number;
    averageRating: number;
    totalRevenue: number;
    fuelEfficiency: number;
  };
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
