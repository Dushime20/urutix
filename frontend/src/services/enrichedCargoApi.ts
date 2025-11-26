import api from './api';

export interface EnrichedLocation {
  id: string;
  type: 'PICKUP' | 'DELIVERY' | 'STOP';
  sequence: number;
  locationData: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    // Enhanced location intelligence
    city: string;
    state: string;
    country: string;
    locationCategory: string;
    locationSubCategory: string;
    businessHours: string;
    timezone: string;
    accessType: string;
    parkingAvailable: boolean;
    securityLevel: string;
    loadingDockCount: number;
    maxTruckHeight: number;
    maxTruckWeight: number;
    specialInstructions: string;
    // Route optimization
    distanceFromHighway: number;
    trafficPattern: string;
    bestAccessTime: string;
    restrictions: string[];
  };
  scheduledDate: Date;
  estimatedTime: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface RouteAnalysis {
  totalDistance: number;
  estimatedDuration: number;
  restrictions: string[];
  optimalSchedule: {
    pickupTime: string;
    deliveryTime: string;
    stops: Array<{
      locationId: string;
      name: string;
      bestAccessTime: string;
      restrictions: string[];
    }>;
  };
}

export interface CargoTruckCompatibility {
  isCompatible: boolean;
  score: number;
  issues: string[];
  locationCompatibility: Array<{
    locationId: string;
    locationName: string;
    isCompatible: boolean;
    issues: string[];
  }>;
}

// Get cargo with enriched location data
export const getCargoWithEnrichedLocations = async (cargoId: string): Promise<{
  cargo: any;
  enrichedLocations: EnrichedLocation[];
}> => {
  const response = await api.get(`/loads-v2/${cargoId}/enriched-locations`);
  return response.data;
};

// Get all cargos with enriched location data
export const getAllCargosWithEnrichedLocations = async (): Promise<{
  cargos: any[];
  enrichedLocationsMap: Map<string, EnrichedLocation[]>;
}> => {
  const response = await api.get('/loads-v2/enriched-locations');
  return response.data;
};

// Create cargo with automatic location enrichment
export const createCargoWithEnrichedLocations = async (cargoData: any): Promise<{
  cargo: any;
  enrichedLocations: EnrichedLocation[];
}> => {
  const response = await api.post('/loads-v2/enriched-locations', cargoData);
  return response.data;
};

// Get location suggestions for cargo creation
export const getLocationSuggestionsForCargo = async (
  coordinates: { latitude: number; longitude: number },
  locationType: 'PICKUP' | 'DELIVERY' | 'STOP'
): Promise<any[]> => {
  const response = await api.get('/loads-v2/location-suggestions', {
    params: {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      locationType
    }
  });
  return response.data;
};

// Analyze cargo route with enriched location data
export const analyzeCargoRoute = async (cargoId: string): Promise<{
  cargo: any;
  enrichedLocations: EnrichedLocation[];
  routeAnalysis: RouteAnalysis;
}> => {
  const response = await api.get(`/loads-v2/${cargoId}/route-analysis`);
  return response.data;
};

// Get cargo compatibility with trucks based on enriched location data
export const getCargoTruckCompatibility = async (
  cargoId: string,
  truckData: any
): Promise<CargoTruckCompatibility> => {
  const response = await api.post(`/loads-v2/${cargoId}/truck-compatibility`, truckData);
  return response.data;
};

// Enrich existing cargo locations
export const enrichExistingCargoLocations = async (cargoId: string): Promise<{
  cargo: any;
  enrichedLocations: EnrichedLocation[];
}> => {
  const response = await api.post(`/loads-v2/${cargoId}/enrich-locations`);
  return response.data;
};

// Batch enrich multiple cargo locations
export const batchEnrichCargoLocations = async (cargoIds: string[]): Promise<{
  results: Map<string, EnrichedLocation[]>;
  summary: {
    totalCargos: number;
    totalLocations: number;
    enrichedLocations: number;
    errors: string[];
  };
}> => {
  const response = await api.post('/loads-v2/batch-enrich-locations', { cargoIds });
  return response.data;
};

// Get location intelligence for a specific cargo location
export const getCargoLocationIntelligence = async (
  cargoId: string,
  locationId: string
): Promise<any> => {
  const response = await api.get(`/loads-v2/${cargoId}/locations/${locationId}/intelligence`);
  return response.data;
};

// Update cargo location with enriched data
export const updateCargoLocationWithEnrichedData = async (
  cargoId: string,
  locationId: string,
  enrichedData: Partial<EnrichedLocation>
): Promise<EnrichedLocation> => {
  const response = await api.patch(`/loads-v2/${cargoId}/locations/${locationId}`, enrichedData);
  return response.data;
};

