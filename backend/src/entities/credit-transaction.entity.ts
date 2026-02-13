import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreditAccount } from './credit-account.entity';
import { TenantSubscription } from './tenant-subscription.entity';
import { Payment } from './payment.entity';

export enum CreditTransactionType {
  SUBSCRIPTION_GRANT = 'SUBSCRIPTION_GRANT',
  PURCHASE = 'PURCHASE',
  CONSUMPTION = 'CONSUMPTION',
  REFUND = 'REFUND',
  BONUS = 'BONUS',
  EXPIRY = 'EXPIRY',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('credit_transactions')
@Index(['tenantId', 'createdAt'])
@Index(['creditAccountId', 'createdAt'])
@Index(['type', 'createdAt'])
@Index(['referenceType', 'referenceId'])
@Index(['expiresAt'], { where: 'expires_at IS NOT NULL' })
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'credit_account_id' })
  creditAccountId: string;

  @Column({
    type: 'enum',
    enum: CreditTransactionType,
  })
  type: CreditTransactionType;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'int', name: 'balance_after' })
  balanceAfter: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'reference_type' })
  referenceType?: string;

  @Column({ type: 'uuid', nullable: true, name: 'reference_id' })
  referenceId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'subscription_id' })
  subscriptionId?: string;

  @Column({ type: 'uuid', nullable: true, name: 'payment_id' })
  paymentId?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => CreditAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'credit_account_id' })
  creditAccount: CreditAccount;

  @ManyToOne(() => TenantSubscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: TenantSubscription;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment?: Payment;

  // Virtual properties
  get isCredit(): boolean {
    return this.amount > 0;
  }

  get isDebit(): boolean {
    return this.amount < 0;
  }

  get absoluteAmount(): number {
    return Math.abs(this.amount);
  }

  get isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
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

  get transactionLabel(): string {
    switch (this.type) {
      case CreditTransactionType.SUBSCRIPTION_GRANT:
        return 'Subscription Credits';
      case CreditTransactionType.PURCHASE:
        return 'Credit Purchase';
      case CreditTransactionType.CONSUMPTION:
        return 'Feature Usage';
      case CreditTransactionType.REFUND:
        return 'Credit Refund';
      case CreditTransactionType.BONUS:
        return 'Bonus Credits';
      case CreditTransactionType.EXPIRY:
        return 'Credits Expired';
      case CreditTransactionType.ADJUSTMENT:
        return 'Manual Adjustment';
      default:
        return 'Transaction';
    }
  }
}
