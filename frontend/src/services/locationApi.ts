import api from './api';

export interface LocationIntelligence {
  locationId: string;
  name: string;
  fullAddress: string;
  locationCategory: string;
  accessType: string;
  businessHours: string;
  specialInstructions: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  operationalInfo: {
    isOperational: boolean;
    parkingAvailable: boolean;
    loadingDockCount: number;
    maxTruckHeight: number;
    maxTruckWeight: number;
    securityLevel: string;
  };
  routeOptimization: {
    distanceFromHighway: number;
    trafficPattern: string;
    bestAccessTime: string;
    restrictions: string[];
  };
}

export interface LocationSearchCriteria {
  city?: string;
  state?: string;
  country?: string;
  locationCategory?: string;
  accessType?: string;
  hasParking?: boolean;
  hasLoadingDock?: boolean;
  maxTruckHeight?: number;
  maxTruckWeight?: number;
  isOperational?: boolean;
}

export interface LocationStatistics {
  totalLocations: number;
  operationalLocations: number;
  categories: Array<{ category: string; count: number; percentage: number }>;
  accessTypes: Array<{ type: string; count: number; percentage: number }>;
  topCities: Array<{ city: string; count: number }>;
}

// Location Intelligence API
export const getLocationIntelligence = async (locationId: string): Promise<LocationIntelligence> => {
  const response = await api.get(`/locations/intelligence/${locationId}`);
  return response.data;
};

// Location Search API
export const searchLocations = async (criteria: LocationSearchCriteria): Promise<any[]> => {
  const params = new URLSearchParams();
  Object.entries(criteria).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });
  
  const response = await api.get(`/locations/search?${params.toString()}`);
  return response.data;
};

// Popular Locations API
export const getPopularLocations = async (limit: number = 10): Promise<any[]> => {
  const response = await api.get(`/locations/popular?limit=${limit}`);
  return response.data;
};

// Location Categories API
export const getLocationCategories = async (): Promise<Array<{ category: string; count: number }>> => {
  const response = await api.get('/locations/categories');
  return response.data;
};

// Location Statistics API
export const getLocationStatistics = async (): Promise<LocationStatistics> => {
  const response = await api.get('/locations/statistics');
  return response.data;
};

// Location Validation API
export const validateLocationData = async (locationData: any): Promise<{
  isValid: boolean;
  suggestions: string[];
  warnings: string[];
}> => {
  const response = await api.post('/locations/validate', locationData);
  return response.data;
};

// Enhanced Location Management
export const createLocation = async (locationData: any): Promise<any> => {
  const response = await api.post('/locations', locationData);
  return response.data;
};

export const updateLocation = async (id: string, locationData: any): Promise<any> => {
  const response = await api.patch(`/locations/${id}`, locationData);
  return response.data;
};

export const deleteLocation = async (id: string): Promise<void> => {
  await api.delete(`/locations/${id}`);
};

export const getLocation = async (id: string): Promise<any> => {
  const response = await api.get(`/locations/${id}`);
  return response.data;
};

export const getAllLocations = async (): Promise<any[]> => {
  const response = await api.get('/locations');
  return response.data;
};

// Location Intelligence Utilities
export const getLocationCompatibility = (truck: any, location: any): {
  isCompatible: boolean;
  issues: string[];
  score: number;
} => {
  const issues: string[] = [];
  let score = 100;

  // Check truck height constraints
  if (truck.height > (location.maxTruckHeight || 4.5)) {
    issues.push(`Truck height (${truck.height}m) exceeds location limit (${location.maxTruckHeight || 4.5}m)`);
    score -= 30;
  }

  // Check weight constraints
  if (truck.capacityWeight > (location.maxTruckWeight || 20)) {
    issues.push(`Truck weight capacity (${truck.capacityWeight} kg) exceeds location limit (${location.maxTruckWeight || 20} kg)`);
    score -= 25;
  }

  // Check access type compatibility
  if (location.accessType === 'FORKLIFT_REQUIRED' && !truck.hasForklift) {
    issues.push('Location requires forklift but truck doesn\'t have one');
    score -= 20;
  }

  if (location.accessType === 'CRANE_REQUIRED' && !truck.hasCrane) {
    issues.push('Location requires crane but truck doesn\'t have one');
    score -= 20;
  }

  // Check security requirements
  if (location.securityLevel === 'HIGH_SECURITY' && !truck.hasSecurityClearance) {
    issues.push('Location requires security clearance but truck doesn\'t have it');
    score -= 15;
  }

  // Check parking requirements
  if (!location.parkingAvailable && truck.requiresParking) {
    issues.push('Location has no parking but truck requires it');
    score -= 10;
  }

  return {
    isCompatible: score >= 70,
    issues,
    score: Math.max(0, score)
  };
};

// Location Route Optimization
export const optimizeRoute = (locations: any[]): {
  optimalPickupTime: string;
  optimalDeliveryTime: string;
  routeSegments: any[];
  totalRestrictions: string[];
  estimatedTransitTime: number;
} => {
  const pickupLocation = locations.find(l => l.type === 'PICKUP');
  const deliveryLocation = locations.find(l => l.type === 'DELIVERY');

  const routeSegments = locations.map(location => ({
    locationId: location.id,
    bestAccessTime: location.routeOptimization?.bestAccessTime || '8AM-6PM',
    trafficPattern: location.routeOptimization?.trafficPattern || 'MODERATE',
    restrictions: location.routeOptimization?.restrictions || []
  }));

  const totalRestrictions = locations
    .flatMap(l => l.routeOptimization?.restrictions || [])
    .filter((r, i, arr) => arr.indexOf(r) === i);

  // Calculate optimal times based on business hours
  const optimalPickupTime = pickupLocation?.businessHours || '8AM-6PM';
  const optimalDeliveryTime = deliveryLocation?.businessHours || '8AM-6PM';

  // Estimate transit time (simplified calculation)
  const estimatedTransitTime = locations.length * 2; // 2 hours per location

  return {
    optimalPickupTime,
    optimalDeliveryTime,
    routeSegments,
    totalRestrictions,
    estimatedTransitTime
  };
}; 