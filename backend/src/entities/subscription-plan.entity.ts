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

  // Legacy pricing columns (kept for backward compatibility, can be removed later)
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price_monthly', nullable: true })
  priceMonthly?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'price_yearly' })
  priceYearly?: number;

  @Column({ type: 'int', default: 0, name: 'included_credits', nullable: true })
  includedCredits?: number;

  // New credit-based pricing columns
  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0.15, name: 'price_per_credit' })
  pricePerCredit: number;

  @Column({ type: 'int', default: -1, name: 'total_credits' })
  totalCredits: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 2.0, name: 'credits_per_ton_tenant' })
  creditsPerTonTenant: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 5.0, name: 'credits_per_ton_truck_owner' })
  creditsPerTonTruckOwner: number;

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

  // Virtual properties for credit-based system
  get creditPrice(): number {
    return Number(this.pricePerCredit);
  }

  get maxCredits(): number {
    return this.totalCredits;
  }

  get isUnlimitedCredits(): boolean {
    return this.totalCredits === -1;
  }

  get tenantCostPerTon(): number {
    return Number(this.creditsPerTonTenant);
  }

  get truckOwnerCostPerTon(): number {
    return Number(this.creditsPerTonTruckOwner);
  }

  // Calculate cost for a given weight
  calculateTenantCost(weightInTons: number): number {
    return Number(this.creditsPerTonTenant) * weightInTons;
  }

  calculateTruckOwnerCost(weightInTons: number): number {
    return Number(this.creditsPerTonTruckOwner) * weightInTons;
  }

  calculateTenantUSDCost(weightInTons: number): number {
    return this.calculateTenantCost(weightInTons) * Number(this.pricePerCredit);
  }

  // Legacy virtual properties (kept for backward compatibility)
  get monthlyPrice(): number | null {
    return this.priceMonthly ? Number(this.priceMonthly) : null;
  }

  get yearlyPrice(): number | null {
    return this.priceYearly ? Number(this.priceYearly) : null;
  }

  get yearlySavings(): number | null {
    if (!this.priceYearly || !this.priceMonthly) return null;
    const monthlyTotal = Number(this.priceMonthly) * 12;
    const yearlyTotal = Number(this.priceYearly);
    return monthlyTotal - yearlyTotal;
  }

  get yearlySavingsPercentage(): number | null {
    if (!this.priceYearly || !this.priceMonthly) return null;
    const savings = this.yearlySavings;
    if (!savings) return null;
    const monthlyTotal = Number(this.priceMonthly) * 12;
    return Math.round((savings / monthlyTotal) * 100);
  }
}
