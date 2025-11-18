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

export enum FeatureType {
  NUMERICAL = 'numerical',
  CATEGORICAL = 'categorical',
  TEMPORAL = 'temporal',
  GEOSPATIAL = 'geospatial',
  TEXT = 'text',
  BOOLEAN = 'boolean',
  COMPOSITE = 'composite',
}

export enum FeatureSource {
  TRIP_DATA = 'trip_data',
  MARKET_DATA = 'market_data',
  WEATHER_DATA = 'weather_data',
  TRAFFIC_DATA = 'traffic_data',
  FUEL_DATA = 'fuel_data',
  DRIVER_DATA = 'driver_data',
  TRUCK_DATA = 'truck_data',
  EXTERNAL_API = 'external_api',
  COMPUTED = 'computed',
}

@Entity('pricing_features')
@Index(['tenantId', 'featureType'])
@Index(['tenantId', 'featureSource'])
@Index(['featureName', 'tenantId'])
@Index(['isActive'])
export class PricingFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  featureName: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({
    type: 'enum',
    enum: FeatureType,
    default: FeatureType.NUMERICAL,
  })
  featureType: FeatureType;

  @Column({
    type: 'enum',
    enum: FeatureSource,
    default: FeatureSource.COMPUTED,
  })
  featureSource: FeatureSource;

  @Column({ type: 'varchar', length: 255 })
  dataType: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'int', default: 0 })
  importance: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  correlationWithTarget: number;

  @Column({ type: 'jsonb', nullable: true })
  statistics: {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q25: number;
    q75: number;
    missingCount: number;
    uniqueCount: number;
    skewness: number;
    kurtosis: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  preprocessing: {
    scaling: string;
    encoding: string;
    imputation: string;
    outlierHandling: string;
    normalization: string;
    transformation: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  validation: {
    minValue: number;
    maxValue: number;
    allowedValues: any[];
    pattern: string;
    customValidation: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  driftMetrics: {
    currentMean: number;
    historicalMean: number;
    driftScore: number;
    driftThreshold: number;
    lastDriftCheck: Date;
    isDrifting: boolean;
  };

  @Column({ type: 'jsonb', nullable: true })
  biasMetrics: {
    biasScore: number;
    biasThreshold: number;
    biasDetected: boolean;
    biasMitigationApplied: boolean;
    biasMitigationMethod: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  featureEngineering: {
    formula: string;
    dependencies: string[];
    computationSteps: string[];
    complexity: string;
    executionTime: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  qualityMetrics: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
    validity: number;
    overallQuality: number;
  };

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
