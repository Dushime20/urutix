import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface PlanMultipliers {
  starter?: number;
  professional?: number;
  enterprise?: number;
  [key: string]: number | undefined;
}

@Entity('feature_credit_costs')
@Index(['featureCode'], { unique: true })
@Index(['isActive'])
export class FeatureCreditCost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true, name: 'feature_code' })
  featureCode: string;

  @Column({ length: 255, name: 'feature_name' })
  featureName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', name: 'base_cost' })
  baseCost: number;

  @Column({ type: 'jsonb', default: {}, name: 'plan_multipliers' })
  planMultipliers: PlanMultipliers;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to calculate cost for a specific plan
  getCostForPlan(planSlug: string): number {
    const multiplier = this.planMultipliers[planSlug] || 1.0;
    return Math.ceil(this.baseCost * multiplier);
  }

  // Helper method to check if feature is free
  get isFree(): boolean {
    return this.baseCost === 0;
  }

  // Helper method to get discount for enterprise
  get enterpriseDiscount(): number {
    const enterpriseMultiplier = this.planMultipliers.enterprise || 1.0;
    if (enterpriseMultiplier >= 1.0) return 0;
    return Math.round((1 - enterpriseMultiplier) * 100);
  }
}
