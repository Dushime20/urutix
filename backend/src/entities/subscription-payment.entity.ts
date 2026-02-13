import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TenantSubscription } from './tenant-subscription.entity';
import { Payment } from './payment.entity';

@Entity('subscription_payments')
@Index(['subscriptionId', 'createdAt'])
@Index(['paymentId'])
@Index(['invoiceNumber'], { unique: true })
export class SubscriptionPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'subscription_id' })
  subscriptionId: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId: string;

  @Column({ type: 'timestamp', name: 'billing_period_start' })
  billingPeriodStart: Date;

  @Column({ type: 'timestamp', name: 'billing_period_end' })
  billingPeriodEnd: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'int', default: 0, name: 'credits_granted' })
  creditsGranted: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true, name: 'invoice_number' })
  invoiceNumber?: string;

  @Column({ type: 'text', nullable: true, name: 'invoice_url' })
  invoiceUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => TenantSubscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription: TenantSubscription;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  // Virtual properties
  get billingPeriodDays(): number {
    const diff = this.billingPeriodEnd.getTime() - this.billingPeriodStart.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  get formattedAmount(): string {
    return `$${Number(this.amount).toFixed(2)}`;
  }

  get billingPeriodLabel(): string {
    const start = this.billingPeriodStart.toLocaleDateString();
    const end = this.billingPeriodEnd.toLocaleDateString();
    return `${start} - ${end}`;
  }
}
