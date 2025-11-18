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

export enum PredictionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
}

@Entity('pricing_predictions')
@Index(['tenantId', 'modelId'])
@Index(['tenantId', 'status'])
@Index(['modelId', 'createdAt'])
@Index(['tripId'])
@Index(['predictedAt'])
export class PricingPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  modelId: string;

  @Column({ type: 'uuid', nullable: true })
  tripId: string;

  @Column({ type: 'uuid', nullable: true })
  loadId: string;

  @Column({ type: 'uuid', nullable: true })
  truckId: string;

  @Column({ type: 'uuid', nullable: true })
  driverId: string;

  @Column({
    type: 'enum',
    enum: PredictionStatus,
    default: PredictionStatus.PENDING,
  })
  status: PredictionStatus;

  // Input Features
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  distance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  weight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  volume: number;

  @Column({ type: 'varchar', length: 255 })
  originLocation: string;

  @Column({ type: 'varchar', length: 255 })
  destinationLocation: string;

  @Column({ type: 'jsonb' })
  routeComplexity: {
    highwayPercentage: number;
    urbanPercentage: number;
    ruralPercentage: number;
    tollRoads: number;
    borderCrossings: number;
    elevationChange: number;
  };

  @Column({ type: 'jsonb' })
  marketConditions: {
    demandLevel: number;
    supplyLevel: number;
    competitorPricing: number;
    seasonalFactor: number;
    fuelPrice: number;
    marketVolatility: number;
  };

  @Column({ type: 'jsonb' })
  truckAvailability: {
    availableTrucks: number;
    truckUtilization: number;
    truckType: string;
    capacityUtilization: number;
    equipmentRequirements: string[];
  };

  @Column({ type: 'jsonb' })
  driverMetrics: {
    driverRating: number;
    safetyScore: number;
    experienceYears: number;
    onTimeDeliveryRate: number;
    totalTrips: number;
    averageEarnings: number;
  };

  @Column({ type: 'jsonb' })
  environmentalFactors: {
    weatherConditions: string;
    trafficConditions: string;
    roadConditions: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
  };

  @Column({ type: 'jsonb' })
  temporalFeatures: {
    dayOfWeek: number;
    month: number;
    season: string;
    isHoliday: boolean;
    isWeekend: boolean;
    timeOfDay: number;
  };

  @Column({ type: 'jsonb' })
  cargoFeatures: {
    cargoType: string;
    isHazmat: boolean;
    isRefrigerated: boolean;
    isFragile: boolean;
    requiresSpecialHandling: boolean;
    insuranceValue: number;
  };

  // Prediction Results
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  predictedPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  actualPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  predictionAccuracy: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  predictionError: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };

  @Column({ type: 'jsonb' })
  featureContributions: Record<string, number>;

  @Column({ type: 'jsonb' })
  shapValues: Record<string, number>;

  @Column({ type: 'jsonb' })
  limeExplanation: {
    features: string[];
    weights: number[];
    intercept: number;
    score: number;
  };

  // Model Performance
  @Column({ type: 'decimal', precision: 10, scale: 4 })
  inferenceTime: number;

  @Column({ type: 'jsonb' })
  modelVersion: {
    version: string;
    modelType: string;
    trainingDate: Date;
    hyperparameters: Record<string, any>;
  };

  // Business Logic
  @Column({ type: 'boolean', default: false })
  isAccepted: boolean;

  @Column({ type: 'boolean', default: false })
  isRejected: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rejectionReason: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  acceptedPrice: number;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  acceptedBy: string;

  // A/B Testing
  @Column({ type: 'varchar', length: 50, nullable: true })
  abTestGroup: string;

  @Column({ type: 'boolean', default: false })
  isABTest: boolean;

  // Bias Detection
  @Column({ type: 'jsonb', nullable: true })
  biasMetrics: {
    genderBias: number;
    ageBias: number;
    locationBias: number;
    incomeBias: number;
    overallBias: number;
    biasDetected: boolean;
  };

  // Monitoring
  @Column({ type: 'boolean', default: false })
  isAnomaly: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  anomalyScore: number;

  @Column({ type: 'jsonb', nullable: true })
  driftMetrics: {
    featureDrift: Record<string, number>;
    predictionDrift: number;
    dataDrift: number;
    conceptDrift: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  predictedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