// Get cargo route optimization suggestions
export const getCargoRouteOptimization = async (cargoId: string): Promise<{
  currentRoute: EnrichedLocation[];
  optimizedRoute: EnrichedLocation[];
  improvements: {
    distanceReduction: number;
    timeReduction: number;
    costReduction: number;
    restrictionsReduction: number;
  };
  suggestions: string[];
}> => {
  const response = await api.get(`/loads-v2/${cargoId}/route-optimization`);
  return response.data;
};

// Validate cargo route with enriched location data
export const validateCargoRoute = async (cargoId: string): Promise<{
  isValid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
  compatibilityScore: number;
}> => {
  const response = await api.get(`/loads-v2/${cargoId}/route-validation`);
  return response.data;
};

// Get cargo location statistics
export const getCargoLocationStatistics = async (cargoId: string): Promise<{
  totalLocations: number;
  pickupLocations: number;
  deliveryLocations: number;
  stopLocations: number;
  locationCategories: Array<{ category: string; count: number }>;
  accessTypes: Array<{ type: string; count: number }>;
  securityLevels: Array<{ level: string; count: number }>;
  trafficPatterns: Array<{ pattern: string; count: number }>;
  totalRestrictions: number;
  averageDistanceFromHighway: number;
}> => {
  const response = await api.get(`/loads-v2/${cargoId}/location-statistics`);
  return response.data;
};

// Export enriched cargo data
export const exportEnrichedCargoData = async (cargoId: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<any> => {
  const response = await api.get(`/loads-v2/${cargoId}/export`, {
    params: { format },
    responseType: format === 'json' ? 'json' : 'blob'
  });
  return response.data;
};

// Utility functions for enriched cargo data
export const calculateRouteEfficiency = (enrichedLocations: EnrichedLocation[]): {
  efficiency: number;
  factors: {
    distance: number;
    traffic: number;
    restrictions: number;
    access: number;
  };
} => {
  let efficiency = 100;
  const factors = {
    distance: 0,
    traffic: 0,
    restrictions: 0,
    access: 0
  };

  // Calculate distance factor
  const totalDistance = enrichedLocations.length * 50; // Simplified
  factors.distance = Math.max(0, 100 - (totalDistance / 10));

  // Calculate traffic factor
  const trafficScores = enrichedLocations.map(loc => {
    switch (loc.locationData.trafficPattern) {
      case 'HIGH': return 60;
      case 'MODERATE': return 80;
      case 'LOW': return 100;
      default: return 80;
    }
  });
  factors.traffic = trafficScores.reduce((sum, score) => sum + score, 0) / trafficScores.length;

  // Calculate restrictions factor
  const totalRestrictions = enrichedLocations.reduce((sum, loc) => sum + loc.locationData.restrictions.length, 0);
  factors.restrictions = Math.max(0, 100 - (totalRestrictions * 10));

  // Calculate access factor
  const accessScores = enrichedLocations.map(loc => {
    switch (loc.locationData.accessType) {
      case 'TRUCK_ACCESSIBLE': return 100;
      case 'DOCKS_AVAILABLE': return 90;
      case 'FORKLIFT_REQUIRED': return 70;
      case 'CRANE_REQUIRED': return 60;
      default: return 80;
    }
  });
  factors.access = accessScores.reduce((sum, score) => sum + score, 0) / accessScores.length;

  // Calculate overall efficiency
  efficiency = (factors.distance + factors.traffic + factors.restrictions + factors.access) / 4;

  return { efficiency, factors };
};

export const getLocationCompatibilityScore = (location: EnrichedLocation, truckData: any): {
  score: number;
  issues: string[];
  isCompatible: boolean;
} => {
  let score = 100;
  const issues: string[] = [];

  // Check height constraints
  if (truckData.height > location.locationData.maxTruckHeight) {
    score -= 30;
    issues.push(`Truck height (${truckData.height}m) exceeds limit (${location.locationData.maxTruckHeight}m)`);
  }

  // Check weight constraints
  if (truckData.capacityWeight > location.locationData.maxTruckWeight) {
    score -= 25;
    issues.push(`Truck weight capacity (${truckData.capacityWeight} kg) exceeds limit (${location.locationData.maxTruckWeight} kg)`);
  }

  // Check access requirements
  if (location.locationData.accessType === 'FORKLIFT_REQUIRED' && !truckData.hasForklift) {
    score -= 20;
    issues.push('Location requires forklift');
  }

  if (location.locationData.accessType === 'CRANE_REQUIRED' && !truckData.hasCrane) {
    score -= 20;
    issues.push('Location requires crane');
  }

  // Check security requirements
  if (location.locationData.securityLevel === 'HIGH_SECURITY' && !truckData.hasSecurityClearance) {
    score -= 15;
    issues.push('Location requires security clearance');
  }

  return {
    score: Math.max(0, score),
    issues,
    isCompatible: score >= 70
  };
}; 