import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Load } from './load.entity';
import { Trip } from './trip.entity';
import { Tenant } from './tenant.entity';

// ==================== SMART MATCHING INTELLIGENCE ====================

export enum MatchRecommendationType {
  AI_POWERED = 'AI_POWERED',
  ROUTE_OPTIMIZED = 'ROUTE_OPTIMIZED',
  BUNDLING_OPPORTUNITY = 'BUNDLING_OPPORTUNITY',
  BACKHAUL_IDENTIFIED = 'BACKHAUL_IDENTIFIED',
  COST_OPTIMIZED = 'COST_OPTIMIZED',
}

export enum MatchStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

@Entity('broker_match_recommendations')
@Index(['brokerId', 'loadId'])
@Index(['brokerId', 'status'])
@Index(['transporterId', 'status'])
export class BrokerMatchRecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  brokerId: string;

  @Column()
  loadId: string;

  @Column({ nullable: true })
  transporterId?: string;

  @Column({ nullable: true })
  truckId?: string;

  @Column({
    type: 'enum',
    enum: MatchRecommendationType,
  })
  recommendationType: MatchRecommendationType;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @Column('decimal', { precision: 5, scale: 2 })
  matchScore: number; // 0-100

  @Column('decimal', { precision: 5, scale: 2 })
  confidenceLevel: number; // 0-100

  @Column('jsonb')
  matchingFactors: {
    distanceScore?: number;
    capacityUtilization?: number;
    routeEfficiency?: number;
    costSavings?: number;
    reliabilityScore?: number;
    historicalPerformance?: number;
    equipmentMatch?: number;
    availabilityScore?: number;
  };

  @Column('jsonb', { nullable: true })
  routeOptimization?: {
    optimizedDistance: number;
    estimatedTime: number;
    fuelSavings: number;
    routeDetails: any[];
  };

  @Column('jsonb', { nullable: true })
  bundlingOpportunity?: {
    bundledLoadIds: string[];
    totalSavings: number;
    sharedRoute: boolean;
    combinedDistance: number;
  };

  @Column('jsonb', { nullable: true })
  backhaulOpportunity?: {
    returnLoadId?: string;
    returnRouteDistance: number;
    totalRevenue: number;
    emptyMilesSaved: number;
  };

  @Column('jsonb', { nullable: true })
  aiInsights: {
    predictedSuccessRate: number;
    riskFactors: string[];
    recommendations: string[];
    alternativeMatches?: Array<{
      transporterId: string;
      score: number;
      reason: string;
    }>;
  };

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User')
  broker: User;

  @ManyToOne('Load')
  load: Load;
}

// ==================== MARKET INTELLIGENCE ====================

export enum MarketRateType {
  REAL_TIME = 'REAL_TIME',
  HISTORICAL = 'HISTORICAL',
  PREDICTED = 'PREDICTED',
}

@Entity('broker_market_intelligence')
@Index(['brokerId', 'route'])
@Index(['brokerId', 'createdAt'])
@Index(['route', 'rateType'])
export class BrokerMarketIntelligence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  brokerId: string;

  @Column({
    type: 'enum',
    enum: MarketRateType,
  })
  rateType: MarketRateType;

  @Column('jsonb')
  route: {
    origin: {
      city: string;
      state?: string;
      country: string;
      coordinates?: { lat: number; lng: number };
    };
    destination: {
      city: string;
      state?: string;
      country: string;
      coordinates?: { lat: number; lng: number };
    };
    distance: number; // km
  };

  @Column('decimal', { precision: 12, scale: 2 })
  currentRate: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  averageRate?: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  medianRate?: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  minRate?: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  maxRate?: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  recommendedRate?: number;

  @Column('jsonb', { nullable: true })
  historicalTrends?: {
    last7Days: number[];
    last30Days: number[];
    last90Days: number[];
    lastYear: number[];
  };

  @Column('jsonb', { nullable: true })
  demandForecast?: {
    next7Days: number;
    next30Days: number;
    confidence: number;
    factors: string[];
  };

  @Column('jsonb', { nullable: true })
  rateRecommendations?: {
    competitiveRate: number;
    premiumRate: number;
    budgetRate: number;
    reasoning: string;
  };

  @Column('jsonb', { nullable: true })
  marketFactors: {
    seasonality?: number;
    demandLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    supplyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    fuelPrice?: number;
    weatherImpact?: number;
    competitionLevel?: number;
  };

  @Column('jsonb', { nullable: true })
  pricingInsights: {
    priceTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    volatility: number;
    bestTimeToBook?: Date;
    priceChangePrediction?: {
      direction: 'UP' | 'DOWN';
      percentage: number;
      timeframe: string;
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User')
  broker: User;
}

// ==================== CREDIT MANAGEMENT ====================

export enum CreditStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
}

export enum PaymentTermType {
  NET_15 = 'NET_15',
  NET_30 = 'NET_30',
  NET_45 = 'NET_45',
  NET_60 = 'NET_60',
  DUE_ON_RECEIPT = 'DUE_ON_RECEIPT',
  CUSTOM = 'CUSTOM',
}

