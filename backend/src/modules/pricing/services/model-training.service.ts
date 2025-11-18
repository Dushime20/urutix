import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PricingModel,
  ModelStatus,
  ModelType,
} from '../entities/pricing-model.entity';
import { PricingFeature } from '../entities/pricing-feature.entity';
import { FeatureEngineeringService } from './feature-engineering.service';
import { TrainModelDto } from '../dto/train-model.dto';
import { PricingFeatures } from '../interfaces/pricing-features.interface';

@Injectable()
export class ModelTrainingService {
  private readonly logger = new Logger(ModelTrainingService.name);

  constructor(
    @InjectRepository(PricingModel)
    private readonly pricingModelRepository: Repository<PricingModel>,
    @InjectRepository(PricingFeature)
    private readonly pricingFeatureRepository: Repository<PricingFeature>,
    private readonly featureEngineeringService: FeatureEngineeringService,
  ) {}

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

      // Create model record
      const model = this.pricingModelRepository.create({
        tenantId,
        name: trainDto.name,
        description: trainDto.description,
        modelType: trainDto.modelType,
        status: ModelStatus.TRAINING,
        hyperparameters: trainDto.hyperparameters,
        createdBy: trainDto.createdBy,
      });

      savedModel = await this.pricingModelRepository.save(model);

      // Extract and prepare training data
      const trainingData = await this.prepareTrainingData(
        tenantId,
        trainDto.dataRange,
      );

      // Engineer features
      const engineeredFeatures = await this.engineerFeatures(
        trainingData,
        tenantId,
      );

      // Train the model
      const trainingResult = await this.executeTraining(
        engineeredFeatures,
        trainDto.modelType,
        trainDto.hyperparameters,
        savedModel.id,
      );

      // Evaluate model performance
      const performanceMetrics = await this.evaluateModel(
        trainingResult.model,
        engineeredFeatures.testData,
        engineeredFeatures.validationData,
      );

      // Update model with results
      await this.pricingModelRepository.update(savedModel.id, {
        status: ModelStatus.ACTIVE,
        modelPath: trainingResult.modelPath,
        performanceMetrics,
        trainingMetrics: trainingResult.metrics,
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

      // Update model status to failed if we have a saved model
      if (savedModel) {
        await this.pricingModelRepository.update(savedModel.id, {
          status: ModelStatus.FAILED,
        });
      }

      throw error;
    }
  }

  async prepareTrainingData(tenantId: string, dataRange: any): Promise<any[]> {
    try {
      // In real implementation, this would query the database for historical trip data
      // For now, we'll generate mock training data
      const mockData = this.generateMockTrainingData(1000);

      this.logger.log(
        `Prepared ${mockData.length} training samples for tenant ${tenantId}`,
      );

      return mockData;
    } catch (error) {
      this.logger.error(`Failed to prepare training data: ${error.message}`);
      throw error;
    }
  }

  async engineerFeatures(
    trainingData: any[],
    tenantId: string,
  ): Promise<{
    features: any[];
    featureNames: string[];
    scalingParams: any;
    selectedFeatures: string[];
    testData: any[];
    validationData: any[];
  }> {
    try {
      // Extract features for each training sample
      const engineeredFeatures = await Promise.all(
        trainingData.map(async (data) => {
          const baseFeatures =
            await this.featureEngineeringService.extractFeatures(
              data,
              tenantId,
            );
          const advancedFeatures =
            await this.featureEngineeringService.engineerAdvancedFeatures(
              baseFeatures,
              tenantId,
            );
          return {
            ...data,
            features: advancedFeatures,
            target: data.actualPrice,
          };
        }),
      );

      // Feature selection
      const selectedFeatures = this.selectFeatures(engineeredFeatures);

      // Calculate scaling parameters
      const scalingParams = this.calculateScalingParams(
        engineeredFeatures,
        selectedFeatures,
      );

      // Split data
      const { trainData, validationData, testData } =
        this.splitData(engineeredFeatures);

      return {
        features: trainData,
        featureNames: selectedFeatures,
        scalingParams,
        selectedFeatures,
        testData,
        validationData,
      };
    } catch (error) {
      this.logger.error(`Failed to engineer features: ${error.message}`);
      throw error;
    }
  }

