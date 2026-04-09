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
import { User } from './user.entity';
import { CreditTransaction } from './credit-transaction.entity';

@Entity('credit_accounts')
@Index(['tenantId', 'userId'], { unique: true })
@Index(['currentBalance'])
@Index(['nextRefreshDate'])
export class CreditAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @Column({ type: 'int', default: 0, name: 'current_balance' })
  currentBalance: number;

  @Column({ type: 'int', default: 0, name: 'subscription_credits' })
  subscriptionCredits: number;

  @Column({ type: 'int', default: 0, name: 'purchased_credits' })
  purchasedCredits: number;

  @Column({ type: 'int', default: 0, name: 'bonus_credits' })
  bonusCredits: number;

  @Column({ type: 'int', default: 0, name: 'lifetime_earned' })
  lifetimeEarned: number;

  @Column({ type: 'int', default: 0, name: 'lifetime_spent' })
  lifetimeSpent: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_refresh_date' })
  lastRefreshDate?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'next_refresh_date' })
  nextRefreshDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => CreditTransaction, (transaction) => transaction.creditAccount)
  transactions: CreditTransaction[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Virtual properties
  get hasCredits(): boolean {
    return this.currentBalance > 0;
  }

  get isLowBalance(): boolean {
    // Low balance if less than 20% of typical monthly allocation (assuming 500 credits)
    return this.currentBalance < 100;
  }

  get balancePercentage(): number {
    // Percentage of balance relative to typical monthly allocation
    const typicalMonthly = 500; // Starter plan default
    return Math.min(100, Math.round((this.currentBalance / typicalMonthly) * 100));
  }

  get creditBreakdown(): {
    subscription: number;
    purchased: number;
    bonus: number;
    total: number;
  } {
    return {
      subscription: this.subscriptionCredits,
      purchased: this.purchasedCredits,
      bonus: this.bonusCredits,
      total: this.currentBalance,
    };
  }

  get usageStats(): {
    earned: number;
    spent: number;
    remaining: number;
    usageRate: number;
  } {
    const usageRate = this.lifetimeEarned > 0
      ? Math.round((this.lifetimeSpent / this.lifetimeEarned) * 100)
      : 0;

    return {
      earned: this.lifetimeEarned,
      spent: this.lifetimeSpent,
      remaining: this.currentBalance,
      usageRate,
    };
  }

  // Helper method to check if sufficient credits
  hasSufficientCredits(amount: number): boolean {
    return this.currentBalance >= amount;
  }

  // Helper method to calculate days until refresh
  daysUntilRefresh(): number | null {
    if (!this.nextRefreshDate) return null;
    const now = new Date();
    const diff = this.nextRefreshDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
