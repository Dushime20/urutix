import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TenantSubscription } from './tenant-subscription.entity';

export interface PlanFeatures {
  maxTrucks?: number;
  maxUsers?: number;
  maxDrivers?: number;
  maxLoadsPerMonth?: number;
  aiMatching?: boolean;
  advancedAnalytics?: boolean;
  brokerManagement?: boolean;
  insuranceTracking?: boolean;
  apiAccess?: boolean;
  whiteLabel?: boolean;
  customIntegrations?: boolean;
  prioritySupport?: boolean;
  dedicatedSupport?: boolean;
  multiRegion?: boolean;
  [key: string]: any;
}

export interface PlanLimits {
  storageGB?: number;
  apiCallsPerMinute?: number;
  smsPerMonth?: number;
  emailsPerMonth?: number;
  [key: string]: any;
}

@Entity('subscription_plans')
@Index(['slug'], { unique: true })
@Index(['isActive', 'displayOrder'])
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_monthly' })
  priceMonthly: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'price_yearly' })
  priceYearly?: number;

  @Column({ type: 'int', default: 0, name: 'included_credits' })
  includedCredits: number;

  @Column({ type: 'jsonb', default: {} })
  features: PlanFeatures;

  @Column({ type: 'jsonb', default: {} })
  limits: PlanLimits;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => TenantSubscription, (subscription) => subscription.plan)
  subscriptions: TenantSubscription[];

  // Virtual properties
  get monthlyPrice(): number {
    return Number(this.priceMonthly);
  }

  get yearlyPrice(): number | null {
    return this.priceYearly ? Number(this.priceYearly) : null;
  }

  get yearlySavings(): number | null {
    if (!this.priceYearly) return null;
    const monthlyTotal = Number(this.priceMonthly) * 12;
    const yearlyTotal = Number(this.priceYearly);
    return monthlyTotal - yearlyTotal;
  }

  get yearlySavingsPercentage(): number | null {
    if (!this.priceYearly) return null;
    const savings = this.yearlySavings;
    if (!savings) return null;
    const monthlyTotal = Number(this.priceMonthly) * 12;
    return Math.round((savings / monthlyTotal) * 100);
  }
}
