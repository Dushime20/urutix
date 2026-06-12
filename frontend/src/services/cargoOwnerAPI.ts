import api from './api';

// Cargo Owner Journey API Service
export const cargoOwnerAPI = {
  // Load Management
  createLoad: (data: any) => api.post('/loads-v2', data),
  getLoad: (id: string) => api.get(`/loads-v2/${id}`),
  updateLoad: (id: string, data: any) => api.patch(`/loads-v2/${id}`, data),
  publishLoad: (id: string) => api.post(`/loads-v2/${id}/publish`),
  unpublishLoad: (id: string) => api.post(`/loads-v2/${id}/unpublish`),

  // Smart Matching
  findMatches: (loadId: string, preferences: any) =>
    api.post('/matching/find-matches', {
      loadId,
      algorithm: 'WEIGHTED_SCORE',
      ...preferences
    }),

  // Get top-5 POTENTIAL candidates for a specific load (FRS §6.8)
  getCandidatesForLoad: (loadId: string) =>
    api.get(`/matching/cargo-owner/candidates/${loadId}`),

  // Send a match request to a specific truck (cargo owner selects from candidates)
  requestMatch: (loadId: string, truckId: string) =>
    api.post('/matching/request', { loadId, truckId }),

  // Bidding/Auction System
  createAuction: (loadId: string, auctionSettings: any) =>
    api.post('/bidding/auctions', {
      loadId,
      ...auctionSettings
    }),

  getAuction: (loadId: string) =>
    api.get(`/bidding/loads/${loadId}/auction`),

  getBids: (loadId: string) =>
    api.get(`/bidding/loads/${loadId}/bids`),

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

  // Dashboard Analytics
  getDashboardAnalytics: (period: string = '30d') => 
    api.get('/loads-v2/analytics/dashboard', { params: { period } }),
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
  estimatedRevenue: number;
  profitMargin: number;
  routeDistanceKm: number;
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