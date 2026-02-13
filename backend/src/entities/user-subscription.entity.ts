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
import { User } from './user.entity';
import { TenantPlan } from './tenant-plan.entity';
import { Tenant } from './tenant.entity';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  TRIAL = 'TRIAL',
}

@Entity('user_subscriptions')
@Index(['userId', 'status'])
@Index(['tenantId', 'status'])
@Index(['planId', 'status'])
@Index(['expiresAt'])
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  @Index()
  planId: string;

  @ManyToOne(() => TenantPlan, (plan) => plan.subscriptions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: TenantPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column()
  startDate: Date;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true })
  suspendedAt?: Date;

  @Column({ nullable: true })
  suspendedReason?: string;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ nullable: true })
  nextBillingDate?: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  amountPaid: number;

  @Column({ default: 'RWF' })
  currency: string;

  @Column({ nullable: true })
  paymentId?: string;

  @Column({ nullable: true })
  invoiceId?: string;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
