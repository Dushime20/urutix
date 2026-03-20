export interface PricingFeatures {
  // Basic trip features
  distance: number;
  weight: number;
  volume: number;

  // Route complexity features
  routeComplexity: {
    highwayPercentage: number;
    urbanPercentage: number;
    ruralPercentage: number;
    tollRoads: number;
    borderCrossings: number;
    elevationChange: number;
  };

  // Market conditions
  marketConditions: {
    demandLevel: number;
    supplyLevel: number;
    competitorPricing: number;
    seasonalFactor: number;
    fuelPrice: number;
    marketVolatility: number;
  };

  // Truck availability
  truckAvailability: {
    availableTrucks: number;
    truckUtilization: number;
    truckType: string;
    capacityUtilization: number;
    equipmentRequirements: string[];
  };

  // Driver metrics
  driverMetrics: {
    driverRating: number;
    safetyScore: number;
    experienceYears: number;
    onTimeDeliveryRate: number;
    totalTrips: number;
    averageEarnings: number;
  };

  // Environmental factors
  environmentalFactors: {
    weatherConditions: string;
    trafficConditions: string;
    roadConditions: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
  };

  // Temporal features
  temporalFeatures: {
    dayOfWeek: number;
    month: number;
    season: string;
    isHoliday: boolean;
    isWeekend: boolean;
    timeOfDay: number;
  };

  // Cargo features
  cargoFeatures: {
    cargoType: string;
    isHazmat: boolean;
    isRefrigerated: boolean;
    isFragile: boolean;
    requiresSpecialHandling: boolean;
    insuranceValue: number;
  };

  // Computed features
  distanceWeightRatio?: number;
  volumeWeightRatio?: number;
  routeEfficiency?: number;
  marketVolatility?: number;
  driverEfficiency?: number;
  environmentalRisk?: number;
}

export interface ModelPerformance {
  modelId: string;
  modelVersion: string;
  performanceMetrics: {
    mse: number;
    mae: number;
    rmse: number;
    r2: number;
    mape: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    crossValidationScore: number;
  };
  recentPerformance: {
    mse: number;
    mae: number;
    rmse: number;
    accuracy: number;
  };
  driftMetrics: {
    featureDrift: Record<string, number>;
    predictionDrift: number;
    dataDrift: number;
    conceptDrift: number;
  };
  biasDrift: {
    biasDrift: number;
    biasThreshold: number;
    biasDetected: boolean;
  };
  totalInferences: number;
  averageInferenceTime: number;
  lastTrainingDate: Date;
  nextRetrainingDate: Date;
}

export interface TrainingData {
  tripId: string;
  loadId: string;
  truckId: string;
  driverId: string;
  actualPrice: number;
  features: PricingFeatures;
  metadata: {
    tripDate: Date;
    origin: string;
    destination: string;
    cargoType: string;
    weatherConditions: string;
    marketConditions: string;
  };
}

export interface ModelConfig {
  modelType: string;
  hyperparameters: Record<string, any>;
  featureConfig: {
    features: string[];
    featureImportance: Record<string, number>;
    featureScaling: Record<string, any>;
    featureSelection: string[];
  };
  trainingConfig: {
    trainTestSplit: number;
    crossValidationFolds: number;
    randomState: number;
    earlyStoppingPatience: number;
  };
  monitoringConfig: {
    driftThreshold: number;
    performanceThreshold: number;
    retrainingThreshold: number;
    alertEmails: string[];
  };
}

export interface PredictionResult {
  predictedPrice: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
  featureContributions: Record<string, number>;
  shapValues: Record<string, number>;
  limeExplanation: {
    features: string[];
    weights: number[];
    intercept: number;
    score: number;
  };
  modelVersion: string;
  inferenceTime: number;
  predictionId: string;
}

export interface BiasAnalysis {
  genderBias: number;
  ageBias: number;
  locationBias: number;
  incomeBias: number;
  overallBias: number;
  biasDetected: boolean;
  biasMitigationApplied: boolean;
  biasMitigationMethod: string;
  biasThreshold: number;
  recommendations: string[];
}

export interface DataDriftAnalysis {
  featureDrift: Record<string, number>;
  predictionDrift: number;
  dataDrift: number;
  conceptDrift: number;
  driftThreshold: number;
  driftDetected: boolean;
  affectedFeatures: string[];
  recommendations: string[];
}

export interface ABTestConfig {
  testId: string;
  controlGroup: string;
  treatmentGroup: string;
  trafficSplit: number;
  testStartDate: Date;
  testEndDate: Date;
  successMetrics: string[];
  minimumSampleSize: number;
  statisticalSignificance: number;
  currentResults: {
    controlMetrics: Record<string, number>;
    treatmentMetrics: Record<string, number>;
    lift: Record<string, number>;
    pValue: Record<string, number>;
    isSignificant: boolean;
  };
}

export interface ModelMetrics {
  trainingMetrics: {
    trainingTime: number;
    trainingSamples: number;
    validationSamples: number;
    testSamples: number;
    epochs: number;
    batchSize: number;
    learningRate: number;
    lossHistory: number[];
    accuracyHistory: number[];
  };
  performanceMetrics: {
    mse: number;
    mae: number;
    rmse: number;
    r2: number;
    mape: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    crossValidationScore: number;
  };
  biasMetrics: BiasAnalysis;
  explainabilityMetrics: {
    shapValues: Record<string, number>;
    featureContributions: Record<string, number>;
    globalFeatureImportance: Record<string, number>;
    localFeatureImportance: Record<string, number>;
    limeExplanations: Record<string, any>;
  };
  driftMetrics: DataDriftAnalysis;
}
