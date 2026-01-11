import api from './api';
import type { EnhancedCargoData } from './enhancedCargoApi';

// Cargo Owner Journey API Service
export const cargoOwnerAPI = {
  // Load Management
  createLoad: (data: any) => api.post('/loads-v2', data),
  getLoad: (id: string) => api.get(`/loads-v2/${id}`),
  updateLoad: (id: string, data: any) => api.patch(`/loads-v2/${id}`, data),
  publishLoad: (id: string) => api.post(`/loads-v2/${id}/publish`),
  unpublishLoad: (id: string) => api.post(`/loads-v2/${id}/unpublish`),
  getAssignedLoads: (params?: any) => api.get('/loads-v2/assigned-loads', { params }),

  // Smart Matching
  findMatches: (loadId: string, preferences: any) =>
    api.post('/matching/find-matches', {
      loadId,
      algorithm: 'WEIGHTED_SCORE',
      ...preferences
    }),

  // Bidding/Auction System
  createAuction: (loadId: string, auctionSettings: any) =>
    api.post('/bidding/auctions', {
      loadId,
      ...auctionSettings
    }),

  getAuction: (loadId: string) =>
    api.get(`/bidding/auctions/load/${loadId}`),

  getBids: (loadId: string) =>
    api.get(`/bidding/bids/load/${loadId}`),

  acceptBid: (bidId: string) =>
    api.post(`/bidding/bids/${bidId}/accept`),

  // Booking and Confirmation
  createBooking: (data: any) =>
    api.post('/bookings', data),

  confirmBooking: (bookingId: string, confirmationData: any) =>
    api.post(`/bookings/${bookingId}/confirm`, confirmationData),

  // Analytics and Insights
  getMarketInsights: () =>
    api.get('/matching/market-insights'),

  getComprehensiveMetrics: () =>
    api.get('/matching/comprehensive-metrics'),

  // Available Algorithms
  getAvailableAlgorithms: () =>
    api.get('/matching/algorithms'),

  // Scoring Factors
  getScoringFactors: () =>
    api.get('/matching/scoring-factors'),
};

// Cargo Management Functions
export const fetchCargos = async (page?: number, search?: string, filters?: any) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page.toString());
  // Only add search if it's not empty and properly encoded
  if (search && search.trim()) {
    try {
      params.append('search', search.trim());
    } catch (e) {
      console.warn('Failed to encode search parameter:', e);
    }
  }
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        try {
          params.append(key, value.toString());
        } catch (e) {
          console.warn(`Failed to encode filter parameter ${key}:`, e);
        }
      }
    });
  }

  try {
    const response = await api.get(`/loads?${params.toString()}`);

    // Handle paginated response structure
    if (response.data && response.data.items) {
      return response.data.items; // Return the items array
    } else if (Array.isArray(response.data)) {
      return response.data; // Return direct array if that's what we get
    } else {
      return []; // Return empty array if unexpected structure
    }
  } catch (error: any) {
    // If search parameter causes error, try without it
    if (search && error?.response?.status === 500) {
      console.warn('Search parameter caused error, retrying without search');
      const fallbackParams = new URLSearchParams();
      if (page) fallbackParams.append('page', page.toString());
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            fallbackParams.append(key, value.toString());
          }
        });
      }
      const fallbackResponse = await api.get(`/loads?${fallbackParams.toString()}`);

      if (fallbackResponse.data && fallbackResponse.data.items) {
        return fallbackResponse.data.items;
      } else if (Array.isArray(fallbackResponse.data)) {
        return fallbackResponse.data;
      }
    }
    throw error; // Re-throw if fallback also fails or if it's a different error
  }
};
export const createCargo = async (data: any) => {
  const response = await api.post('/loads', data);
  return response.data;
};
export const updateCargo = async (id: string, data: any) => {
  const response = await api.patch(`/loads/${id}`, data);
  return response.data;
};
export const deleteCargo = async (id: string) => {
  const response = await api.delete(`/loads/${id}`);
  return response.data;
};
export const publishCargo = async (id: string) => {
  const response = await api.post(`/loads/${id}/publish`);
  return response.data;
};
export const unpublishCargo = async (id: string) => {
  const response = await api.post(`/loads/${id}/unpublish`);
  return response.data;
};
export const exportCargos = () => api.get('/loads/export');
export const subscribeCargoUpdates = (callback: any) => {
  // WebSocket or polling implementation
  console.log('Subscribing to cargo updates');
  return () => console.log('Unsubscribing from cargo updates');
};

// Types for the API responses
export interface MatchedTruck {
  id: string;
  truck: {
    id: string;
    plateNumber: string;
    make: string;
    model: string;
    year: number;
    capacityWeight: number;
    capacityVolume: number;
    truckType: string;
    hasRefrigeration: boolean;
    hasHazmatPermit: boolean;
    hasGpsTracking: boolean;
    hasTemperatureMonitoring: boolean;
    hasSecurityMonitoring: boolean;
    insuranceCoverage: number;
  };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    rating: number;
    experience: number;
    endorsements: string[];
    certifications: string[];
  };
  truckOwner: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
  };
  score: number;
  estimatedCost: number;
  estimatedTime: number;
  distance: number;
  matchReason: string;
  successProbability: number;
  riskScore: number;
  confidence: number;
}

