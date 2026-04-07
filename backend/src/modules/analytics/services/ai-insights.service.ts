import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsInsights } from '../../../entities/analytics-insights.entity';

@Injectable()
export class AIInsightsService {
  private readonly logger = new Logger(AIInsightsService.name);

  constructor(
    @InjectRepository(AnalyticsInsights)
    private insightsRepository: Repository<AnalyticsInsights>,
  ) {}

  // cargo_owner_analytics table not yet migrated — returning stubs until available

  async generateCostPredictions(_tenantId: string, _cargoOwnerId: string, _routeHash?: string, _horizonDays = 30) {
    return { prediction: null, confidence: 0, reason: 'Analytics table not yet available' };
  }

  async generateCarrierPredictions(_tenantId: string, _cargoOwnerId: string, _carrierId: string) {
    return { trend: 'stable', confidence: 0, reason: 'Analytics table not yet available' };
  }

  async getInsights(tenantId: string) {
    return this.insightsRepository.find({ where: { tenantId } }).catch(() => []);
  }

  async generateComprehensiveInsights(_tenantId: string, _userId: string) {
    return { insights: [], reason: 'Analytics table not yet available' };
  }

  async generateDemandForecasts(_tenantId: string, _userId: string, _cargoType?: string) {
    return { forecasts: [], reason: 'Analytics table not yet available' };
  }

  async generateRouteOptimizations(_tenantId: string, _userId: string) {
    return { optimizations: [], reason: 'Analytics table not yet available' };
  }

  async generateRiskAlerts(_tenantId: string, _userId: string) {
    return { alerts: [], reason: 'Analytics table not yet available' };
  }
}
