import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { SubscriptionPayment } from './subscription-payment.entity';
import { CreditTransaction } from './credit-transaction.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('tenant_subscriptions')
@Index(['tenantId'])
@Index(['status'])
@Index(['currentPeriodEnd'])
export class TenantSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId?: string;

  @Column({ type: 'uuid', name: 'plan_id' })
  planId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
    name: 'billing_cycle',
  })
  billingCycle: BillingCycle;

  @Column({ type: 'timestamp', name: 'current_period_start' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp', name: 'current_period_end' })
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'trial_start' })
  trialStart?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'trial_end' })
  trialEnd?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'cancelled_at' })
  cancelledAt?: Date;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason?: string;

  @Column({ type: 'boolean', default: true, name: 'auto_renew' })
  autoRenew: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'payment_method_id' })
  paymentMethodId?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'last_payment_date' })
  lastPaymentDate?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'next_payment_date' })
  nextPaymentDate?: Date;

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

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @OneToMany(() => SubscriptionPayment, (payment) => payment.subscription)
  payments: SubscriptionPayment[];

  @OneToMany(() => CreditTransaction, (transaction) => transaction.subscription)
  creditTransactions: CreditTransaction[];

  // Virtual properties
  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  get isTrial(): boolean {
    return this.status === SubscriptionStatus.TRIAL;
  }

  get isCancelled(): boolean {
    return this.status === SubscriptionStatus.CANCELLED;
  }

  get isExpired(): boolean {
    return this.status === SubscriptionStatus.EXPIRED || new Date() > this.currentPeriodEnd;
  }

  get daysUntilRenewal(): number {
    const now = new Date();
    const diff = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  get daysInTrial(): number | null {
    if (!this.trialStart || !this.trialEnd) return null;
    const diff = this.trialEnd.getTime() - this.trialStart.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  get trialDaysRemaining(): number | null {
    if (!this.trialEnd) return null;
    const now = new Date();
    const diff = this.trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