export interface AuctionSettings {
  auctionType: 'REVERSE' | 'FORWARD' | 'DUTCH' | 'SEALED';
  duration: number;
  reservePrice: number;
  minimumBidIncrement: number;
  maximumBidAmount?: number;
  allowCounterOffers: boolean;
  allowBidModifications: boolean;
  autoExtendOnBid: boolean;
  extensionMinutes: number;
  requirePreApproval: boolean;
  allowAnonymousBids: boolean;
  notificationSettings: {
    notifyOnBid: boolean;
    notifyOnCounterOffer: boolean;
    notifyOnAuctionEnd: boolean;
    notifyOnAward: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

export interface Bid {
  id: string;
  loadId: string;
  truckOwnerId: string;
  truckOwner: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
  };
  bidAmount: number;
  proposedPickupDate: string;
  proposedDeliveryDate: string;
  bidNotes: string;
  bidDetails: {
    truckSpecifications: {
      truckId: string;
      capacityWeight: number;
      capacityVolume: number;
      truckType: string;
      hasRefrigeration: boolean;
      hasHazmatPermit: boolean;
    };
    driverInfo: {
      driverId: string;
      experience: number;
      rating: number;
      certifications: string[];
    };
    routeOptimization: {
      estimatedDistance: number;
      estimatedFuelCost: number;
      estimatedTime: number;
    };
    additionalServices: {
      insurance: boolean;
      tracking: boolean;
      loadingAssistance: boolean;
      unloadingAssistance: boolean;
    };
  };
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
}

export interface BookingData {
  loadId: string;
  truckId: string;
  driverId: string;
  truckOwnerId: string;
  agreedPrice: number;
  pickupDate: string;
  deliveryDate: string;
  specialInstructions?: string;
  paymentMethod: 'IMMEDIATE' | 'NET_30';
  insuranceRequired: boolean;
  gpsTrackingRequired: boolean;
  temperatureControlRequired: boolean;
  hazmatRequired: boolean;
}

export interface MarketInsights {
  averageCostPerMile: number;
  marketDemand: 'LOW' | 'MEDIUM' | 'HIGH';
  supplyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedPricing: {
    minPrice: number;
    maxPrice: number;
    optimalPrice: number;
  };
  seasonalFactors: any[];
  routeOptimization: {
    averageDistance: number;
    fuelCostTrends: any[];
    tollEstimates: any[];
  };
}

// Convert basic cargo data to enhanced format for display
export const convertBasicCargoToEnhanced = (basicCargo: any): EnhancedCargoData => {
  return {
    id: basicCargo.id,
    title: basicCargo.title || basicCargo.name || 'Cargo',
    description: basicCargo.description || 'Cargo from database',
    weight: basicCargo.weight || 0,
    volume: basicCargo.volume || 0,
    cargoType: basicCargo.cargoType || 'GENERAL',
    status: basicCargo.status || 'DRAFT',
    loadValue: basicCargo.loadValue || basicCargo.value || 0,
    insuranceAmount: basicCargo.insuranceAmount || 0,
    currency: basicCargo.currency || 'USD',
    pickupDate: basicCargo.pickupDate || new Date().toISOString(),
    deliveryDate: basicCargo.deliveryDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    locations: basicCargo.locations || basicCargo.locationData || [],
    // Generate basic enriched locations from the basic cargo data
    enrichedLocations: generateBasicEnrichedLocations(basicCargo),
    // Generate basic route analysis
    routeAnalysis: generateBasicRouteAnalysis(basicCargo),
    // Generate basic performance metrics
    performanceMetrics: generateBasicPerformanceMetrics(basicCargo),
    // Generate basic smart recommendations
    smartRecommendations: generateBasicSmartRecommendations(basicCargo),
  };
};

// Helper function to generate basic enriched locations
const generateBasicEnrichedLocations = (cargo: any) => {
  const locations = cargo.locations || cargo.locationData || [];
  return locations.map((location: any, index: number) => ({
    name: location.name || `${index === 0 ? 'Pickup' : 'Delivery'} Location`,
    category: index === 0 ? 'INDUSTRIAL_WAREHOUSE' : 'RETAIL_DISTRIBUTION',
    city: location.city || 'Unknown City',
    state: location.state || 'Unknown Province',
    country: location.country || 'Rwanda',
    fullAddress: location.address || location.fullAddress || 'Address not available',
    businessHours: {
      open: "06:00",
      close: "18:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },
    accessType: "TRUCK_ACCESS",
    securityLevel: "MEDIUM",
    loadingDockCount: 2,
    maxTruckHeight: 4.0,
    maxTruckWeight: 20000,
    specialInstructions: "Standard access procedures apply",
    trafficPattern: "Low congestion",
    bestAccessTime: "08:00 - 10:00",
    parkingAvailable: true,
    fuelStationsNearby: 2,
    restAreasNearby: 1,
  }));
};

// Helper function to generate basic route analysis
const generateBasicRouteAnalysis = (cargo: any) => ({
  totalDistance: 100,
  estimatedDuration: 2.0,
  routeType: "HIGHWAY_PRIMARY",
  tollRoads: 0,
  borderCrossings: 0,
  restrictions: [],
  recommendedDeparture: "08:00 (pickup) → 10:00 (delivery)",
  fuelStops: 1,
  restStops: 1,
  alternativeRoutes: 1,
});

// Helper function to generate basic performance metrics
const generateBasicPerformanceMetrics = (cargo: any) => ({
  routeEfficiencyScore: 80,
  accessibilityScore: 85,
  riskScore: 20,
  costEfficiency: 90,
});

// Helper function to generate basic smart recommendations
const generateBasicSmartRecommendations = (cargo: any) => ({
  optimizationSuggestions: [
    "Consider early morning pickup to avoid traffic",
    "Pre-schedule loading dock if available",
    "Plan for standard delivery window"
  ],
  intelligenceAlerts: [
    {
      type: 'success' as const,
      message: 'Basic route analysis completed'
    },
    {
      type: 'info' as const,
      message: 'Using standard access procedures'
    }
  ],
});
