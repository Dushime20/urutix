import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Load } from './load.entity';
import { User } from './user.entity';

export enum PricingModel {
  MARKET_RATE = 'market_rate',
  DISTANCE_BASED = 'distance_based',
  WEIGHT_BASED = 'weight_based',
  VOLUME_BASED = 'volume_based',
  TIME_BASED = 'time_based',
  DEMAND_BASED = 'demand_based',
  COMPETITIVE = 'competitive',
  CUSTOM = 'custom',
}

export enum PricingConfidence {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum PricingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  SUPERSEDED = 'superseded',
}

@Entity('price_suggestions')
@Index(['loadId'])
@Index(['pricingModel'])
@Index(['status'])
@Index(['createdAt'])
@Index(['loadId', 'status'])
export class PriceSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loadId: string;

  @Column({
    type: 'enum',
    enum: PricingModel,
    default: PricingModel.MARKET_RATE,
  })
  pricingModel: PricingModel;

  @Column('decimal', { precision: 15, scale: 2 })
  suggestedAmount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column('decimal', { precision: 3, scale: 2 })
  confidence: number; // 0.0 to 1.0

  @Column({
    type: 'enum',
    enum: PricingConfidence,
    default: PricingConfidence.MEDIUM,
  })
  confidenceLevel: PricingConfidence;

  @Column({
    type: 'enum',
    enum: PricingStatus,
    default: PricingStatus.DRAFT,
  })
  status: PricingStatus;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minAmount?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maxAmount?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  baseRate?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  fuelSurcharge?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  accessorials?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  taxes?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  insurance?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  markup?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  discount?: number;

  // Distance and route factors
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  distanceMiles?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  distanceKm?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  estimatedHours?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  tolls?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  parking?: number;

  // Market factors
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  marketDemand?: number; // 0.0 to 1.0

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  capacityUtilization?: number; // 0.0 to 1.0

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fuelPrice?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  seasonalFactor?: number;

  // Competitive factors
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  competitorLow?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  competitorHigh?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  competitorAverage?: number;

  @Column('int', { nullable: true })
  competitorCount?: number;

  // Load-specific factors
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  weightFactor?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  volumeFactor?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  urgencyFactor?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  specialHandlingFactor?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  hazmatFactor?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  temperatureFactor?: number;

  // Input data used for calculation
  @Column('jsonb', { nullable: true })
  inputs?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  calculationSteps?: Array<{
    step: string;
    value: number;
    factor: number;
    result: number;
  }>;

  @Column('jsonb', { nullable: true })
  marketData?: {
    averageRate?: number;
    medianRate?: number;
    rateRange?: { min: number; max: number };
    demandTrend?: 'increasing' | 'decreasing' | 'stable';
    capacityTrend?: 'tight' | 'balanced' | 'loose';
  };

  @Column('text', { nullable: true })
  notes?: string;

  @Column('text', { nullable: true })
  reasoning?: string;

  @Column('text', { nullable: true })
  assumptions?: string;

  @Column('text', { nullable: true })
  limitations?: string;

  @Column('text', { nullable: true })
  recommendations?: string;

  // Expiration and validity
  @Column('timestamp with time zone', { nullable: true })
  validFrom?: Date;

  @Column('timestamp with time zone', { nullable: true })
  validUntil?: Date;

  @Column('timestamp with time zone', { nullable: true })
  acceptedAt?: Date;

  @Column('uuid', { nullable: true })
  acceptedBy?: string;

  @Column('timestamp with time zone', { nullable: true })
  rejectedAt?: Date;

  @Column('uuid', { nullable: true })
  rejectedBy?: string;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  // Metadata
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column('text', { nullable: true })
  externalReference?: string;

  @Column('text', { nullable: true })
  externalSystem?: string;

  @Column({ default: false })
  isAutomated: boolean;

  @Column('text', { nullable: true })
  automationSource?: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  processingTimeMs?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => Load, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'acceptedBy' })
  accepter: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rejectedBy' })
  rejecter: User;

  // Helper methods
  isValid(): boolean {
    if (!this.validFrom && !this.validUntil) return true;

    const now = new Date();
    if (this.validFrom && now < this.validFrom) return false;
    if (this.validUntil && now > this.validUntil) return false;

    return true;
  }

  isExpired(): boolean {
    return this.validUntil ? new Date() > this.validUntil : false;
  }

  getConfidencePercentage(): number {
    return Math.round(this.confidence * 100);
  }

  getConfidenceColor(): string {
    if (this.confidence >= 0.8) return 'green';
    if (this.confidence >= 0.6) return 'yellow';
    if (this.confidence >= 0.4) return 'orange';
    return 'red';
  }

  getFormattedAmount(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
    }).format(this.suggestedAmount);
  }

  getFormattedRange(): string {
    if (!this.minAmount || !this.maxAmount) return this.getFormattedAmount();

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
    });

    return `${formatter.format(this.minAmount)} - ${formatter.format(this.maxAmount)}`;
  }

  getPricePerMile(): number {
    if (!this.distanceMiles || this.distanceMiles === 0) return 0;
    return this.suggestedAmount / this.distanceMiles;
  }

  getPricePerKm(): number {
    if (!this.distanceKm || this.distanceKm === 0) return 0;
    return this.suggestedAmount / this.distanceKm;
  }

  getPricePerTon(): number {
    if (!this.load?.weight || this.load.weight === 0) return 0;
    return this.suggestedAmount / this.load.weight;
  }

  getPricePerCubicMeter(): number {
    if (!this.load?.volume || this.load.volume === 0) return 0;
    return this.suggestedAmount / this.load.volume;
  }

  canBeAccepted(): boolean {
    return this.status === PricingStatus.ACTIVE && this.isValid();
  }

  canBeRejected(): boolean {
    return [PricingStatus.ACTIVE, PricingStatus.DRAFT].includes(this.status);
  }

  isCompetitive(): boolean {
    if (!this.competitorAverage) return false;
    const variance =
      Math.abs(this.suggestedAmount - this.competitorAverage) /
      this.competitorAverage;
    return variance <= 0.15; // Within 15% of competitor average
  }

  getMarketPosition(): 'low' | 'average' | 'high' {
    if (!this.competitorAverage) return 'average';

    const ratio = this.suggestedAmount / this.competitorAverage;
    if (ratio < 0.9) return 'low';
    if (ratio > 1.1) return 'high';
    return 'average';
  }

  getRecommendation(): string {
    if (this.confidence >= 0.8) {
      return 'High confidence - recommended to use';
    } else if (this.confidence >= 0.6) {
      return 'Medium confidence - consider with review';
    } else {
      return 'Low confidence - requires manual review';
    }
  }
}
