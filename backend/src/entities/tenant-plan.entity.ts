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
  OneToMany,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { UserSubscription } from './user-subscription.entity';

export enum PlanDuration {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum PlanTargetUser {
  CARGO_OWNER = 'CARGO_OWNER',
  TRUCK_OWNER = 'TRUCK_OWNER',
  BOTH = 'BOTH',
}

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('tenant_plans')
@Index(['tenantId', 'status'])
@Index(['targetUser', 'status'])
export class TenantPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PlanTargetUser,
    default: PlanTargetUser.BOTH,
  })
  targetUser: PlanTargetUser;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'RWF' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PlanDuration,
    default: PlanDuration.MONTHLY,
  })
  duration: PlanDuration;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.ACTIVE,
  })
  status: PlanStatus;

  // Feature limits
  @Column('jsonb', { default: {} })
  features: {
    maxShipments?: number; // For cargo owners
    maxTrucks?: number; // For truck owners
    maxDrivers?: number; // For truck owners
    maxTransactions?: number;
    advancedAnalytics?: boolean;
    prioritySupport?: boolean;
    apiAccess?: boolean;
    customBranding?: boolean;
    [key: string]: any;
  };

  @Column({ nullable: true })
  maxShipments?: number;

  @Column({ nullable: true })
  maxTrucks?: number;

  @Column({ nullable: true })
  maxDrivers?: number;

  @Column({ nullable: true })
  maxTransactions?: number;

  @Column({ default: false })
  advancedAnalytics: boolean;

  @Column({ default: false })
  prioritySupport: boolean;

  @Column({ default: false })
  apiAccess: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: false })
  isPopular: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relations
  @OneToMany(() => UserSubscription, (subscription) => subscription.plan)
  subscriptions: UserSubscription[];
}
