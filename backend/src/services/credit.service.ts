import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CreditAccount } from '../entities/credit-account.entity';
import {
  CreditTransaction,
  CreditTransactionType,
} from '../entities/credit-transaction.entity';
import { FeatureCreditCost } from '../entities/feature-credit-cost.entity';

export interface CreditBalanceResponse {
  currentBalance: number;
  subscriptionCredits: number;
  purchasedCredits: number;
  bonusCredits: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lastRefreshDate: Date | null;
  nextRefreshDate: Date | null;
}

export interface ConsumeCreditsDto {
  tenantId: string;
  amount: number;
  featureCode: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  userId?: string;
}

export interface CreditTransactionFilters {
  type?: CreditTransactionType;
  days?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  userId?: string;
}

@Injectable()
export class CreditService {
  constructor(
    @InjectRepository(CreditAccount)
    private creditAccountRepository: Repository<CreditAccount>,
    @InjectRepository(CreditTransaction)
    private creditTransactionRepository: Repository<CreditTransaction>,
    @InjectRepository(FeatureCreditCost)
    private featureCreditCostRepository: Repository<FeatureCreditCost>,
  ) { }

  /**
   * Get or create credit account for tenant or user
   */
  async getOrCreateCreditAccount(tenantId: string, userId?: string): Promise<CreditAccount> {
    const where: any = { tenantId };
    if (userId) {
      where.userId = userId;
    } else {
      where.userId = null; // Important for tenant-level account
    }

    let account = await this.creditAccountRepository.findOne({
      where,
    });

    if (!account) {
      account = this.creditAccountRepository.create({
        tenantId,
        userId: userId || null,
        currentBalance: 0,
        subscriptionCredits: 0,
        purchasedCredits: 0,
        bonusCredits: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
      });
      account = await this.creditAccountRepository.save(account);
    }

    return account;
  }

  /**
   * Get credit balance for tenant or user
   */
  async getCreditBalance(tenantId: string, userId?: string): Promise<CreditBalanceResponse> {
    const account = await this.getOrCreateCreditAccount(tenantId, userId);

    return {
      currentBalance: account.currentBalance,
      subscriptionCredits: account.subscriptionCredits,
      purchasedCredits: account.purchasedCredits,
      bonusCredits: account.bonusCredits,
      lifetimeEarned: account.lifetimeEarned,
      lifetimeSpent: account.lifetimeSpent,
      lastRefreshDate: account.lastRefreshDate || null,
      nextRefreshDate: account.nextRefreshDate || null,
    };
  }

  /**
   * Check if tenant or user has sufficient credits
   */
  async hasSufficientCredits(tenantId: string, amount: number, userId?: string): Promise<boolean> {
    const account = await this.getOrCreateCreditAccount(tenantId, userId);
    return account.currentBalance >= amount;
  }

  /**
   * Get feature credit cost
   */
  async getFeatureCost(featureCode: string, planSlug?: string): Promise<number> {
    const feature = await this.featureCreditCostRepository.findOne({
      where: { featureCode, isActive: true },
    });

    if (!feature) {
      throw new NotFoundException(`Feature cost not found: ${featureCode}`);
    }

    if (planSlug) {
      return feature.getCostForPlan(planSlug);
    }

    return feature.baseCost;
  }

  /**
   * Grant subscription credits (monthly refresh)
   */
  async grantSubscriptionCredits(
    tenantId: string,
    amount: number,
    subscriptionId: string,
    expiresAt: Date,
    userId?: string,
  ): Promise<CreditTransaction> {
    const account = await this.getOrCreateCreditAccount(tenantId, userId);

    // Update account
    account.subscriptionCredits += amount;
    account.currentBalance += amount;
    account.lifetimeEarned += amount;
    account.lastRefreshDate = new Date();
    account.nextRefreshDate = expiresAt;

    await this.creditAccountRepository.save(account);

    // Create transaction
    const transaction = this.creditTransactionRepository.create({
      tenantId,
      userId: userId || null,
      creditAccountId: account.id,
      type: CreditTransactionType.SUBSCRIPTION_GRANT,
      amount,
      balanceAfter: account.currentBalance,
      description: `Monthly subscription credits granted`,
      subscriptionId,
      expiresAt,
      metadata: { grantedAt: new Date().toISOString() },
    });

    return this.creditTransactionRepository.save(transaction);
  }

