import api from './api'; // Existing API client

// Types for Analytics API (following existing patterns)
export interface CostTrendDataPoint {
  date: string;
  totalCost: number;
  averageCost: number;
  shipmentCount: number;
  costPerKm: number;
  costPerKg: number;
}

export interface CostTrendsResponse {
  trends: CostTrendDataPoint[];
  totalCost: number;
  averageCostPerShipment: number;
  totalShipments: number;
  costChangePercentage: number;
  comparisonPeriod: string;
}

export interface AnalyticsInsight {
  id: string;
  insightType: string;
  title: string;
  description?: string;
  confidenceScore?: number;
  potentialImpact: {
    costSavings?: number;
    timeReduction?: number;
    efficiencyGain?: number;
    currency?: string;
  };
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    effort: 'low' | 'medium' | 'high';
    timeline: string;
    steps?: string[];
  }>;
  status: 'active' | 'dismissed' | 'implemented' | 'expired';
  createdAt: string;
  expiresAt?: string;
}

export interface AnalyticsMetrics {
  totalShipments: number;
  dateRange: {
    start: string;
    end: string;
  };
  lastUpdated: string;
  completeness: number;
  dataQuality: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: Record<string, any>;
  sort: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface CostFilters {
  timeRange?: 'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_year' | 'custom';
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  cargoType?: string;
  originCity?: string;
  destinationCity?: string;
  carrierId?: string;
  minCost?: number;
  maxCost?: number;
}

export interface InsightsFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  insightType?: string;
  status?: string;
  minConfidence?: number;
  withCostSavings?: boolean;
  expiringSoon?: boolean;
}

export interface RouteSpec {
  originCity: string;
  destinationCity: string;
  weight: number;
  cargoType?: string;
  distance?: number;
}

export interface PricingRecommendation {
  currentPrice: number;
  recommendedPrice: number;
  potentialSavings: number;
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    option: string;
    price: number;
    savings: number;
    tradeoffs: string[];
  }>;
  marketFactors: string[];
}

// Analytics API Service (following existing patterns)
const analyticsApiBase = {
  // Overview and metrics
  getOverview: async (): Promise<AnalyticsMetrics> => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },

  // Financial Analytics
  getCostTrends: async (filters?: CostFilters): Promise<CostTrendsResponse> => {
    const response = await api.get('/analytics/financial/cost-trends', {
      params: filters,
    });
    return response.data;
  },

  getShipmentProfitability: async (filters?: CostFilters): Promise<any> => {
    const response = await api.get('/analytics/financial/profitability', {
      params: filters,
    });
    return response.data;
  },

  getPricingRecommendations: async (routeSpec: RouteSpec): Promise<PricingRecommendation> => {
    const response = await api.post('/analytics/financial/pricing-recommendations', routeSpec);
    return response.data;
  },

  getFinancialSummary: async (filters?: CostFilters): Promise<any> => {
    const response = await api.get('/analytics/financial/summary', {
      params: filters,
    });
    return response.data;
  },

  // AI Insights
  getInsights: async (filters?: InsightsFilters): Promise<PaginatedResponse<AnalyticsInsight>> => {
    const response = await api.get('/analytics/insights', {
      params: filters,
    });
    return response.data;
  },

  generateInsights: async (): Promise<AnalyticsInsight[]> => {
    const response = await api.post('/analytics/insights/generate');
    return response.data;
  },

  dismissInsight: async (insightId: string): Promise<AnalyticsInsight> => {
    const response = await api.patch(`/analytics/insights/${insightId}/dismiss`);
    return response.data;
  },

  implementInsight: async (insightId: string): Promise<AnalyticsInsight> => {
    const response = await api.patch(`/analytics/insights/${insightId}/implement`);
    return response.data;
  },

  // Analytics Data
  getAnalyticsData: async (filters?: any): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/analytics/data', {
      params: filters,
    });
    return response.data;
  },

  // Admin operations
  backfillData: async (): Promise<{ message: string }> => {
    const response = await api.post('/analytics/backfill');
    return response.data;
  },
};

// Operational Analytics Types
export interface PerformanceMetrics {
  totalShipments: number;
  onTimeRate: number;
  damageRate: number;
  averageTransitTime: number;
  averageCostPerKm: number;
  activeCarriers: number;
  activeRoutes: number;
  efficiencyScore: number;
}

