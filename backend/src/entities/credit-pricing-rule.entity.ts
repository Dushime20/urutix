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
import { SubscriptionPlan } from './subscription-plan.entity';
import { Tenant } from './tenant.entity';

export enum PricingRuleType {
  WEIGHT = 'weight',
  DISTANCE = 'distance',
  TIME = 'time',
  FLAT = 'flat',
}

@Entity('credit_pricing_rules')
@Index(['ruleType', 'isActive'])
@Index(['planId'])
@Index(['tenantId'])
export class CreditPricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'rule_name' })
  ruleName: string;

  @Column({
    type: 'enum',
    enum: PricingRuleType,
    name: 'rule_type',
  })
  ruleType: PricingRuleType;

  @Column({ type: 'varchar', length: 20 })
  unit: string; // 'ton', 'km', 'hour', 'trip'

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'credit_cost' })
  creditCost: number;

  // Optional: Plan-specific pricing
  @Column({ type: 'uuid', nullable: true, name: 'plan_id' })
  planId?: string;

  // Optional: Tenant-specific pricing (overrides plan)
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId?: string;

  // Tiered pricing support
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'min_value' })
  minValue?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'max_value' })
  maxValue?: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  priority: number; // Higher priority rules apply first

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => SubscriptionPlan, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan?: SubscriptionPlan;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;
}
