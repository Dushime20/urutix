import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CarrierIntelligenceService {
  private readonly logger = new Logger(CarrierIntelligenceService.name);
  
  // cargo_owner_analytics table not yet migrated — returning stubs until available

  async getCarrierRankings(_tenantId: string) { 
    return []; 
  }
  
  async getCarrierPerformance(_tenantId: string, _carrierId: string) { 
    return {}; 
  }

  async analyzeCarrierPerformance(_tenantId: string, _userId: string, _period?: string) {
    // Return empty array with correct structure until analytics table is available
    return [];
  }

  async getCarrierRecommendationsForRoute(_tenantId: string, _userId: string, _routeHash: string) {
    return { recommendations: [], reason: 'Analytics table not yet available' };
  }
}