@Entity('broker_transporter_credit')
@Index(['brokerId', 'transporterId'])
@Index(['transporterId', 'status'])
export class BrokerTransporterCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  brokerId: string;

  @Column()
  transporterId: string;

  @Column({
    type: 'enum',
    enum: CreditStatus,
    default: CreditStatus.PENDING,
  })
  status: CreditStatus;

  @Column('decimal', { precision: 12, scale: 2 })
  creditLimit: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  currentBalance: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  availableCredit: number;

  @Column({
    type: 'enum',
    enum: PaymentTermType,
  })
  paymentTerms: PaymentTermType;

  @Column('int', { nullable: true })
  customPaymentDays?: number;

  @Column('jsonb', { nullable: true })
  creditCheck: {
    creditScore?: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    checkDate: Date;
    checkProvider?: string;
    reportUrl?: string;
    factors: string[];
  };

  @Column('jsonb', { nullable: true })
  paymentHistory: {
    totalTransactions: number;
    onTimePayments: number;
    latePayments: number;
    averageDaysToPay: number;
    lastPaymentDate?: Date;
    paymentTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };

  @Column('jsonb', { nullable: true })
  riskAssessment: {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    riskFactors: string[];
    recommendations: string[];
    lastAssessedAt: Date;
  };

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User')
  broker: User;

  @ManyToOne('User')
  transporter: User;
}

// ==================== MULTI-STOP LOAD MANAGEMENT ====================

@Entity('broker_multi_stop_loads')
@Index(['brokerId', 'loadId'])
export class BrokerMultiStopLoad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  brokerId: string;

  @Column()
  loadId: string;

  @Column('jsonb')
  stops: Array<{
    stopId: string;
    sequence: number;
    type: 'PICKUP' | 'DELIVERY' | 'STOP';
    location: {
      name: string;
      address: string;
      coordinates: { lat: number; lng: number };
      city?: string;
      state?: string;
    };
    scheduledTime: Date;
    estimatedDuration: number; // minutes
    cargoDetails?: {
      weight?: number;
      volume?: number;
      pieces?: number;
    };
    requirements?: string[];
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
    actualArrival?: Date;
    actualDeparture?: Date;
  }>;

  @Column('jsonb', { nullable: true })
  optimizedRoute?: {
    totalDistance: number;
    totalTime: number;
    routeSequence: number[];
    waypoints: Array<{
      stopId: string;
      coordinates: { lat: number; lng: number };
      estimatedArrival: Date;
    }>;
    optimizationMethod: 'DISTANCE' | 'TIME' | 'COST' | 'BALANCED';
  };

  @Column('jsonb', { nullable: true })
  routeOptimization: {
    originalDistance: number;
    optimizedDistance: number;
    distanceSavings: number;
    originalTime: number;
    optimizedTime: number;
    timeSavings: number;
    fuelSavings: number;
    optimizationScore: number;
  };

  @Column('jsonb', { nullable: true })
  stopSequenceOptimization?: {
    currentSequence: number[];
    optimizedSequence: number[];
    improvement: number; // percentage
    reasoning: string[];
  };

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User')
  broker: User;

  @ManyToOne('Load')
  load: Load;
}

// ==================== PERFORMANCE ANALYTICS ====================

@Entity('broker_transporter_performance')
@Index(['brokerId', 'transporterId'])
@Index(['transporterId', 'calculatedAt'])
export class BrokerTransporterPerformance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  brokerId: string;

  @Column()
  transporterId: string;

  @Column('decimal', { precision: 5, scale: 2 })
  reliabilityScore: number; // 0-100

  @Column('decimal', { precision: 5, scale: 2 })
  onTimeDeliveryRate: number; // percentage

  @Column('decimal', { precision: 5, scale: 2 })
  damageRate: number; // percentage

  @Column('decimal', { precision: 5, scale: 2 })
  predictiveMatchSuccess: number; // 0-100

  @Column('jsonb')
  reliabilityMetrics: {
    totalLoads: number;
    completedLoads: number;
    cancelledLoads: number;
    completionRate: number;
    averageResponseTime: number; // hours
    communicationScore: number;
    professionalismScore: number;
  };

  @Column('jsonb')
  onTimeTracking: {
    totalDeliveries: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    averageDelayMinutes: number;
    onTimePercentage: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };

  @Column('jsonb')
  damageAnalysis: {
    totalLoads: number;
    loadsWithDamage: number;
    damageRate: number;
    averageDamageValue: number;
    damageTypes: Record<string, number>;
    severityDistribution: {
      minor: number;
      moderate: number;
      severe: number;
    };
  };

  @Column('jsonb')
  predictiveMetrics: {
    matchSuccessRate: number;
    acceptanceRate: number;
    completionProbability: number;
    riskScore: number;
    recommendedForLoads: boolean;
    confidenceLevel: number;
  };

  @Column('jsonb', { nullable: true })
  historicalTrends?: {
    reliabilityTrend: number[];
    onTimeTrend: number[];
    damageTrend: number[];
    periods: string[];
  };

  @Column('jsonb', { nullable: true })
  comparativeAnalysis?: {
    industryAverage: {
      reliability: number;
      onTime: number;
      damage: number;
    };
    percentileRank: {
      reliability: number;
      onTime: number;
      damage: number;
    };
  };

  @Column('timestamp')
  calculatedAt: Date;

  @Column('timestamp', { nullable: true })
  lastLoadDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne('User')
  broker: User;

  @ManyToOne('User')
  transporter: User;
}

