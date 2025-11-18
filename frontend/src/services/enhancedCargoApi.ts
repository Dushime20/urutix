import api from './api';

export interface LocationIntelligence {
  name: string;
  category: string;
  city: string;
  state: string;
  country: string;
  fullAddress: string;
  businessHours: {
    open: string;
    close: string;
    days: string[];
  };
  accessType: string;
  securityLevel: string;
  loadingDockCount: number;
  maxTruckHeight: number;
  maxTruckWeight: number;
  specialInstructions: string;
  trafficPattern: string;
  bestAccessTime: string;
  parkingAvailable: boolean;
  fuelStationsNearby: number;
  restAreasNearby: number;
}

export interface RouteAnalysis {
  totalDistance: number;
  estimatedDuration: number;
  routeType: string;
  tollRoads: number;
  borderCrossings: number;
  restrictions: string[];
  recommendedDeparture: string;
  fuelStops: number;
  restStops: number;
  alternativeRoutes: number;
}

export interface CargoTruckCompatibility {
  routeCompatible: boolean;
  heightCompatible: boolean;
  weightCompatible: boolean;
  accessCompatible: boolean;
  compatibilityScore: number;
}

export interface EnhancedCargoData {
  id: string;
  title: string;
  description: string;
  weight: number;
  volume: number;
  cargoType: string;
  status: string;
  loadValue: number;
  insuranceAmount: number;
  currency: string;
  pickupDate: string;
  deliveryDate: string;
  locations: Array<{
    type: string;
    sequence: number;
    status: string;
    locationData: {
      name: string;
      address: string;
      coordinates: { latitude: number; longitude: number };
      contactInfo: { contactPerson: string; contactPhone: string; contactEmail: string };
      operatingHours: any;
      accessInstructions: string;
      specialInstructions: string;
    };
    requirements: {
      requiresCrane: boolean;
      hazmatCertified: boolean;
      requiresForklift: boolean;
      securityClearance: string;
      requiresLoadingDock: boolean;
      temperatureControlled: boolean;
    };
    estimatedTime: number;
    scheduledDate: string;
  }>;
  enrichedLocations?: LocationIntelligence[];
  routeAnalysis?: RouteAnalysis;
  truckCompatibility?: CargoTruckCompatibility;
  riskAssessment?: {
    lowRiskFactors: string[];
    mediumRiskFactors: string[];
    highRiskFactors: string[];
  };
  costOptimization?: {
    fuelEfficiency: string;
    tollCosts: number;
    additionalCosts: number;
    insuranceRecommendation: string;
  };
  performanceMetrics?: {
    routeEfficiencyScore: number;
    accessibilityScore: number;
    riskScore: number;
    costEfficiency: number;
  };
  smartRecommendations?: {
    optimizationSuggestions: string[];
    intelligenceAlerts: Array<{
      type: 'warning' | 'success' | 'info';
      message: string;
    }>;
  };
}

