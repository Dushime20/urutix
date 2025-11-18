// Export all types from individual type files
export * from './cargo';
export * from './fleet';
export * from './apiResponse';
export * from './tenant';
export * from './loanRequest';

// Core interfaces for matching system

export interface Truck {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  capacityWeight: number;
  capacityVolume?: number;
  truckType: string;
  status: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  fuelEfficiency?: number;
  truckRating?: number;
  hasRefrigeration?: boolean;
  hasLiftGate?: boolean;
  hazardousMaterialsCertified?: boolean;
  hasCushioning?: boolean;
  hasForklift?: boolean;
  hasCrane?: boolean;
  temperatureControlPrecision?: number;
  estimatedAvailableTime?: Date;
  currentDriverId?: string;
  
  // Capabilities
  cargoCapabilities?: Array<{
    type: string;
    maxWeight?: number;
    maxVolume?: number;
    maxFragileHandling?: boolean;
    maxHazardousHandling?: boolean;
    maxRefrigeratedHandling?: boolean;
  }>;
  
  loadingCapabilities?: Array<{
    type: string;
    description?: string;
  }>;
  
  securityFeatures?: Array<{
    type: string;
    description?: string;
    hasGps?: boolean;
  }>;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: string;
  availabilityStatus: string;
  currentLocation?: string;
  rating: number;
  safetyScore: number;
  totalTrips: number;
  totalDistance: number;
  totalEarnings: number;
  hoursWorkedThisWeek: number;
  hoursWorkedThisMonth: number;
  consecutiveDrivingHours: number;
  onTimeDeliveryRate: number;
  yearsOfExperience?: number;
  driverRating?: number;
  endorsements?: string[];
  customerSatisfactionRating?: number;
  vehicleMaintenanceScore?: number;
}

// Matching system specific types
export interface MatchResult {
  truckId: string;
  driverId: string;
  overallScore: number;
  capacityScore: number;
  proximityScore: number;
  performanceScore: number;
  routeScore: number;
  fuelScore: number;
  timeScore: number;
  priceScore: number;
  estimatedCost: number;
  estimatedTime: number;
  distance: number;
  truck: Truck;
  driver: Driver;
  marketContext?: {
    currentDemand: number;
    priceTrend: 'rising' | 'falling' | 'stable';
    regionalFactors: string[];
  };
  environmentalImpact?: {
    carbonFootprint: number;
    fuelEfficiency: number;
    routeOptimization: number;
  };
  riskAssessment?: {
    overallRisk: number;
    riskFactors: string[];
    mitigationStrategies: string[];
  };
  successProbability?: number;
}

export interface MatchRequest {
  loadId: string;
  algorithm?: string;
  limit?: number;
  maxDistance?: number;
  minRating?: number;
  preferredTruckType?: string;
  maxTruckAge?: number;
  isTimeCritical?: boolean;
  maxTransitTime?: number;
  minCompatibilityScore?: number;
  includeDetailedScoring?: boolean;
  includeEnvironmentalImpact?: boolean;
  includeRiskAnalysis?: boolean;
  includeSuccessProbability?: boolean;
  includeAlternativeMatches?: boolean;
}

// Type aliases for backward compatibility
export interface Load extends Cargo {}
