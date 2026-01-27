import api from './api';

export interface EnhancedMatchingRequest {
  loadId: string;
  tenantId?: string;
}

export interface EnhancedMatchingScore {
  basicScore: number;
  cargoAlignmentScore: number;
  equipmentScore: number;
  securityScore: number;
  routeScore: number;
  costScore: number;
  overallScore: number;
  matchReason: string;
}

export interface CargoAlignmentResult {
  truckId: string;
  loadId: string;
  score: EnhancedMatchingScore;
  compatibility: {
    cargoTypes: boolean;
    temperature: boolean;
    dimensions: boolean;
    specialHandling: boolean;
    equipment: boolean;
    security: boolean;
  };
}

export interface CargoAlignmentAnalytics {
  totalTrucks: number;
  cargoTypeCoverage: {
    GENERAL: number;
    FRAGILE: number;
    HAZARDOUS: number;
    REFRIGERATED: number;
    LIQUID: number;
    OVERSIZED: number;
    VALUABLE: number;
  };
  equipmentCoverage: {
    forklift: number;
    crane: number;
    tailLift: number;
    sideLift: number;
  };
  securityFeatures: {
    gps: number;
    tracking: number;
    temperatureMonitoring: number;
    cargoMonitoring: number;
  };
  certifications: {
    hazmat: number;
    foodGrade: number;
    pharmaceutical: number;
  };
}

export const enhancedMatchingApi = {
  // Find enhanced matches for cargo alignment
  findEnhancedMatches: async (request: EnhancedMatchingRequest): Promise<CargoAlignmentResult[]> => {
    try {
      const response = await api.post('/matching/enhanced-cargo-alignment', request);
      return response.data.data;
    } catch (error) {
      console.error('Error finding enhanced matches:', error);
      throw error;
    }
  },

  // Get cargo alignment analytics
  getCargoAlignmentAnalytics: async (): Promise<CargoAlignmentAnalytics> => {
    try {
      const response = await api.get('/matching/cargo-alignment-analytics');
      return response.data.data;
    } catch (error) {
      console.error('Error getting cargo alignment analytics:', error);
      throw error;
    }
  },

  // Get truck recommendations for a specific cargo
  getTruckRecommendations: async (cargoType: string, requirements: any): Promise<any[]> => {
    try {
      const response = await api.post('/matching/truck-recommendations', {
        cargoType,
        requirements,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting truck recommendations:', error);
      throw error;
    }
  },

  // Get cargo compatibility analysis
  getCargoCompatibilityAnalysis: async (truckId: string, cargoRequirements: any): Promise<any> => {
    try {
      const response = await api.post('/matching/cargo-compatibility', {
        truckId,
        cargoRequirements,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting cargo compatibility analysis:', error);
      throw error;
    }
  },

  // Get matches for Truck Owner
  getTruckOwnerMatches: async (): Promise<any> => {
    try {
      const response = await api.get('/matching/truck-owner/matches');
      return response.data;
    } catch (error) {
      console.error('Error getting truck owner matches:', error);
      throw error;
    }
  },

  // Respond to a match
  respondToMatch: async (matchId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<any> => {
    try {
      const response = await api.patch(`/matching/${matchId}/respond`, { status });
      return response.data;
    } catch (error) {
      console.error('Error responding to match:', error);
      throw error;
    }
  },

  // Request a match (Cargo Owner)
  requestMatch: async (loadId: string, truckId: string): Promise<any> => {
    try {
      // Validate parameters before sending
      if (!loadId || !truckId) {
        console.error('❌ requestMatch called with missing parameters:', { loadId, truckId });
        throw new Error(`Missing required parameters: ${!loadId ? 'loadId' : ''} ${!truckId ? 'truckId' : ''}`);
      }

      console.log('✅ Requesting match:', { loadId, truckId });
      const response = await api.post('/matching/request', { loadId, truckId });
      console.log('✅ Match request response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error requesting match:', error);
      throw error;
    }
  },

  // Create trips for already-accepted matches (migration)
  createTripsForAcceptedMatches: async (): Promise<any> => {
    try {
      const response = await api.post('/matching/create-trips-for-accepted');
      return response.data;
    } catch (error) {
      console.error('Error creating trips for accepted matches:', error);
      throw error;
    }
  },

  // Create trip for a specific match
  createTripForMatch: async (matchId: string): Promise<any> => {
    try {
      const response = await api.post(`/matching/${matchId}/create-trip`);
      return response.data;
    } catch (error) {
      console.error('Error creating trip for match:', error);
      throw error;
    }
  }
};