  /**
   * Grant purchased credits
   */
  async grantPurchasedCredits(
    tenantId: string,
    amount: number,
    paymentId: string,
    packageName: string,
    userId?: string,
  ): Promise<CreditTransaction> {
    const account = await this.getOrCreateCreditAccount(tenantId, userId);

    // Purchased credits expire in 12 months
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 12);

    // Update account
    account.purchasedCredits += amount;
    account.currentBalance += amount;
    account.lifetimeEarned += amount;

    await this.creditAccountRepository.save(account);

    // Create transaction
    const transaction = this.creditTransactionRepository.create({
      tenantId,
      userId: userId || null,
      creditAccountId: account.id,
      type: CreditTransactionType.PURCHASE,
      amount,
      balanceAfter: account.currentBalance,
      description: `Purchased ${packageName}`,
      paymentId,
      expiresAt,
      metadata: { packageName, purchasedAt: new Date().toISOString() },
    });

    return this.creditTransactionRepository.save(transaction);
  }

  /**
   * Grant bonus credits (promotions, referrals)
   */
  async grantBonusCredits(
    tenantId: string,
    amount: number,
    reason: string,
    expiresAt?: Date,
    userId?: string,
  ): Promise<CreditTransaction> {
    const account = await this.getOrCreateCreditAccount(tenantId, userId);

    // Default expiry: 6 months
    const expiry = expiresAt || new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);

    // Update account
    account.bonusCredits += amount;
    account.currentBalance += amount;
    account.lifetimeEarned += amount;

    await this.creditAccountRepository.save(account);

    // Create transaction
    const transaction = this.creditTransactionRepository.create({
      tenantId,
      userId: userId || null,
      creditAccountId: account.id,
      type: CreditTransactionType.BONUS,
      amount,
      balanceAfter: account.currentBalance,
      description: reason,
      expiresAt: expiry,
      metadata: { grantedAt: new Date().toISOString() },
    });

    return this.creditTransactionRepository.save(transaction);
  }

  /**
   * Consume credits for feature usage
   */
  async consumeCredits(dto: ConsumeCreditsDto): Promise<CreditTransaction> {
    const account = await this.getOrCreateCreditAccount(dto.tenantId, dto.userId);

    // Check sufficient balance
    if (account.currentBalance < dto.amount) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${dto.amount}, Available: ${account.currentBalance}`,
      );
    }

    // Deduct from appropriate buckets (priority: bonus > subscription > purchased)
    let remaining = dto.amount;

    if (account.bonusCredits > 0) {
      const deduct = Math.min(remaining, account.bonusCredits);
      account.bonusCredits -= deduct;
      remaining -= deduct;
    }

    if (remaining > 0 && account.subscriptionCredits > 0) {
      const deduct = Math.min(remaining, account.subscriptionCredits);
      account.subscriptionCredits -= deduct;
      remaining -= deduct;
    }

    if (remaining > 0 && account.purchasedCredits > 0) {
      const deduct = Math.min(remaining, account.purchasedCredits);
      account.purchasedCredits -= deduct;
      remaining -= deduct;
    }

    // Update account
    account.currentBalance -= dto.amount;
    account.lifetimeSpent += dto.amount;

    await this.creditAccountRepository.save(account);

    // Create transaction
    const transaction = this.creditTransactionRepository.create({
      tenantId: dto.tenantId,
      userId: dto.userId || null,
      creditAccountId: account.id,
      type: CreditTransactionType.CONSUMPTION,
      amount: -dto.amount, // Negative for consumption
      balanceAfter: account.currentBalance,
      description: `Used ${dto.amount} credits for ${dto.featureCode}`,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      metadata: {
        featureCode: dto.featureCode,
        consumedAt: new Date().toISOString(),
        ...dto.metadata,
      },
    });

    return this.creditTransactionRepository.save(transaction);
  }

  /**
   * Refund credits
   */
  async refundCredits(
    tenantId: string,
    amount: number,
    reason: string,
    originalTransactionId?: string,
    userId?: string,
  ): Promise<CreditTransaction> {
    const account = await this.getOrCreateCreditAccount(tenantId, userId);

    // Add to purchased credits bucket
    account.purchasedCredits += amount;
    account.currentBalance += amount;

    await this.creditAccountRepository.save(account);

    // Create transaction
    const transaction = this.creditTransactionRepository.create({
      tenantId,
      userId: userId || null,
      creditAccountId: account.id,
      type: CreditTransactionType.REFUND,
      amount,
      balanceAfter: account.currentBalance,
      description: reason,
      metadata: {
        originalTransactionId,
        refundedAt: new Date().toISOString(),
      },
    });

    return this.creditTransactionRepository.save(transaction);
  }

  /**
   * Manual credit adjustment (admin only)
   */
  async adjustCredits(
    tenantId: string,
    amount: number,
    reason: string,
    adminId: string,
    userId?: string,
  ): Promise<CreditTransaction> {
    const account = await this.getOrCreateCreditAccount(tenantId, userId);

    // Determine which bucket to adjust
    if (amount > 0) {
      account.bonusCredits += amount;
      account.lifetimeEarned += amount;
    } else {
      // Deduct from current balance
      const deductAmount = Math.abs(amount);
      if (account.currentBalance < deductAmount) {
        throw new BadRequestException('Cannot adjust below zero balance');
      }
      // Deduct proportionally from all buckets
      const ratio = deductAmount / account.currentBalance;
      account.bonusCredits = Math.floor(account.bonusCredits * (1 - ratio));
      account.subscriptionCredits = Math.floor(account.subscriptionCredits * (1 - ratio));
      account.purchasedCredits = Math.floor(account.purchasedCredits * (1 - ratio));
    }

    account.currentBalance += amount;

    await this.creditAccountRepository.save(account);

    // Create transaction
    const transaction = this.creditTransactionRepository.create({
      tenantId,
      userId: userId || null,
      creditAccountId: account.id,
      type: CreditTransactionType.ADJUSTMENT,
      amount,
      balanceAfter: account.currentBalance,
      description: reason,
      metadata: {
        adminId,
        adjustedAt: new Date().toISOString(),
      },
    });

    return this.creditTransactionRepository.save(transaction);
  }

  /**
   * Expire old credits (called by scheduled job)
   */
  async expireCredits(): Promise<number> {
    const now = new Date();
    let totalExpired = 0;

    // Find all transactions with expired credits that haven't been processed
    const expiredTransactions = await this.creditTransactionRepository.find({
      where: {
        expiresAt: LessThan(now),
        type: CreditTransactionType.SUBSCRIPTION_GRANT,
      },
      relations: ['creditAccount'],
    });

    for (const transaction of expiredTransactions) {
      // Check if already expired
      const existingExpiry = await this.creditTransactionRepository.findOne({
        where: {
          tenantId: transaction.tenantId,
          type: CreditTransactionType.EXPIRY,
          metadata: { originalTransactionId: transaction.id } as any,
        },
      });

      if (existingExpiry) continue; // Already processed

      const account = transaction.creditAccount;
      const expireAmount = Math.min(transaction.amount, account.subscriptionCredits);

      if (expireAmount > 0) {
        // Deduct from subscription credits
        account.subscriptionCredits -= expireAmount;
        account.currentBalance -= expireAmount;

        await this.creditAccountRepository.save(account);

        // Create expiry transaction
        await this.creditTransactionRepository.save({
          tenantId: transaction.tenantId,
          creditAccountId: account.id,
          type: CreditTransactionType.EXPIRY,
          amount: -expireAmount,
          balanceAfter: account.currentBalance,
          description: `${expireAmount} subscription credits expired`,
          metadata: {
            originalTransactionId: transaction.id,
            expiredAt: now.toISOString(),
          },
        });

        totalExpired += expireAmount;
      }
    }

    return totalExpired;
  }

  /**
   * Get credit transaction history
   */
  async getTransactionHistory(
    tenantId: string,
    filters?: CreditTransactionFilters,
  ): Promise<{ transactions: CreditTransaction[]; total: number }> {
    const query = this.creditTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.creditAccount', 'creditAccount')
      .leftJoinAndSelect('creditAccount.tenant', 'tenant')
      .where('transaction.tenantId = :tenantId', { tenantId });

    if (filters?.userId) {
      query.andWhere('transaction.userId = :userId', { userId: filters.userId });
    } else if (filters?.userId === null) {
      query.andWhere('transaction.userId IS NULL');
    }

    query.orderBy('transaction.createdAt', 'DESC');

    if (filters?.type) {
      query.andWhere('transaction.type = :type', { type: filters.type });
    }

    // Handle days filter (e.g., last 30 days)
    if (filters?.days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filters.days);
      query.andWhere('transaction.createdAt >= :startDate', { startDate });
    }

    if (filters?.startDate) {
      query.andWhere('transaction.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('transaction.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const transactions = await query.getMany();

    return { transactions, total };
  }

  /**
   * Get low balance tenants (for notifications)
   */
  async getLowBalanceTenants(threshold: number = 100): Promise<CreditAccount[]> {
    return this.creditAccountRepository
      .createQueryBuilder('account')
      .where('account.currentBalance < :threshold', { threshold })
      .andWhere('account.currentBalance > 0')
      .getMany();
  }

  /**
   * Get credit usage statistics
   */
  async getUsageStatistics(
    tenantId: string,
    days: number = 30,
  ): Promise<{
    totalConsumed: number;
    averageDaily: number;
    topFeatures: Array<{ featureCode: string; count: number; totalCredits: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.creditTransactionRepository.find({
      where: {
        tenantId,
        type: CreditTransactionType.CONSUMPTION,
        createdAt: LessThan(startDate) as any,
      },
    });

    const totalConsumed = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0,
    );
    const averageDaily = Math.round(totalConsumed / days);

    // Group by feature
    const featureMap = new Map<
      string,
      { count: number; totalCredits: number }
    >();

    transactions.forEach((t) => {
      const featureCode = t.metadata?.featureCode || 'unknown';
      const existing = featureMap.get(featureCode) || {
        count: 0,
        totalCredits: 0,
      };
      existing.count++;
      existing.totalCredits += Math.abs(t.amount);
      featureMap.set(featureCode, existing);
    });

    const topFeatures = Array.from(featureMap.entries())
      .map(([featureCode, stats]) => ({ featureCode, ...stats }))
      .sort((a, b) => b.totalCredits - a.totalCredits)
      .slice(0, 10);

    return {
      totalConsumed,
      averageDaily,
      topFeatures,
    };
  }

  /**
   * Get all credit transactions (admin only)
   */
  async getAllTransactions(filters?: {
    type?: CreditTransactionType;
    startDate?: Date;
    endDate?: Date;
    days?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: CreditTransaction[]; total: number }> {
    const query = this.creditTransactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.creditAccount', 'creditAccount')
      .leftJoinAndSelect('creditAccount.tenant', 'tenant')
      .orderBy('transaction.createdAt', 'DESC');

    if (filters?.type) {
      query.andWhere('transaction.type = :type', { type: filters.type });
    }

    // Handle days filter (e.g., last 30 days)
    if (filters?.days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filters.days);
      query.andWhere('transaction.createdAt >= :startDate', { startDate });
    }

    if (filters?.startDate) {
      query.andWhere('transaction.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      query.andWhere('transaction.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const transactions = await query.getMany();

    return { transactions, total };
  }

  /**
   * Deduct credits with validation (for weight-based consumption)
   */
  async deductCredits(dto: {
    tenantId: string;
    amount: number;
    description: string;
    referenceType?: string;
    referenceId?: string;
    calculationDetails?: Record<string, any>;
    userId?: string;
  }): Promise<CreditTransaction> {
    const account = await this.getOrCreateCreditAccount(dto.tenantId, dto.userId);

    // Check if enough credits
    if (account.currentBalance < dto.amount) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${dto.amount}, Available: ${account.currentBalance}`,
      );
    }

    // Deduct credits
    account.currentBalance -= dto.amount;
    account.lifetimeSpent += dto.amount;
    await this.creditAccountRepository.save(account);

    // Record transaction
    const transaction = this.creditTransactionRepository.create({
      tenantId: dto.tenantId,
      userId: dto.userId || null,
      creditAccountId: account.id,
      type: CreditTransactionType.CONSUMPTION,
      amount: -dto.amount, // Negative for deduction
      balanceAfter: account.currentBalance,
      description: dto.description,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      metadata: dto.calculationDetails || {},
    });

    return this.creditTransactionRepository.save(transaction);
  }
}