export interface RoutePerformance {
  routeHash: string;
  route: string;
  averageCost: number;
  averageTransitTime: number;
  shipmentCount: number;
  onTimeRate: number;
  distanceKm?: number;
  profitabilityScore?: number;
}

export interface CarrierPerformance {
  carrierId: string;
  totalShipments: number;
  onTimeRate: number;
  damageRate: number;
  averageCost: number;
  averageCostPerKm: number;
  averageRating: number;
  reliabilityScore: number;
  recommendation: 'preferred' | 'acceptable' | 'avoid' | 'insufficient_data';
  relationshipDuration: number;
}

export interface IndustryBenchmarks {
  marketBenchmarks: {
    averageCost: number;
    averageCostPerKm: number;
    averageTransitTime: number;
    onTimeRate: number;
    costRange: {
      p25: number;
      p75: number;
    };
  };
  userPerformance: {
    averageCost: number;
    averageCostPerKm: number;
    averageTransitTime: number;
    onTimeRate: number;
    totalShipments: number;
  };
  comparison: {
    costComparison: number;
    transitTimeComparison: number;
    onTimeRateComparison: number;
  };
}

export interface MarketTrend {
  period: string;
  averageCost: number;
  averageCostPerKm: number;
  shipmentCount: number;
  averageTransitTime: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CompetitivePositioning {
  userMetrics: {
    averageCost: number;
    averageCostPerKm: number;
    averageTransitTime: number;
    onTimeRate: number;
    totalShipments: number;
  };
  marketBenchmarks: {
    averageCost: number;
    averageCostPerKm: number;
    averageTransitTime: number;
    onTimeRate: number;
  };
  positioning: {
    cost: 'below_market' | 'above_market';
    speed: 'faster' | 'slower';
    reliability: 'above_market' | 'below_market';
    overall: 'competitive_advantage' | 'mixed_performance' | 'improvement_needed';
  };
  recommendations: string[];
}

// Add operational analytics methods to the existing analyticsApi object
const operationalAnalytics = {
  // Operational Performance
  getOperationalPerformance: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PerformanceMetrics> => {
    const response = await api.get('/analytics/operational/performance', {
      params: filters,
    });
    return response.data;
  },

  getRoutePerformance: async (): Promise<RoutePerformance[]> => {
    const response = await api.get('/analytics/operational/routes');
    return response.data;
  },

  getCarrierPerformance: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CarrierPerformance[]> => {
    const response = await api.get('/analytics/operational/carriers', {
      params: filters,
    });
    return response.data;
  },

  getCarrierScorecard: async (carrierId: string): Promise<any> => {
    const response = await api.get(`/analytics/operational/carriers/${carrierId}/scorecard`);
    return response.data;
  },

  getCarrierRecommendationsForRoute: async (routeHash: string): Promise<any[]> => {
    const response = await api.get(`/analytics/operational/carriers/recommendations/${routeHash}`);
    return response.data;
  },

  // Market Intelligence
  getIndustryBenchmarks: async (): Promise<IndustryBenchmarks> => {
    const response = await api.get('/analytics/operational/market/benchmarks');
    return response.data;
  },

  getMarketTrends: async (filters?: {
    routeHash?: string;
    cargoType?: string;
    timeframe?: 'monthly' | 'quarterly';
  }): Promise<MarketTrend[]> => {
    const response = await api.get('/analytics/operational/market/trends', {
      params: filters,
    });
    return response.data;
  },

  getCompetitivePositioning: async (filters?: {
    cargoType?: string;
  }): Promise<CompetitivePositioning> => {
    const response = await api.get('/analytics/operational/market/positioning', {
      params: filters,
    });
    return response.data;
  },
};

// AI Insights & Predictive Analytics Types
export interface CostPrediction {
  prediction: number | null;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  baseline: number;
  reason?: string;
}

export interface CarrierPrediction {
  predictedOnTimeRate: number;
  predictedRating: number;
  predictedCost: number;
  confidence: number;
  recommendation: 'preferred' | 'acceptable' | 'consider_alternatives';
}

export interface RouteOptimization {
  type: 'cost_optimization' | 'performance_optimization';
  route: string;
  issue: string;
  currentCost?: number;
  potentialSavings?: number;
  currentRate?: number;
  targetRate?: number;
  confidence: number;
  recommendations: string[];
}

export interface DemandForecast {
  forecast: number | null;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  historicalAverage: number;
  reason?: string;
}

export interface RiskAlert {
  type: 'cost_spike' | 'performance_drop';
  severity: 'high' | 'medium' | 'low';
  message: string;
  threshold?: number;
  maxValue?: number;
  currentRate?: number;
  historicalRate?: number;
  confidence: number;
}

export interface ComprehensiveInsights {
  costPredictions: CostPrediction;
  routeOptimizations: RouteOptimization[];
  demandForecasts: DemandForecast;
  riskAlerts: RiskAlert[];
  generatedAt: string;
  summary: {
    totalInsights: number;
    highPriorityAlerts: number;
    potentialSavings: number;
    keyRecommendations: string[];
  };
}

export interface AIDashboardSummary {
  summary: {
    totalInsights: number;
    potentialSavings: number;
    keyRecommendations: string[];
  };
  latestPrediction: CostPrediction;
  activeAlerts: number;
  totalInsights: number;
  generatedAt: string;
}

// AI Insights & Predictive Analytics API methods
const aiInsightsAnalytics = {
  // AI Insights
  getComprehensiveAIInsights: async (): Promise<ComprehensiveInsights> => {
    const response = await api.get('/analytics/ai/insights/comprehensive');
    return response.data;
  },

  getCostPredictions: async (routeHash?: string, daysAhead?: number): Promise<CostPrediction> => {
    const response = await api.get('/analytics/ai/predictions/costs', {
      params: { routeHash, daysAhead },
    });
    return response.data;
  },

  getCarrierPredictions: async (carrierId: string): Promise<CarrierPrediction> => {
    const response = await api.get(`/analytics/ai/predictions/carrier/${carrierId}`);
    return response.data;
  },

  getDemandPredictions: async (cargoType?: string): Promise<DemandForecast> => {
    const response = await api.get('/analytics/ai/predictions/demand', {
      params: { cargoType },
    });
    return response.data;
  },

  getRouteRecommendations: async (): Promise<RouteOptimization[]> => {
    const response = await api.get('/analytics/ai/recommendations/routes');
    return response.data;
  },

  getRiskAlerts: async (): Promise<RiskAlert[]> => {
    const response = await api.get('/analytics/ai/alerts/risks');
    return response.data;
  },

  // Predictive Analytics
  getCostForecasting: async (routeHash?: string, daysAhead?: number): Promise<any> => {
    const response = await api.get('/analytics/ai/forecasting/costs', {
      params: { routeHash, daysAhead },
    });
    return response.data;
  },

  getCarrierForecasting: async (carrierId: string, daysAhead?: number): Promise<any> => {
    const response = await api.get(`/analytics/ai/forecasting/carrier/${carrierId}`, {
      params: { daysAhead },
    });
    return response.data;
  },

  getSeasonalForecasting: async (cargoType?: string): Promise<any> => {
    const response = await api.get('/analytics/ai/forecasting/seasonal', {
      params: { cargoType },
    });
    return response.data;
  },

  getRouteEfficiencyForecasting: async (routeHash: string): Promise<any> => {
    const response = await api.get(`/analytics/ai/forecasting/route/${routeHash}/efficiency`);
    return response.data;
  },

  generateNewInsights: async (): Promise<ComprehensiveInsights> => {
    const response = await api.post('/analytics/ai/insights/generate');
    return response.data;
  },

  getAIDashboardSummary: async (): Promise<AIDashboardSummary> => {
    const response = await api.get('/analytics/ai/dashboard/summary');
    return response.data;
  },
};

// Advanced Analytics & ML Pipeline API methods
const advancedAnalytics = {
  // ML Pipeline
  trainMLModel: async (modelConfig: any): Promise<any> => {
    const response = await api.post('/analytics/advanced/ml/train-model', modelConfig);
    return response.data;
  },

  generateMLPredictions: async (predictionRequest: any): Promise<any> => {
    const response = await api.get('/analytics/advanced/ml/predictions', {
      params: predictionRequest,
    });
    return response.data;
  },

  optimizeRoutesML: async (routes: any[]): Promise<any> => {
    const response = await api.post('/analytics/advanced/ml/optimize-routes', routes);
    return response.data;
  },

  forecastDemandAdvanced: async (horizon?: number): Promise<any> => {
    const response = await api.get('/analytics/advanced/ml/demand-forecast', {
      params: { horizon },
    });
    return response.data;
  },

  // Real-time Processing
  processStreamEvent: async (streamData: { streamType: string; eventData: any }): Promise<any> => {
    const response = await api.post('/analytics/advanced/realtime/stream', streamData);
    return response.data;
  },

  getRealTimeDashboard: async (): Promise<any> => {
    const response = await api.get('/analytics/advanced/realtime/dashboard');
    return response.data;
  },

  startRealTimeMonitoring: async (monitoringConfig: any): Promise<any> => {
    const response = await api.post('/analytics/advanced/realtime/monitoring/start', monitoringConfig);
    return response.data;
  },

  processBatchUpdates: async (updates: any[]): Promise<any> => {
    const response = await api.post('/analytics/advanced/realtime/batch-process', updates);
    return response.data;
  },

  // API Marketplace
  generateApiKey: async (keyConfig: {
    keyName: string;
    permissions: string[];
    rateLimit?: number;
    expiresInDays?: number;
  }): Promise<any> => {
    const response = await api.post('/analytics/advanced/api-marketplace/keys', keyConfig);
    return response.data;
  },

  getApiUsageAnalytics: async (timeRange?: string): Promise<any> => {
    const response = await api.get('/analytics/advanced/api-marketplace/usage', {
      params: { timeRange },
    });
    return response.data;
  },

  updateApiKeyPermissions: async (apiKey: string, permissions: string[]): Promise<any> => {
    const response = await api.put(`/analytics/advanced/api-marketplace/keys/${apiKey}/permissions`, {
      permissions,
    });
    return response.data;
  },

  deactivateApiKey: async (apiKey: string): Promise<any> => {
    const response = await api.delete(`/analytics/advanced/api-marketplace/keys/${apiKey}`);
    return response.data;
  },

  getApiDocumentation: async (): Promise<any> => {
    const response = await api.get('/analytics/advanced/api-marketplace/documentation');
    return response.data;
  },

  // Public API methods (for external use)
  getPublicCostTrends: async (apiKey: string, filters: any): Promise<any> => {
    const response = await api.get('/public/analytics/cost-trends', {
      headers: { 'X-API-Key': apiKey },
      params: filters,
    });
    return response.data;
  },

  getPublicMarketBenchmarks: async (apiKey: string, filters: any): Promise<any> => {
    const response = await api.get('/public/analytics/market-benchmarks', {
      headers: { 'X-API-Key': apiKey },
      params: filters,
    });
    return response.data;
  },

  getPublicRoutePerformance: async (apiKey: string, filters: any): Promise<any> => {
    const response = await api.get('/public/analytics/route-performance', {
      headers: { 'X-API-Key': apiKey },
      params: filters,
    });
    return response.data;
  },

  getPublicDemandForecast: async (apiKey: string, filters: any): Promise<any> => {
    const response = await api.get('/public/analytics/demand-forecast', {
      headers: { 'X-API-Key': apiKey },
      params: filters,
    });
    return response.data;
  },

  getPublicApiDocumentation: async (): Promise<any> => {
    const response = await api.get('/public/analytics/documentation');
    return response.data;
  },
};

// Tracking methods
export const trackOnboardingStep = async (step: string, data: any): Promise<void> => {
  try {
    await api.post('/analytics/track/onboarding', { step, data });
  } catch (error) {
    console.error('Error tracking onboarding step:', error);
  }
};

// Extend the existing analyticsApi with operational, AI, and advanced methods
// Combine and export the analyticsApi object with type safety
export const analyticsApi = {
  ...analyticsApiBase,
  ...operationalAnalytics,
  ...aiInsightsAnalytics,
  ...advancedAnalytics,
  trackOnboardingStep,
};

export default analyticsApi;