// Enhanced Cargo API Functions
export const getEnhancedCargo = async (cargoId: string): Promise<EnhancedCargoData> => {
  try {
    const response = await api.get(`/loads/${cargoId}/enriched-locations`);
    
    // Transform backend response to frontend format
    const backendData = response.data;
    const cargo = backendData.cargo;
    const enrichedLocations = backendData.enrichedLocations || [];
    
    // Transform enriched locations to LocationIntelligence format
    const transformedEnrichedLocations: LocationIntelligence[] = enrichedLocations.map((enrichedLocation: any) => ({
      name: enrichedLocation.locationData?.name || 'Unknown Location',
      category: enrichedLocation.locationData?.category || 'GENERAL',
      city: enrichedLocation.locationData?.city || 'Unknown City',
      state: enrichedLocation.locationData?.state || 'Unknown State',
      country: enrichedLocation.locationData?.country || 'Unknown Country',
      fullAddress: enrichedLocation.locationData?.fullAddress || 'Address not available',
      businessHours: enrichedLocation.locationData?.businessHours || { open: 'N/A', close: 'N/A', days: [] },
      accessType: enrichedLocation.locationData?.accessType || 'N/A',
      securityLevel: enrichedLocation.locationData?.securityLevel || 'N/A',
      loadingDockCount: enrichedLocation.locationData?.loadingDockCount || 0,
      maxTruckHeight: enrichedLocation.locationData?.maxTruckHeight || 0,
      maxTruckWeight: enrichedLocation.locationData?.maxTruckWeight || 0,
      specialInstructions: enrichedLocation.locationData?.specialInstructions || 'No special instructions',
      trafficPattern: enrichedLocation.locationData?.trafficPattern || 'N/A',
      bestAccessTime: enrichedLocation.locationData?.bestAccessTime || 'N/A',
      parkingAvailable: enrichedLocation.locationData?.parkingAvailable || false,
      fuelStationsNearby: enrichedLocation.locationData?.fuelStationsNearby || 0,
      restAreasNearby: enrichedLocation.locationData?.restAreasNearby || 0,
    }));
    
    // Create the enhanced cargo data object
    const enhancedCargoData: EnhancedCargoData = {
      id: cargo.id,
      title: cargo.title || 'Untitled Cargo',
      description: cargo.description || 'No description available',
      weight: cargo.weight || 0,
      volume: cargo.volume || 0,
      cargoType: cargo.cargoType || 'GENERAL',
      status: cargo.status || 'DRAFT',
      loadValue: cargo.loadValue || 0,
      insuranceAmount: cargo.insuranceAmount || 0,
      currency: cargo.currencyCode || 'USD',
      pickupDate: cargo.pickupDate || '',
      deliveryDate: cargo.deliveryDate || '',
      locations: cargo.locations || [],
      enrichedLocations: transformedEnrichedLocations,
      // Add default values for other enhanced fields
      routeAnalysis: {
        totalDistance: 0,
        estimatedDuration: 0,
        routeType: 'STANDARD',
        tollRoads: 0,
        borderCrossings: 0,
        restrictions: [],
        recommendedDeparture: 'N/A',
        fuelStops: 0,
        restStops: 0,
        alternativeRoutes: 0,
      },
      truckCompatibility: {
        routeCompatible: true,
        heightCompatible: true,
        weightCompatible: true,
        accessCompatible: true,
        compatibilityScore: 100,
      },
      riskAssessment: {
        lowRiskFactors: [],
        mediumRiskFactors: [],
        highRiskFactors: [],
      },
      costOptimization: {
        fuelEfficiency: 'Standard',
        tollCosts: 0,
        additionalCosts: 0,
        insuranceRecommendation: 'Standard coverage',
      },
      performanceMetrics: {
        routeEfficiencyScore: 85,
        accessibilityScore: 90,
        riskScore: 15,
        costEfficiency: 95,
      },
      smartRecommendations: {
        optimizationSuggestions: [],
        intelligenceAlerts: [],
      },
    };
    
    return enhancedCargoData;
  } catch (error) {
    console.error('Error fetching enhanced cargo:', error);
    throw error;
  }
};

export const getAllEnhancedCargos = async (): Promise<EnhancedCargoData[]> => {
  try {
    const response = await api.get('/loads/enriched-locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching enhanced cargos:', error);
    throw error;
  }
};

export const createEnhancedCargo = async (cargoData: any): Promise<EnhancedCargoData> => {
  try {
    const response = await api.post('/loads/enriched-locations', cargoData);
    return response.data;
  } catch (error) {
    console.error('Error creating enhanced cargo:', error);
    throw error;
  }
};

export const analyzeCargoRoute = async (cargoId: string): Promise<RouteAnalysis> => {
  try {
    const response = await api.get(`/loads/${cargoId}/route-analysis`);
    return response.data;
  } catch (error) {
    console.error('Error analyzing cargo route:', error);
    throw error;
  }
};

export const checkTruckCompatibility = async (cargoId: string, truckData: any): Promise<CargoTruckCompatibility> => {
  try {
    const response = await api.post(`/loads/${cargoId}/truck-compatibility`, truckData);
    return response.data;
  } catch (error) {
    console.error('Error checking truck compatibility:', error);
    throw error;
  }
};

