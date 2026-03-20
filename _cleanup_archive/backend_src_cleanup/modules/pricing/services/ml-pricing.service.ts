import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PricingModel,
  ModelStatus,
  ModelType,
  ModelVersion,
} from '../entities/pricing-model.entity';
import {
  PricingPrediction,
  PredictionStatus,
} from '../entities/pricing-prediction.entity';
import {
  PricingFeature,
  FeatureType,
  FeatureSource,
} from '../entities/pricing-feature.entity';
import { Trip } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';
import { Truck } from '../../../entities/truck.entity';
import { Driver } from '../../../entities/driver.entity';
import { Payment } from '../../../entities/payment.entity';
import { CreatePricingPredictionDto } from '../dto/create-pricing-prediction.dto';
import { TrainModelDto } from '../dto/train-model.dto';
import { PricingFeatures } from '../interfaces/pricing-features.interface';
import { Between } from 'typeorm';

@Injectable()
export class MLPricingService {
  private readonly logger = new Logger(MLPricingService.name);
  private readonly modelCache = new Map<string, any>();
  private readonly featureCache = new Map<string, any>();

  constructor(
    @InjectRepository(PricingModel)
    private readonly pricingModelRepository: Repository<PricingModel>,
    @InjectRepository(PricingPrediction)
    private readonly pricingPredictionRepository: Repository<PricingPrediction>,
    @InjectRepository(PricingFeature)
    private readonly pricingFeatureRepository: Repository<PricingFeature>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async predictPrice(
    predictionDto: CreatePricingPredictionDto,
    tenantId: string,
  ): Promise<{
    predictedPrice: number;
    confidenceInterval: { lower: number; upper: number; confidence: number };
    featureContributions: Record<string, number>;
    modelVersion: string;
    inferenceTime: number;
  }> {
    const startTime = Date.now();

    try {
      // Get active model for tenant
      const activeModel = await this.getActiveModel(tenantId);
      if (!activeModel) {
        throw new Error('No active pricing model found for tenant');
      }

      // Extract and engineer features
      const features = await this.extractFeatures(predictionDto, tenantId);

      // Load model from cache or storage
      const model = await this.loadModel(activeModel);

      if (!model) {
        throw new Error('Failed to load model');
      }

      // Make prediction
      const prediction = await this.makePrediction(
        model,
        features,
        activeModel,
      );

      // Calculate confidence interval
      const confidenceInterval = this.calculateConfidenceInterval(
        prediction,
        features,
      );

      // Calculate feature contributions using SHAP
      const featureContributions = await this.calculateFeatureContributions(
        model,
        features,
        activeModel,
      );

      // Save prediction to database
      await this.savePrediction(
        predictionDto,
        prediction,
        features,
        activeModel,
        tenantId,
      );

      const inferenceTime = Date.now() - startTime;

      this.logger.log(
        `Price prediction completed in ${inferenceTime}ms for tenant ${tenantId}`,
      );

      return {
        predictedPrice: prediction,
        confidenceInterval,
        featureContributions,
        modelVersion: activeModel.version,
        inferenceTime,
      };
    } catch (error) {
      this.logger.error(`Failed to predict price: ${error.message}`);
      throw error;
    }
  }

  async trainModel(
    trainDto: TrainModelDto,
    tenantId: string,
  ): Promise<{
    modelId: string;
    trainingMetrics: any;
    performanceMetrics: any;
    status: string;
  }> {
    let savedModel: PricingModel | undefined;
    try {
      this.logger.log(`Starting model training for tenant ${tenantId}`);

      // Create new model record
      const model = this.pricingModelRepository.create({
        tenantId,
        name: trainDto.name,
        description: trainDto.description,
        modelType: trainDto.modelType,
        version: this.generateVersion(trainDto.modelType),
        status: ModelStatus.TRAINING,
        hyperparameters: trainDto.hyperparameters,
        createdBy: trainDto.createdBy,
      });

      savedModel = await this.pricingModelRepository.save(model);

      // Extract training data
      let dataRange = trainDto.dataRange;
      if (
        dataRange &&
        (typeof dataRange.startDate !== 'string' ||
          typeof dataRange.endDate !== 'string')
      ) {
        dataRange = {
          startDate: new Date(dataRange.startDate).toISOString(),
          endDate: new Date(dataRange.endDate).toISOString(),
        };
      } else if (!dataRange) {
        dataRange = {
          startDate: new Date(0).toISOString(),
          endDate: new Date().toISOString(),
        };
      }
      const trainingData = await this.extractTrainingData(tenantId, {
        startDate: new Date(dataRange.startDate),
        endDate: new Date(dataRange.endDate),
      });

      // Engineer features
      const engineeredFeatures = await this.engineerFeatures(
        trainingData,
        tenantId,
      );

      // Train model
      const trainingResult = await this.trainModelAlgorithm(
        engineeredFeatures,
        trainDto.modelType,
        trainDto.hyperparameters,
        savedModel.id,
      );

      // Evaluate model performance
      const performanceMetrics = this.evaluateModel(
        trainingResult.model,
        engineeredFeatures.testData,
      );

      // Check for bias
      const biasMetrics = this.detectBiasMetrics(
        trainingResult.model,
        engineeredFeatures.testData,
      );

      // Update model with results
      await this.pricingModelRepository.update(savedModel.id, {
        status: ModelStatus.ACTIVE,
        modelPath: trainingResult.modelPath,
        performanceMetrics,
        trainingMetrics: trainingResult.metrics,
        biasMetrics,
        lastTrainingDate: new Date(),
        featureConfig: {
          features: engineeredFeatures.featureNames,
          featureImportance: trainingResult.featureImportance,
          featureScaling: engineeredFeatures.scalingParams,
          featureSelection: engineeredFeatures.selectedFeatures,
        },
      });

      this.logger.log(`Model training completed for tenant ${tenantId}`);

      return {
        modelId: savedModel.id,
        trainingMetrics: trainingResult.metrics,
        performanceMetrics,
        status: 'completed',
      };
    } catch (error) {
      this.logger.error(`Model training failed: ${error.message}`);

      // Update model status to failed if we have a model ID
      if (savedModel) {
        await this.pricingModelRepository.update(savedModel.id, {
          status: ModelStatus.FAILED,
        });
      }

      throw error;
    }
  }

  async getModelById(modelId: string, tenantId: string): Promise<PricingModel> {
    const model = await this.pricingModelRepository.findOne({
      where: { id: modelId, tenantId },
      relations: ['versions'],
    });

    if (!model) {
      throw new Error('Model not found');
    }

    return model;
  }

  async getModelPerformance(modelId: string, tenantId: string): Promise<any> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Get recent predictions
      const recentPredictions = await this.pricingPredictionRepository.find({
        where: { modelId, tenantId },
        order: { createdAt: 'DESC' },
        take: 1000,
      });

      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(recentPredictions);

      // Check for data drift
      const driftMetrics = this.checkDataDrift(model, tenantId);

      // Check for bias drift
      const biasDrift = this.checkBiasDrift(model, tenantId);

      return {
        modelId,
        modelVersion: model.version,
        performanceMetrics: model.performanceMetrics,
        recentPerformance: performance,
        driftMetrics,
        biasDrift,
        totalInferences: model.totalInferences,
        averageInferenceTime: model.averageInferenceTime,
        lastTrainingDate: model.lastTrainingDate,
        nextRetrainingDate: model.nextRetrainingDate,
      };
    } catch (error) {
      this.logger.error(`Failed to get model performance: ${error.message}`);
      throw error;
    }
  }

  async retrainModel(
    modelId: string,
    tenantId: string,
  ): Promise<{
    newModelId: string;
    performance: any;
    status: string;
  }> {
    try {
      const currentModel = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!currentModel) {
        throw new Error('Model not found');
      }

      // Get new training data since last training
      const lastTrainingDate = currentModel.lastTrainingDate || new Date(0);
      const newData = await this.extractTrainingData(tenantId, {
        startDate: lastTrainingDate,
        endDate: new Date(),
      });

      // Train new model
      const trainResult = await this.trainModel(
        {
          name: `${currentModel.name} - Retrained`,
          description: `Retrained version of ${currentModel.name}`,
          modelType: currentModel.modelType,
          hyperparameters: currentModel.hyperparameters,
          dataRange: {
            startDate: lastTrainingDate.toISOString(),
            endDate: new Date().toISOString(),
          },
          createdBy: 'system',
        },
        tenantId,
      );

      // Compare performance
      const performanceComparison = this.compareModels(
        currentModel.id,
        trainResult.modelId,
        tenantId,
      );

      // Decide whether to activate new model
      if (performanceComparison.newModelBetter) {
        await this.activateModel(trainResult.modelId, tenantId);
        await this.deactivateModel(currentModel.id, tenantId);
      }

      return {
        newModelId: trainResult.modelId,
        performance: performanceComparison,
        status: performanceComparison.newModelBetter ? 'activated' : 'trained',
      };
    } catch (error) {
      this.logger.error(`Model retraining failed: ${error.message}`);
      throw error;
    }
  }

  async explainPrediction(
    predictionId: string,
    tenantId: string,
  ): Promise<{
    prediction: any;
    featureContributions: Record<string, number>;
    shapValues: Record<string, number>;
    limeExplanation: any;
    globalFeatureImportance: Record<string, number>;
  }> {
    try {
      const prediction = await this.pricingPredictionRepository.findOne({
        where: { id: predictionId, tenantId },
      });

      if (!prediction) {
        throw new Error('Prediction not found');
      }

      const model = await this.pricingModelRepository.findOne({
        where: { id: prediction.modelId },
      });

      // Load model for explanation
      const mlModel = await this.loadModel(model);

      // Generate explanations
      const explanations = this.generateExplanations(mlModel, prediction);

      return {
        prediction,
        featureContributions: prediction.featureContributions,
        shapValues: prediction.shapValues,
        limeExplanation: prediction.limeExplanation,
        globalFeatureImportance:
          model.explainabilityMetrics?.globalFeatureImportance || {},
      };
    } catch (error) {
      this.logger.error(`Failed to explain prediction: ${error.message}`);
      throw error;
    }
  }

  async detectBias(
    modelId: string,
    tenantId: string,
  ): Promise<{
    biasMetrics: any;
    biasDetected: boolean;
    recommendations: string[];
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Get recent predictions for bias analysis
      const recentPredictions = await this.pricingPredictionRepository.find({
        where: { modelId, tenantId },
        order: { createdAt: 'DESC' },
        take: 1000,
      });

      // Analyze bias across different dimensions
      const biasAnalysis = this.analyzeBias(recentPredictions);

      // Generate recommendations
      const recommendations = this.generateBiasRecommendations(biasAnalysis);

      // Update model with bias metrics
      await this.pricingModelRepository.update(modelId, {
        biasMetrics: biasAnalysis,
      });

      return {
        biasMetrics: biasAnalysis,
        biasDetected: biasAnalysis.overallBias > 0.1,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Bias detection failed: ${error.message}`);
      throw error;
    }
  }

  async setupABTest(
    modelId: string,
    abTestConfig: any,
    tenantId: string,
  ): Promise<{
    testId: string;
    controlGroup: string;
    treatmentGroup: string;
    trafficSplit: number;
  }> {
    try {
      const model = await this.pricingModelRepository.findOne({
        where: { id: modelId, tenantId },
      });

      if (!model) {
        throw new Error('Model not found');
      }

      // Create A/B test configuration
      const testConfig = {
        isABTest: true,
        trafficSplit: abTestConfig.trafficSplit || 0.5,
        controlGroup: modelId,
        treatmentGroup: abTestConfig.treatmentModelId,
        testStartDate: new Date(),
        testEndDate: abTestConfig.testEndDate,
        successMetrics: abTestConfig.successMetrics || ['accuracy', 'revenue'],
      };

      // Update model with A/B test config
      await this.pricingModelRepository.update(modelId, {
        aBTestConfig: testConfig,
      });

      this.logger.log(`A/B test setup for model ${modelId}`);

      return {
        testId: modelId,
        controlGroup: testConfig.controlGroup,
        treatmentGroup: testConfig.treatmentGroup,
        trafficSplit: testConfig.trafficSplit,
      };
    } catch (error) {
      this.logger.error(`A/B test setup failed: ${error.message}`);
      throw error;
    }
  }

  // Private helper methods

  private async getActiveModel(tenantId: string): Promise<PricingModel> {
    return this.pricingModelRepository.findOne({
      where: { tenantId, status: ModelStatus.ACTIVE },
      order: { lastTrainingDate: 'DESC' },
    });
  }

  private async extractFeatures(
    predictionDto: CreatePricingPredictionDto,
    tenantId: string,
  ): Promise<PricingFeatures> {
    // Extract basic features
    const features: PricingFeatures = {
      distance: predictionDto.distance,
      weight: predictionDto.weight,
      volume: predictionDto.volume,
      routeComplexity: predictionDto.routeComplexity,
      marketConditions: predictionDto.marketConditions,
      truckAvailability: predictionDto.truckAvailability,
      driverMetrics: predictionDto.driverMetrics,
      environmentalFactors: predictionDto.environmentalFactors,
      temporalFeatures: predictionDto.temporalFeatures,
      cargoFeatures: predictionDto.cargoFeatures,
    };

    // Add computed features
    features.distanceWeightRatio = features.weight / features.distance;
    features.volumeWeightRatio = features.volume / features.weight;
    features.routeEfficiency = this.calculateRouteEfficiency(
      features.routeComplexity,
    );
    features.marketVolatility = this.calculateMarketVolatility(
      features.marketConditions,
    );
    features.driverEfficiency = this.calculateDriverEfficiency(
      features.driverMetrics,
    );
    features.environmentalRisk = this.calculateEnvironmentalRisk(
      features.environmentalFactors,
    );

    return features;
  }

  private async loadModel(model: PricingModel): Promise<any> {
    // Check cache first
    if (this.modelCache.has(model.id)) {
      return this.modelCache.get(model.id);
    }

    // Load model from storage (mock implementation)
    const mlModel = {
      predict: (features: any) => this.mockPrediction(features),
      featureImportance: model.featureConfig?.featureImportance || {},
    };

    // Cache model
    this.modelCache.set(model.id, mlModel);

    return mlModel;
  }

  private async makePrediction(
    model: any,
    features: PricingFeatures,
    modelConfig: PricingModel,
  ): Promise<number> {
    // Convert features to model input format
    const modelInput = this.prepareModelInput(features, modelConfig);

    // Make prediction
    const prediction = model.predict(modelInput);

    // Apply business rules and constraints
    const adjustedPrediction = this.applyBusinessRules(prediction, features);

    return adjustedPrediction;
  }

  private calculateConfidenceInterval(
    prediction: number,
    features: PricingFeatures,
  ): {
    lower: number;
    upper: number;
    confidence: number;
  } {
    // Calculate confidence interval based on feature uncertainty
    const uncertainty = this.calculateUncertainty(features);
    const confidence = 0.95;
    const zScore = 1.96; // 95% confidence interval

    return {
      lower: prediction * (1 - uncertainty * zScore),
      upper: prediction * (1 + uncertainty * zScore),
      confidence,
    };
  }

  private async calculateFeatureContributions(
    model: any,
    features: PricingFeatures,
    modelConfig: PricingModel,
  ): Promise<Record<string, number>> {
    // Calculate SHAP values for feature contributions
    const contributions: Record<string, number> = {};

    // Mock SHAP calculation (in real implementation, use SHAP library)
    Object.keys(features).forEach((feature) => {
      const importance =
        modelConfig.featureConfig?.featureImportance?.[feature] || 0;
      contributions[feature] = importance * Math.random() * 0.5 + 0.5;
    });

    return contributions;
  }

  private async savePrediction(
    predictionDto: CreatePricingPredictionDto,
    prediction: number,
    features: PricingFeatures,
    model: PricingModel,
    tenantId: string,
  ): Promise<void> {
    const pricingPrediction = this.pricingPredictionRepository.create({
      tenantId,
      modelId: model.id,
      tripId: predictionDto.tripId,
      loadId: predictionDto.loadId,
      truckId: predictionDto.truckId,
      driverId: predictionDto.driverId,
      status: PredictionStatus.PROCESSED,
      distance: features.distance,
      weight: features.weight,
      volume: features.volume,
      originLocation: predictionDto.originLocation,
      destinationLocation: predictionDto.destinationLocation,
      routeComplexity: features.routeComplexity,
      marketConditions: features.marketConditions,
      truckAvailability: features.truckAvailability,
      driverMetrics: features.driverMetrics,
      environmentalFactors: features.environmentalFactors,
      temporalFeatures: features.temporalFeatures,
      cargoFeatures: features.cargoFeatures,
      predictedPrice: prediction,
      confidenceInterval: this.calculateConfidenceInterval(
        prediction,
        features,
      ),
      featureContributions: await this.calculateFeatureContributions(
        null,
        features,
        model,
      ),
      modelVersion: {
        version: model.version,
        modelType: model.modelType,
        trainingDate: model.lastTrainingDate,
        hyperparameters: model.hyperparameters,
      },
      predictedAt: new Date(),
    });

    await this.pricingPredictionRepository.save(pricingPrediction);
  }

  private generateVersion(modelType: ModelType): ModelVersion {
    // Generate version based on model type and existing versions
    const versions = Object.values(ModelVersion);
    return versions[Math.floor(Math.random() * versions.length)];
  }

  private async extractTrainingData(
    tenantId: string,
    dataRange: { startDate: Date; endDate: Date },
  ): Promise<any[]> {
    // Extract historical trip and pricing data
    const trips = await this.tripRepository.find({
      where: {
        tenantId,
        createdAt: Between(dataRange.startDate, dataRange.endDate),
      },
      relations: ['load', 'truck', 'driver'], // Remove 'payments' if not always present
    });

    return trips.map((trip) => ({
      trip,
      load: trip.load,
      truck: trip.truck,
      driver: trip.driver,
      payments: (trip as any).payments || [], // Defensive: only if present
    }));
  }

  private async engineerFeatures(
    trainingData: any[],
    tenantId: string,
  ): Promise<{
    features: any[];
    featureNames: string[];
    scalingParams: any;
    selectedFeatures: string[];
    testData: any[];
  }> {
    // Feature engineering pipeline
    const engineeredFeatures = trainingData.map((data) =>
      this.engineerFeaturesForTrip(data),
    );

    // Feature selection
    const selectedFeatures = this.selectFeatures(engineeredFeatures);

    // Feature scaling
    const scalingParams = this.calculateScalingParams(
      engineeredFeatures,
      selectedFeatures,
    );

    // Split into train/test
    const splitIndex = Math.floor(engineeredFeatures.length * 0.8);
    const trainData = engineeredFeatures.slice(0, splitIndex);
    const testData = engineeredFeatures.slice(splitIndex);

    return {
      features: trainData,
      featureNames: selectedFeatures,
      scalingParams,
      selectedFeatures,
      testData,
    };
  }

  private async trainModelAlgorithm(
    engineeredFeatures: any,
    modelType: ModelType,
    hyperparameters: any,
    modelId: string,
  ): Promise<{
    model: any;
    modelPath: string;
    metrics: any;
    featureImportance: Record<string, number>;
  }> {
    // Mock model training (in real implementation, use ML libraries)
    const model = {
      predict: (features: any) => this.mockPrediction(features),
      featureImportance: this.generateFeatureImportance(
        engineeredFeatures.featureNames,
      ),
    };

    const metrics = {
      trainingTime: Math.random() * 1000 + 100,
      trainingSamples: engineeredFeatures.features.length,
      validationSamples: Math.floor(engineeredFeatures.features.length * 0.2),
      testSamples: (engineeredFeatures.testData as unknown[]).length,
      epochs: (hyperparameters as { epochs?: number })?.epochs || 100,
      batchSize: (hyperparameters as { batchSize?: number })?.batchSize || 32,
      learningRate:
        (hyperparameters as { learningRate?: number })?.learningRate || 0.001,
      lossHistory: Array.from({ length: 10 }, () => Math.random()),
      accuracyHistory: Array.from({ length: 10 }, () => Math.random()),
    };

    return {
      model,
      modelPath: `/models/${modelId}.pkl`,
      metrics,
      featureImportance: model.featureImportance,
    };
  }

  private evaluateModel(
    _model: unknown,
    _testData: unknown[],
  ): {
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
  } {
    // Mock model evaluation
    return {
      mse: Math.random() * 1000,
      mae: Math.random() * 100,
      rmse: Math.random() * 50,
      r2: Math.random() * 0.5 + 0.5,
      mape: Math.random() * 20,
      accuracy: Math.random() * 0.3 + 0.7,
      precision: Math.random() * 0.3 + 0.7,
      recall: Math.random() * 0.3 + 0.7,
      f1Score: Math.random() * 0.3 + 0.7,
      crossValidationScore: Math.random() * 0.3 + 0.7,
    };
  }

  private detectBiasMetrics(
    _model: unknown,
    _testData: unknown[],
  ): {
    genderBias: number;
    ageBias: number;
    locationBias: number;
    incomeBias: number;
    overallBias: number;
    biasDetected: boolean;
    biasMitigationApplied: boolean;
  } {
    // Mock bias detection
    return {
      genderBias: Math.random() * 0.2,
      ageBias: Math.random() * 0.2,
      locationBias: Math.random() * 0.2,
      incomeBias: Math.random() * 0.2,
      overallBias: Math.random() * 0.2,
      biasDetected: Math.random() > 0.7,
      biasMitigationApplied: Math.random() > 0.5,
    };
  }

  private calculatePerformanceMetrics(predictions: PricingPrediction[]): any {
    const validPredictions = predictions.filter(
      (p) => p.actualPrice && p.predictedPrice,
    );

    if (validPredictions.length === 0) {
      return { mse: 0, mae: 0, accuracy: 0 };
    }

    const errors = validPredictions.map((p) =>
      Math.abs(p.predictedPrice - p.actualPrice),
    );
    const mae = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    const mse =
      errors.reduce((sum, error) => sum + error * error, 0) / errors.length;

    return {
      mse,
      mae,
      rmse: Math.sqrt(mse),
      accuracy:
        1 -
        mae /
          validPredictions.reduce((sum, p) => sum + p.actualPrice, 0) /
          validPredictions.length,
    };
  }

  private checkDataDrift(
    _model: PricingModel,
    _tenantId: string,
  ): {
    featureDrift: Record<string, number>;
    predictionDrift: number;
    dataDrift: number;
    conceptDrift: number;
  } {
    // Mock data drift detection
    return {
      featureDrift: {
        distance: Math.random() * 0.1,
        weight: Math.random() * 0.1,
      },
      predictionDrift: Math.random() * 0.1,
      dataDrift: Math.random() * 0.1,
      conceptDrift: Math.random() * 0.1,
    };
  }

  private checkBiasDrift(
    _model: PricingModel,
    _tenantId: string,
  ): {
    biasDrift: number;
    biasThreshold: number;
    biasDetected: boolean;
  } {
    // Mock bias drift detection
    return {
      biasDrift: Math.random() * 0.1,
      biasThreshold: 0.1,
      biasDetected: Math.random() > 0.8,
    };
  }

  private compareModels(
    _model1Id: string,
    _model2Id: string,
    _tenantId: string,
  ): {
    newModelBetter: boolean;
    performanceImprovement: number;
    accuracyComparison: { model1: number; model2: number };
  } {
    // Mock model comparison
    return {
      newModelBetter: Math.random() > 0.3,
      performanceImprovement: Math.random() * 0.2,
      accuracyComparison: { model1: 0.85, model2: 0.87 },
    };
  }

  private async activateModel(
    modelId: string,
    _tenantId: string,
  ): Promise<void> {
    await this.pricingModelRepository.update(modelId, {
      status: ModelStatus.ACTIVE,
    });
  }

  private async deactivateModel(
    modelId: string,
    _tenantId: string,
  ): Promise<void> {
    await this.pricingModelRepository.update(modelId, {
      status: ModelStatus.INACTIVE,
    });
  }

  private generateExplanations(
    _model: unknown,
    prediction: PricingPrediction,
  ): {
    shapValues: Record<string, number> | null;
    limeExplanation: unknown;
  } {
    // Mock explanation generation
    return {
      shapValues: prediction.shapValues || null,
      limeExplanation: prediction.limeExplanation || null,
    };
  }

  private analyzeBias(_predictions: PricingPrediction[]): {
    genderBias: number;
    ageBias: number;
    locationBias: number;
    incomeBias: number;
    overallBias: number;
    biasDetected: boolean;
    biasMitigationApplied: boolean;
  } {
    // Mock bias analysis
    return {
      genderBias: Math.random() * 0.2,
      ageBias: Math.random() * 0.2,
      locationBias: Math.random() * 0.2,
      incomeBias: Math.random() * 0.2,
      overallBias: Math.random() * 0.2,
      biasDetected: Math.random() > 0.7,
      biasMitigationApplied: Math.random() > 0.5,
    };
  }

  private generateBiasRecommendations(biasAnalysis: {
    overallBias: number;
  }): string[] {
    const recommendations: string[] = [];

    if (biasAnalysis.overallBias > 0.1) {
      recommendations.push('Consider retraining model with balanced dataset');
      recommendations.push('Implement bias mitigation techniques');
      recommendations.push(
        'Review feature selection for potential bias sources',
      );
    }

    return recommendations;
  }

  // Utility methods for feature engineering
  private calculateRouteEfficiency(routeComplexity: {
    urbanPercentage?: number;
    tollRoads?: number;
  }): number {
    return (
      1 -
      ((routeComplexity.urbanPercentage || 0) * 0.3 +
        (routeComplexity.tollRoads || 0) * 0.1)
    );
  }

  private calculateMarketVolatility(marketConditions: {
    marketVolatility?: number;
  }): number {
    return marketConditions.marketVolatility || 0.1;
  }

  private calculateDriverEfficiency(driverMetrics: {
    driverRating?: number;
    safetyScore?: number;
    onTimeDeliveryRate?: number;
  }): number {
    return (
      ((driverMetrics.driverRating || 0) * 0.4 +
        (driverMetrics.safetyScore || 0) * 0.3 +
        (driverMetrics.onTimeDeliveryRate || 0) * 0.3) /
      100
    );
  }

  private calculateEnvironmentalRisk(environmentalFactors: {
    weatherConditions?: string;
    trafficConditions?: string;
    roadConditions?: string;
  }): number {
    let risk = 0;
    if (environmentalFactors.weatherConditions === 'adverse') risk += 0.3;
    if (environmentalFactors.trafficConditions === 'heavy') risk += 0.2;
    if (environmentalFactors.roadConditions === 'poor') risk += 0.2;
    return Math.min(risk, 1);
  }

  private calculateUncertainty(features: PricingFeatures): number {
    // Calculate uncertainty based on feature quality and market conditions
    const volatility =
      (features.marketConditions as { marketVolatility?: number })
        ?.marketVolatility || 0.1;
    return volatility * 0.5 + 0.1;
  }

  private prepareModelInput(
    features: PricingFeatures,
    _modelConfig: PricingModel,
  ): Record<string, unknown> {
    // Convert features to model input format
    return Object.keys(features).reduce(
      (input: Record<string, unknown>, key) => {
        input[key] = (features as unknown as Record<string, unknown>)[key];
        return input;
      },
      {},
    );
  }

  private applyBusinessRules(
    prediction: number,
    features: PricingFeatures,
  ): number {
    // Apply business rules and constraints
    let adjustedPrediction = prediction;

    // Minimum price constraint
    const minPrice = features.distance * 0.5; // $0.50 per mile minimum
    adjustedPrediction = Math.max(adjustedPrediction, minPrice);

    // Maximum price constraint
    const maxPrice = features.distance * 5.0; // $5.00 per mile maximum
    adjustedPrediction = Math.min(adjustedPrediction, maxPrice);

    return adjustedPrediction;
  }

  private mockPrediction(features: {
    distance?: number;
    weight?: number;
    marketConditions?: { demandLevel?: number };
  }): number {
    // Mock prediction (in real implementation, use actual ML model)
    const basePrice = (features.distance || 0) * 2.5;
    const weightFactor = (features.weight || 0) / 1000; // per 1000 lbs
    const marketFactor =
      (features.marketConditions as { demandLevel?: number })?.demandLevel ||
      1.0;

    return basePrice * (1 + weightFactor * 0.1) * marketFactor;
  }

  private engineerFeaturesForTrip(data: {
    trip?: { totalDistance?: number };
    load?: { weight?: number; volume?: number };
  }): {
    distance: number | undefined;
    weight: number | undefined;
    volume: number | undefined;
  } {
    // Feature engineering for a single trip
    return {
      distance: data.trip?.totalDistance,
      weight: data.load?.weight,
      volume: data.load?.volume,
      // Add more engineered features
    };
  }

  private selectFeatures(_features: unknown[]): string[] {
    // Feature selection logic
    return ['distance', 'weight', 'volume', 'marketDemand', 'fuelPrice'];
  }

  private calculateScalingParams(
    features: Array<Record<string, unknown>>,
    selectedFeatures: string[],
  ): Record<
    string,
    { mean: number; std: number }
  > {
    // Calculate scaling parameters
    return selectedFeatures.reduce(
      (
        params: Record<string, { mean: number; std: number }>,
        feature: string,
      ) => {
        const values = features
          .map((f) => f[feature] as number | undefined)
          .filter((v): v is number => v !== undefined && typeof v === 'number');
        if (values.length > 0) {
          const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
          params[feature] = {
            mean,
            std: Math.sqrt(
              values.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
                values.length,
            ),
          };
        }
        return params;
      },
      {},
    );
  }

  private generateFeatureImportance(
    featureNames: string[],
  ): Record<string, number> {
    return featureNames.reduce((importance, feature) => {
      importance[feature] = Math.random();
      return importance;
    }, {});
  }
}
