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
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export enum InsightType {
  COST_OPTIMIZATION = 'cost_optimization',
  CARRIER_RECOMMENDATION = 'carrier_recommendation',
  ROUTE_ANALYSIS = 'route_analysis',
  DEMAND_PREDICTION = 'demand_prediction',
  RISK_ALERT = 'risk_alert',
  PERFORMANCE_IMPROVEMENT = 'performance_improvement',
  MARKET_OPPORTUNITY = 'market_opportunity',
}

export enum InsightStatus {
  ACTIVE = 'active',
  DISMISSED = 'dismissed',
  IMPLEMENTED = 'implemented',
  EXPIRED = 'expired',
}

export interface PotentialImpact {
  costSavings?: number;
  timeReduction?: number; // in hours
  efficiencyGain?: number; // percentage
  riskReduction?: number; // percentage
  revenueIncrease?: number;
  currency?: string;
}

export interface InsightRecommendation {
  action: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  steps?: string[];
  resources?: string[];
}

@Entity('analytics_insights')
@Index(['tenantId', 'cargoOwnerId'])
@Index(['tenantId', 'insightType'])
@Index(['status'])
@Index(['expiresAt'])
export class AnalyticsInsights {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'cargo_owner_id' })
  cargoOwnerId: string;

  @Column({
    type: 'enum',
    enum: InsightType,
    name: 'insight_type',
  })
  insightType: InsightType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    name: 'confidence_score',
    nullable: true,
  })
  confidenceScore?: number;

  @Column({ type: 'jsonb', name: 'potential_impact', default: {} })
  potentialImpact: PotentialImpact;

  @Column({ type: 'jsonb', name: 'data_sources', default: {} })
  dataSources: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  recommendations: InsightRecommendation[];

  @Column({
    type: 'enum',
    enum: InsightStatus,
    default: InsightStatus.ACTIVE,
  })
  status: InsightStatus;

  @Column({ type: 'timestamptz', name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cargo_owner_id' })
  cargoOwner: User;

  // Virtual properties
  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  get isActive(): boolean {
    return this.status === InsightStatus.ACTIVE && !this.isExpired;
  }

  get daysUntilExpiry(): number | null {
    if (!this.expiresAt) return null;
    const now = new Date();
    const diff = this.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  get isExpiringSoon(): boolean {
    const days = this.daysUntilExpiry;
    return days !== null && days <= 7 && days > 0;
  }

  get priorityScore(): number {
    let score = 0;
    
    // Base score from confidence
    if (this.confidenceScore) {
      score += this.confidenceScore * 50;
    }
    
    // Add score based on potential impact
    if (this.potentialImpact.costSavings) {
      score += Math.min(30, this.potentialImpact.costSavings / 100);
    }
    
    if (this.potentialImpact.timeReduction) {
      score += Math.min(20, this.potentialImpact.timeReduction);
    }
    
    // Boost score for high-priority recommendations
    const highPriorityRecs = this.recommendations.filter(r => r.priority === 'high' || r.priority === 'critical');
    score += highPriorityRecs.length * 10;
    
    return Math.min(100, score);
  }

  get insightTypeLabel(): string {
    const labels: Record<InsightType, string> = {
      [InsightType.COST_OPTIMIZATION]: 'Cost Optimization',
      [InsightType.CARRIER_RECOMMENDATION]: 'Carrier Recommendation',
      [InsightType.ROUTE_ANALYSIS]: 'Route Analysis',
      [InsightType.DEMAND_PREDICTION]: 'Demand Prediction',
      [InsightType.RISK_ALERT]: 'Risk Alert',
      [InsightType.PERFORMANCE_IMPROVEMENT]: 'Performance Improvement',
      [InsightType.MARKET_OPPORTUNITY]: 'Market Opportunity',
    };
    return labels[this.insightType] || this.insightType;
  }

  get statusLabel(): string {
    const labels: Record<InsightStatus, string> = {
      [InsightStatus.ACTIVE]: 'Active',
      [InsightStatus.DISMISSED]: 'Dismissed',
      [InsightStatus.IMPLEMENTED]: 'Implemented',
      [InsightStatus.EXPIRED]: 'Expired',
    };
    return labels[this.status] || this.status;
  }

  // Helper methods
  dismiss(): void {
    this.status = InsightStatus.DISMISSED;
  }

  implement(): void {
    this.status = InsightStatus.IMPLEMENTED;
  }

  extend(days: number): void {
    if (this.expiresAt) {
      this.expiresAt = new Date(this.expiresAt.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
  }

  addRecommendation(recommendation: InsightRecommendation): void {
    if (!this.recommendations) {
      this.recommendations = [];
    }
    this.recommendations.push(recommendation);
  }

  updatePotentialImpact(impact: Partial<PotentialImpact>): void {
    this.potentialImpact = { ...this.potentialImpact, ...impact };
  }

  // Static factory methods
  static createCostOptimizationInsight(
    tenantId: string,
    cargoOwnerId: string,
    data: {
      title: string;
      description?: string;
      potentialSavings: number;
      confidence: number;
      recommendations: InsightRecommendation[];
    }
  ): Partial<AnalyticsInsights> {
    return {
      tenantId,
      cargoOwnerId,
      insightType: InsightType.COST_OPTIMIZATION,
      title: data.title,
      description: data.description,
      confidenceScore: data.confidence,
      potentialImpact: {
        costSavings: data.potentialSavings,
        currency: 'USD',
      },
      recommendations: data.recommendations,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  static createCarrierRecommendationInsight(
    tenantId: string,
    cargoOwnerId: string,
    data: {
      title: string;
      description?: string;
      carrierId: string;
      confidence: number;
      recommendations: InsightRecommendation[];
    }
  ): Partial<AnalyticsInsights> {
    return {
      tenantId,
      cargoOwnerId,
      insightType: InsightType.CARRIER_RECOMMENDATION,
      title: data.title,
      description: data.description,
      confidenceScore: data.confidence,
      recommendations: data.recommendations,
      dataSources: {
        carrierId: data.carrierId,
      },
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    };
  }

  static createRouteAnalysisInsight(
    tenantId: string,
    cargoOwnerId: string,
    data: {
      title: string;
      description?: string;
      routeHash: string;
      timeReduction?: number;
      costSavings?: number;
      confidence: number;
      recommendations: InsightRecommendation[];
    }
  ): Partial<AnalyticsInsights> {
    return {
      tenantId,
      cargoOwnerId,
      insightType: InsightType.ROUTE_ANALYSIS,
      title: data.title,
      description: data.description,
      confidenceScore: data.confidence,
      potentialImpact: {
        timeReduction: data.timeReduction,
        costSavings: data.costSavings,
        currency: 'USD',
      },
      recommendations: data.recommendations,
      dataSources: {
        routeHash: data.routeHash,
      },
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    };
  }

  static createRiskAlertInsight(
    tenantId: string,
    cargoOwnerId: string,
    data: {
      title: string;
      description?: string;
      riskType: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      confidence: number;
      recommendations: InsightRecommendation[];
    }
  ): Partial<AnalyticsInsights> {
    return {
      tenantId,
      cargoOwnerId,
      insightType: InsightType.RISK_ALERT,
      title: data.title,
      description: data.description,
      confidenceScore: data.confidence,
      recommendations: data.recommendations,
      metadata: {
        riskType: data.riskType,
        severity: data.severity,
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days for urgent alerts
    };
  }
}