export const getLocationSuggestions = async (coordinates: { latitude: number; longitude: number }): Promise<LocationIntelligence[]> => {
  try {
    const response = await api.get('/loads/location-suggestions', {
      params: coordinates
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    throw error;
  }
};

export const enrichCargoLocations = async (cargoId: string): Promise<EnhancedCargoData> => {
  try {
    const response = await api.post(`/loads/${cargoId}/enrich-locations`);
    return response.data;
  } catch (error) {
    console.error('Error enriching cargo locations:', error);
    throw error;
  }
};

export const batchEnrichCargos = async (cargoIds: string[]): Promise<EnhancedCargoData[]> => {
  try {
    const response = await api.post('/loads/batch-enrich-locations', { cargoIds });
    return response.data;
  } catch (error) {
    console.error('Error batch enriching cargos:', error);
    throw error;
  }
};

// Utility functions for enhanced cargo operations
export const calculateRouteEfficiency = (routeAnalysis: RouteAnalysis): number => {
  // Calculate efficiency based on distance, duration, and route type
  const baseEfficiency = 100;
  const distancePenalty = routeAnalysis.totalDistance * 0.1;
  const durationPenalty = routeAnalysis.estimatedDuration * 5;
  const restrictionPenalty = routeAnalysis.restrictions.length * 10;
  
  return Math.max(0, Math.min(100, baseEfficiency - distancePenalty - durationPenalty - restrictionPenalty));
};

export const calculateRiskScore = (routeAnalysis: RouteAnalysis, enrichedLocations: LocationIntelligence[]): number => {
  let riskScore = 0;
  
  // Route-based risks
  if (routeAnalysis.tollRoads > 0) riskScore += 10;
  if (routeAnalysis.borderCrossings > 0) riskScore += 20;
  if (routeAnalysis.restrictions.length > 0) riskScore += 15;
  
  // Location-based risks
  enrichedLocations.forEach(location => {
    if (location.securityLevel === 'HIGH') riskScore += 5;
    if (location.trafficPattern.includes('High')) riskScore += 10;
    if (!location.parkingAvailable) riskScore += 15;
  });
  
  return Math.min(100, riskScore);
};

export const generateSmartRecommendations = (
  routeAnalysis: RouteAnalysis,
  enrichedLocations: LocationIntelligence[],
  truckCompatibility: CargoTruckCompatibility
): {
  optimizationSuggestions: string[];
  intelligenceAlerts: Array<{ type: 'warning' | 'success' | 'info'; message: string }>;
} => {
  const suggestions: string[] = [];
  const alerts: Array<{ type: 'warning' | 'success' | 'info'; message: string }> = [];
  
  // Route optimization suggestions
  if (routeAnalysis.estimatedDuration > 4) {
    suggestions.push('Consider alternative route to reduce travel time');
  }
  
  if (routeAnalysis.tollRoads > 0) {
    suggestions.push('Plan for toll costs in budget');
  }
  
  // Location-based suggestions
  enrichedLocations.forEach((location, index) => {
    if (location.trafficPattern.includes('High')) {
      suggestions.push(`Schedule ${index === 0 ? 'pickup' : 'delivery'} during off-peak hours`);
    }
    
    if (!location.parkingAvailable) {
      alerts.push({
        type: 'warning',
        message: `${index === 0 ? 'Pickup' : 'Delivery'} location has limited parking`
      });
    }
    
    if (location.fuelStationsNearby < 2) {
      alerts.push({
        type: 'info',
        message: `Limited fuel stations near ${index === 0 ? 'pickup' : 'delivery'} location`
      });
    }
  });
  
  // Compatibility alerts
  if (!truckCompatibility.routeCompatible) {
    alerts.push({
      type: 'warning',
      message: 'Truck may not be compatible with route requirements'
    });
  } else {
    alerts.push({
      type: 'success',
      message: 'Truck compatibility confirmed for all locations'
    });
  }
  
  return { optimizationSuggestions: suggestions, intelligenceAlerts: alerts };
}; 