  async executeTraining(
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
    try {
      this.logger.log(`Executing training for model type: ${modelType}`);

      // Mock model training (in real implementation, use ML libraries like scikit-learn, TensorFlow, etc.)
      const model = this.createMockModel(modelType, hyperparameters);

      // Simulate training process
      const trainingMetrics = await this.simulateTraining(
        model,
        engineeredFeatures.features,
        hyperparameters,
      );

      // Calculate feature importance
      const featureImportance = this.calculateFeatureImportance(
        model,
        engineeredFeatures.featureNames,
      );

      // Save model (in real implementation, serialize and save to storage)
      const modelPath = `/models/${modelId}_${Date.now()}.pkl`;

      return {
        model,
        modelPath,
        metrics: trainingMetrics,
        featureImportance,
      };
    } catch (error) {
      this.logger.error(`Training execution failed: ${error.message}`);
      throw error;
    }
  }

  async evaluateModel(
    model: any,
    testData: any[],
    validationData: any[],
  ): Promise<any> {
    try {
      // Mock model evaluation
      const testPredictions = testData.map((sample) =>
        this.mockPrediction(model, sample.features),
      );
      const validationPredictions = validationData.map((sample) =>
        this.mockPrediction(model, sample.features),
      );

      const testMetrics = this.calculateMetrics(
        testData.map((s) => s.target),
        testPredictions,
      );
      const validationMetrics = this.calculateMetrics(
        validationData.map((s) => s.target),
        validationPredictions,
      );

      return {
        ...testMetrics,
        validationMetrics,
        crossValidationScore: this.calculateCrossValidationScore(
          model,
          testData,
        ),
      };
    } catch (error) {
      this.logger.error(`Model evaluation failed: ${error.message}`);
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

      // Get new data since last training
      const lastTrainingDate = currentModel.lastTrainingDate || new Date(0);
      const newData = await this.prepareTrainingData(tenantId, {
        startDate: lastTrainingDate.toISOString(),
        endDate: new Date().toISOString(),
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
      const performanceComparison = await this.compareModels(
        currentModel.id,
        trainResult.modelId,
        tenantId,
      );

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

  async compareModels(
    model1Id: string,
    model2Id: string,
    tenantId: string,
  ): Promise<any> {
    try {
      const model1 = await this.pricingModelRepository.findOne({
        where: { id: model1Id, tenantId },
      });
      const model2 = await this.pricingModelRepository.findOne({
        where: { id: model2Id, tenantId },
      });

      if (!model1 || !model2) {
        throw new Error('One or both models not found');
      }

      // Compare performance metrics
      const accuracy1 = model1.performanceMetrics?.accuracy || 0;
      const accuracy2 = model2.performanceMetrics?.accuracy || 0;
      const mse1 = model1.performanceMetrics?.mse || 0;
      const mse2 = model2.performanceMetrics?.mse || 0;

      const newModelBetter = accuracy2 > accuracy1 && mse2 < mse1;
      const performanceImprovement =
        ((accuracy2 - accuracy1) / accuracy1) * 100;

      return {
        newModelBetter,
        performanceImprovement,
        accuracyComparison: { model1: accuracy1, model2: accuracy2 },
        mseComparison: { model1: mse1, model2: mse2 },
      };
    } catch (error) {
      this.logger.error(`Model comparison failed: ${error.message}`);
      throw error;
    }
  }

  // Helper methods

  private generateMockTrainingData(count: number): any[] {
    const data: Array<{
      tripId: string;
      loadId: string;
      truckId: string;
      driverId: string;
      distance: number;
      weight: number;
      volume: number;
      actualPrice: number;
      scheduledDate: Date;
      isRefrigerated: boolean;
      isHazmat: boolean;
      requiresLiftgate: boolean;
      requiresPalletJacks: boolean;
      requiresStraps: boolean;
      requiresTarps: boolean;
    }> = [];
    for (let i = 0; i < count; i++) {
      data.push({
        tripId: `trip-${i}`,
        loadId: `load-${i}`,
        truckId: `truck-${i}`,
        driverId: `driver-${i}`,
        distance: Math.random() * 2000 + 100,
        weight: Math.random() * 40000 + 5000,
        volume: Math.random() * 2000 + 100,
        actualPrice: Math.random() * 2000 + 500,
        scheduledDate: new Date(
          Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
        ),
        isRefrigerated: Math.random() > 0.8,
        isHazmat: Math.random() > 0.9,
        requiresLiftgate: Math.random() > 0.7,
        requiresPalletJacks: Math.random() > 0.6,
        requiresStraps: Math.random() > 0.5,
        requiresTarps: Math.random() > 0.8,
      });
    }
    return data;
  }

  private selectFeatures(engineeredFeatures: any[]): string[] {
    // Mock feature selection
    const allFeatures = Object.keys(engineeredFeatures[0]?.features || {});
    return allFeatures.filter(
      (feature) =>
        !feature.includes('interaction') &&
        !feature.includes('squared') &&
        allFeatures.length <= 20,
    );
  }

  private calculateScalingParams(
    engineeredFeatures: any[],
    selectedFeatures: string[],
  ): any {
    const scalingParams: any = {};

    selectedFeatures.forEach((feature) => {
      const values = engineeredFeatures
        .map((sample) => sample.features[feature])
        .filter((v) => v !== undefined);
      if (values.length > 0) {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance =
          values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
          values.length;
        const std = Math.sqrt(variance);

        scalingParams[feature] = { mean, std };
      }
    });

    return scalingParams;
  }

  private splitData(data: any[]): {
    trainData: any[];
    validationData: any[];
    testData: any[];
  } {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const trainSize = Math.floor(data.length * 0.7);
    const validationSize = Math.floor(data.length * 0.15);

    return {
      trainData: shuffled.slice(0, trainSize),
      validationData: shuffled.slice(trainSize, trainSize + validationSize),
      testData: shuffled.slice(trainSize + validationSize),
    };
  }

  private createMockModel(modelType: ModelType, hyperparameters: any): any {
    // Mock model creation
    return {
      type: modelType,
      hyperparameters,
      predict: (features: any) => this.mockPrediction(null, features),
      featureImportance: {},
    };
  }

  private async simulateTraining(
    model: any,
    trainingData: any[],
    hyperparameters: any,
  ): Promise<any> {
    // Simulate training process
    const startTime = Date.now();

    // Mock training iterations
    const epochs = hyperparameters?.epochs || 100;
    const lossHistory: number[] = [];
    const accuracyHistory: number[] = [];

    for (let epoch = 0; epoch < epochs; epoch++) {
      const loss = Math.random() * 0.5 + 0.1;
      const accuracy = Math.random() * 0.3 + 0.7;
      lossHistory.push(loss);
      accuracyHistory.push(accuracy);
    }

    const trainingTime = Date.now() - startTime;

    return {
      trainingTime,
      trainingSamples: trainingData.length,
      validationSamples: Math.floor(trainingData.length * 0.2),
      testSamples: Math.floor(trainingData.length * 0.1),
      epochs,
      batchSize: hyperparameters?.batchSize || 32,
      learningRate: hyperparameters?.learningRate || 0.001,
      lossHistory,
      accuracyHistory,
    };
  }

  private calculateFeatureImportance(
    model: any,
    featureNames: string[],
  ): Record<string, number> {
    // Mock feature importance calculation
    const importance: Record<string, number> = {};
    featureNames.forEach((feature) => {
      importance[feature] = Math.random();
    });

    // Normalize importance scores
    const total = Object.values(importance).reduce((sum, val) => sum + val, 0);
    Object.keys(importance).forEach((feature) => {
      importance[feature] = importance[feature] / total;
    });

    return importance;
  }

  private mockPrediction(model: any, features: any): number {
    // Mock prediction
    const basePrice = features.distance * 2.5;
    const weightFactor = features.weight / 1000;
    const marketFactor = features.marketConditions?.demandLevel || 1.0;

    return basePrice * (1 + weightFactor * 0.1) * marketFactor;
  }

  private calculateMetrics(actual: number[], predicted: number[]): any {
    const errors = actual.map((a, i) => Math.abs(a - predicted[i]));
    const squaredErrors = errors.map((e) => e * e);

    const mae = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const mse = squaredErrors.reduce((sum, e) => sum + e, 0) / errors.length;
    const rmse = Math.sqrt(mse);

    const meanActual = actual.reduce((sum, a) => sum + a, 0) / actual.length;
    const ssRes = squaredErrors.reduce((sum, e) => sum + e, 0);
    const ssTot = actual
      .map((a) => Math.pow(a - meanActual, 2))
      .reduce((sum, s) => sum + s, 0);
    const r2 = 1 - ssRes / ssTot;

    const mape =
      (errors.reduce((sum, e, i) => sum + e / actual[i], 0) / errors.length) *
      100;

    return {
      mae,
      mse,
      rmse,
      r2,
      mape,
      accuracy: Math.max(0, 1 - mae / meanActual),
    };
  }

  private calculateCrossValidationScore(model: any, data: any[]): number {
    // Mock cross-validation score
    return Math.random() * 0.3 + 0.7;
  }
}
