import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../../entities/tenant.entity';

export enum ModelStatus {
  TRAINING = 'training',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
  FAILED = 'failed',
}

export enum ModelType {
  LINEAR_REGRESSION = 'linear_regression',
  RANDOM_FOREST = 'random_forest',
  GRADIENT_BOOSTING = 'gradient_boosting',
  NEURAL_NETWORK = 'neural_network',
  ENSEMBLE = 'ensemble',
  CUSTOM = 'custom',
}

export enum ModelVersion {
  V1_0 = 'v1.0',
  V1_1 = 'v1.1',
  V2_0 = 'v2.0',
  V2_1 = 'v2.1',
  BETA = 'beta',
}

@Entity('pricing_models')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'modelType'])
@Index(['version', 'status'])
@Index(['createdAt'])
export class PricingModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({
    type: 'enum',
    enum: ModelType,
    default: ModelType.GRADIENT_BOOSTING,
  })
  modelType: ModelType;

  @Column({
    type: 'enum',
    enum: ModelVersion,
    default: ModelVersion.V1_0,
  })
  version: ModelVersion;

  @Column({
    type: 'enum',
    enum: ModelStatus,
    default: ModelStatus.INACTIVE,
  })
  status: ModelStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  modelPath: string;

  @Column({ type: 'jsonb', nullable: true })
  hyperparameters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  featureConfig: {
    features: string[];
    featureImportance: Record<string, number>;
    featureScaling: Record<string, any>;
    featureSelection: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
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

  @Column({ type: 'jsonb', nullable: true })
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

  @Column({ type: 'jsonb', nullable: true })
  biasMetrics: {
    genderBias: number;
    ageBias: number;
    locationBias: number;
    incomeBias: number;
    overallBias: number;
    biasDetected: boolean;
    biasMitigationApplied: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  explainabilityMetrics: {
    shapValues: Record<string, number>;
    featureContributions: Record<string, number>;
    globalFeatureImportance: Record<string, number>;
    localFeatureImportance: Record<string, number>;
    limeExplanations: Record<string, any>;
  };

  @Column({ type: 'jsonb', nullable: true })
  aBTestConfig: {
    isABTest: boolean;
    trafficSplit: number;
    controlGroup: string;
    treatmentGroup: string;
    testStartDate: Date;
    testEndDate: Date;
    successMetrics: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  monitoringConfig: {
    driftThreshold: number;
    performanceThreshold: number;
    alertEmails: string[];
    alertWebhooks: string[];
    monitoringEnabled: boolean;
    retrainingThreshold: number;
  };

  @Column({ type: 'timestamp', nullable: true })
  lastTrainingDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastInferenceDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextRetrainingDate: Date;

  @Column({ type: 'int', default: 0 })
  totalInferences: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageInferenceTime: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averagePredictionAccuracy: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
