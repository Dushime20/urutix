import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { CreditAccount } from './../entities/credit-account.entity';
import {
  CreditTransaction,
  CreditTransactionType,
} from './../entities/credit-transaction.entity';
import { FeatureCreditCost } from './../entities/feature-credit-cost.entity';
import { User } from './../entities/user.entity';

export interface CreditBalanceResponse {
  currentBalance: number;
  subscriptionCredits: number;
  purchasedCredits: number;
  bonusCredits: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lastRefreshDate: Date | null;
  nextRefreshDate: Date | null;
  // Revenue tracking for tenant admins
  revenueFromPartnerSales?: number;
  totalPartnersSold?: number;
  creditsAllocatedToPartners?: number;
  creditsAvailableForAllocation?: number;
  // Earning statistics
  revenueFromMarketplaceSales?: number; // Credits earned from selling to truck owners
  revenueFromBidTransactions?: number; // Credits earned from bid acceptances
  totalRevenue?: number; // Total credits earned (marketplace + bids)
  totalProfit?: number; // Net profit (revenue - operational costs)
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
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  /**
   * Get or create credit account for tenant or user
   */
  async getOrCreateCreditAccount(tenantId: string, userId?: string): Promise<CreditAccount> {
    console.log('[CreditService] Searching for account with tenantId:', tenantId, 'userId:', userId);
    
    // Use QueryBuilder for proper NULL handling
    const queryBuilder = this.creditAccountRepository.createQueryBuilder('account')
      .where('account.tenantId = :tenantId', { tenantId });
    
    if (userId) {
      queryBuilder.andWhere('account.userId = :userId', { userId });
    } else {
      queryBuilder.andWhere('account.userId IS NULL');
    }
    
    let account = await queryBuilder.getOne();
    console.log('[CreditService] Found account:', account?.id);

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

    const response: CreditBalanceResponse = {
      currentBalance: account.currentBalance,
      subscriptionCredits: account.subscriptionCredits,
      purchasedCredits: account.purchasedCredits,
      bonusCredits: account.bonusCredits,
      lifetimeEarned: account.lifetimeEarned,
      lifetimeSpent: account.lifetimeSpent,
      lastRefreshDate: account.lastRefreshDate || null,
      nextRefreshDate: account.nextRefreshDate || null,
    };

    // Include revenue data for tenant-level accounts (tenant admins)
    if (!userId) {
      response.revenueFromPartnerSales = Number(account.revenueFromPartnerSales) || 0;
      response.totalPartnersSold = account.totalPartnersSold || 0;
      response.creditsAllocatedToPartners = account.creditsAllocatedToPartners || 0;
      response.creditsAvailableForAllocation = account.currentBalance - (account.creditsAllocatedToPartners || 0);
    }

    // Calculate earning statistics from transactions
    const transactions = await this.creditTransactionRepository.find({
      where: { tenantId, userId: userId || IsNull() },
      select: ['type', 'amount', 'description', 'referenceType'],
    });

    // Revenue from marketplace sales (CONSUMPTION with MARKETPLACE_SALE reference)
    const marketplaceSales = transactions
      .filter(tx => tx.type === CreditTransactionType.CONSUMPTION && tx.referenceType === 'MARKETPLACE_SALE')
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    // Revenue from bid transactions (BONUS with description containing "Bid revenue")
    const bidRevenue = transactions
      .filter(tx => tx.type === CreditTransactionType.BONUS && tx.description?.includes('Bid revenue'))
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Operational costs from bids (CONSUMPTION with description containing "operational cost")
    const bidOperationalCosts = transactions
      .filter(tx => tx.type === CreditTransactionType.CONSUMPTION && tx.description?.includes('operational cost'))
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    // Calculate totals
    const totalRevenue = marketplaceSales + bidRevenue;
    const totalProfit = totalRevenue - bidOperationalCosts;

    // Add earning statistics to response
    response.revenueFromMarketplaceSales = marketplaceSales;
    response.revenueFromBidTransactions = bidRevenue;
    response.totalRevenue = totalRevenue;
    response.totalProfit = totalProfit;

    return response;
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

    try {
      return await this.creditTransactionRepository.save(transaction);
    } catch (e) {
      console.error('Failed to save log:', e);
      return transaction;
    }
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
      // userId: userId || null,
      creditAccountId: account.id,
      type: CreditTransactionType.PURCHASE,
      amount,
      balanceAfter: account.currentBalance,
      description: `Purchased ${packageName}`,
      paymentId,
      expiresAt,
      metadata: { packageName, purchasedAt: new Date().toISOString() },
    });

    try {
      return await this.creditTransactionRepository.save(transaction);
    } catch (e) {
      console.error('Failed to save log:', e);
      return transaction;
    }
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
      // userId: userId || null,
      creditAccountId: account.id,
      type: CreditTransactionType.BONUS,
      amount,
      balanceAfter: account.currentBalance,
      description: reason,
      expiresAt: expiry,
      metadata: { grantedAt: new Date().toISOString() },
    });

    try {
      return await this.creditTransactionRepository.save(transaction);
    } catch (e) {
      console.error('Failed to save log:', e);
      return transaction;
    }
  }

  /**
   * Track revenue from partner plan sales
   * Called when a truck owner purchases a partner plan from tenant admin
   */
  async trackPartnerPlanRevenue(
    tenantId: string,
    revenueAmount: number,
    creditsAllocated: number,
  ): Promise<void> {
    // Get tenant-level credit account (not user-level)
    const account = await this.getOrCreateCreditAccount(tenantId);

    // Update revenue tracking fields
    account.revenueFromPartnerSales = Number(account.revenueFromPartnerSales) + revenueAmount;
    account.totalPartnersSold += 1;
    account.creditsAllocatedToPartners += creditsAllocated;

    await this.creditAccountRepository.save(account);

    console.log(`[CreditService] Tracked partner plan revenue: $${revenueAmount}, Credits: ${creditsAllocated}, Total Partners: ${account.totalPartnersSold}`);
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
      // userId: dto.userId || null,
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

    try {
      return await this.creditTransactionRepository.save(transaction);
    } catch (e) {
      console.error('Failed to save log:', e);
      return transaction;
    }
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
      // userId: userId || null,
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

    try {
      return await this.creditTransactionRepository.save(transaction);
    } catch (e) {
      console.error('Failed to save log:', e);
      return transaction;
    }
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
      // userId: userId || null,
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

    try {
      return await this.creditTransactionRepository.save(transaction);
    } catch (e) {
      console.error('Failed to save log:', e);
      return transaction;
    }
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

    // Add userId to select if we need to filter by it (since it has select: false in entity)
    if (filters?.userId !== undefined) {
      query.addSelect('transaction.userId');
      if (filters.userId) {
        query.andWhere('transaction.userId = :userId', { userId: filters.userId });
      } else {
        query.andWhere('transaction.userId IS NULL');
      }
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

    // Calculate new values
    const newBalance = account.currentBalance - dto.amount;
    const newLifetimeSpent = account.lifetimeSpent + dto.amount;

    // Use update() instead of save() to only update specific fields
    await this.creditAccountRepository.update(account.id, {
      currentBalance: newBalance,
      lifetimeSpent: newLifetimeSpent,
    });

    // Record transaction
    const transaction = this.creditTransactionRepository.create({
      tenantId: dto.tenantId,
      userId: dto.userId || null,
      creditAccountId: account.id,
      type: CreditTransactionType.CONSUMPTION,
      amount: -dto.amount, // Negative for deduction
      balanceAfter: newBalance,
      description: dto.description,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      metadata: dto.calculationDetails || {},
    });

    return this.creditTransactionRepository.save(transaction);
  }

  /**
   * Grant system credits without deduction (Super Admin only)
   */
  async grantSystemCredits(
    tenantId: string,
    amount: number,
    adminId: string,
    reason: string = 'System grant',
    userId?: string,
    transactionType: CreditTransactionType = CreditTransactionType.PURCHASE
  ): Promise<CreditTransaction> {
    const account = await this.getOrCreateCreditAccount(tenantId, userId);

    if (transactionType === CreditTransactionType.BONUS) {
      account.bonusCredits += amount;
    } else {
      account.purchasedCredits += amount;
    }

    account.currentBalance += amount;
    account.lifetimeEarned += amount;

    await this.creditAccountRepository.save(account);

    const transaction = this.creditTransactionRepository.create({
      tenantId,
      // userId: userId || null, // Temporarily commented out to fix 500 error as column might be missing in DB
      creditAccountId: account.id,
      type: transactionType,
      amount,
      balanceAfter: account.currentBalance,
      description: reason,
      metadata: { adminId, isSystemGrant: true },
    });

    try {
      return await this.creditTransactionRepository.save(transaction);
    } catch (e) {
      console.error('Failed to save credit transaction log:', e);
      // We still return the transaction object so the request completes with success
      // since the balance itself was already updated above.
      return transaction;
    }
  }

  /**
   * Transfer credits between scopes (e.g. Tenant -> Truck Owner)
   */
  async transferCredits(
    fromTenantId: string,
    fromUserId: string | null,
    toTenantId: string,
    toUserId: string | null,
    amount: number,
    reason: string,
    adminId?: string,
  ): Promise<CreditTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be greater than zero');
    }

    const fromAccount = await this.getOrCreateCreditAccount(fromTenantId, fromUserId);
    const toAccount = await this.getOrCreateCreditAccount(toTenantId, toUserId);

    if (fromAccount.currentBalance < amount) {
      throw new BadRequestException('Insufficient balance in source account for transfer');
    }

    // Deduct from sender
    let remaining = amount;
    if (fromAccount.bonusCredits > 0) {
      const deduct = Math.min(remaining, fromAccount.bonusCredits);
      fromAccount.bonusCredits -= deduct;
      remaining -= deduct;
    }
    if (remaining > 0 && fromAccount.subscriptionCredits > 0) {
      const deduct = Math.min(remaining, fromAccount.subscriptionCredits);
      fromAccount.subscriptionCredits -= deduct;
      remaining -= deduct;
    }
    if (remaining > 0 && fromAccount.purchasedCredits > 0) {
      const deduct = Math.min(remaining, fromAccount.purchasedCredits);
      fromAccount.purchasedCredits -= deduct;
      remaining -= deduct;
    }

    fromAccount.currentBalance -= amount;
    fromAccount.lifetimeSpent += amount;

    await this.creditAccountRepository.save(fromAccount);

    try {
      await this.creditTransactionRepository.save(this.creditTransactionRepository.create({
        tenantId: fromTenantId,
        // userId: fromUserId,
        creditAccountId: fromAccount.id,
        type: CreditTransactionType.ADJUSTMENT,
        amount: -amount,
        balanceAfter: fromAccount.currentBalance,
        description: `Transfer to ${toUserId || toTenantId}: ${reason}`,
        metadata: { adminId, transferredTo: toAccount.id }
      }));
    } catch (e) {
      console.error('Failed to save outward transfer log:', e);
    }

    // Add to receiver
    toAccount.purchasedCredits += amount;
    toAccount.currentBalance += amount;
    toAccount.lifetimeEarned += amount;

    await this.creditAccountRepository.save(toAccount);

    const transactionIn = this.creditTransactionRepository.create({
      tenantId: toTenantId,
      // userId: toUserId,
      creditAccountId: toAccount.id,
      type: CreditTransactionType.PURCHASE, // Treat as purchased for the recipient
      amount,
      balanceAfter: toAccount.currentBalance,
      description: `Transfer from ${fromUserId || fromTenantId}: ${reason}`,
      metadata: { adminId, transferredFrom: fromAccount.id }
    });

    try {
      return await this.creditTransactionRepository.save(transactionIn);
    } catch (e) {
      console.error('Failed to save transfer transaction log:', e);
      return transactionIn;
    }
  }

  /**
   * Get all user balances within a tenant or all tenant balances
   */
  async getBalancesInScope(tenantId?: string, role?: string): Promise<CreditAccount[]> {
    if (tenantId) {
      // Query users first to ensure all people in the tenant (with optional role) are found
      const userQuery = this.userRepository.createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .leftJoinAndSelect('user.trucks', 'trucks')
        .where('user.tenantId = :tenantId', { tenantId });

      if (role) {
        userQuery.andWhere('user.role = :role', { role: role.toUpperCase() });
      }

      const users = await userQuery.getMany();

      // For each user, get or create their credit account
      // This ensures that everyone appearing on the list has a usable account
      const accounts = await Promise.all(
        users.map(async (user) => {
          const acc = await this.getOrCreateCreditAccount(tenantId, user.id);
          acc.user = user; // Ensure user data is attached for frontend display
          return acc;
        })
      );

      return accounts;
    } else {
      // Super admin view (tenants)
      const query = this.creditAccountRepository
        .createQueryBuilder('account')
        .leftJoinAndSelect('account.user', 'user') // Though tenant accounts usually don't have users
        .leftJoinAndSelect('user.profile', 'profile')
        .where('account.tenantId IS NULL');

      return query.getMany();
    }
  }

  /**
   * Get partners with low credit balances for a tenant
   */
  async getLowCreditPartners(tenantId: string, threshold: number = 1000): Promise<CreditAccount[]> {
    const query = this.creditAccountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('account.tenantId = :tenantId', { tenantId })
      .andWhere('user.id IS NOT NULL')
      .andWhere('account.currentBalance <= :threshold', { threshold })
      .orderBy('account.currentBalance', 'ASC');

    return query.getMany();
  }

  /**
   * Check if credits have already been deducted for a given trip.
   * Used to prevent double-charging on the same trip.
   */
  async isTripAlreadyCharged(tripId: string, tenantId: string): Promise<boolean> {
    const existing = await this.creditTransactionRepository.findOne({
      where: {
        tenantId,
        referenceType: 'TRIP',
        referenceId: tripId,
        type: CreditTransactionType.CONSUMPTION,
      },
    });
    return !!existing;
  }

  /**
   * Consume credits for bid acceptance (dual deduction)
   * Deducts credits from both tenant admin and truck owner when bid is accepted
   */
  async consumeCreditsForBid(dto: {
    tenantId: string;
    tenantAdminUserId: string;
    truckOwnerUserId: string;
    cargoWeightTons: number;
    creditsPerTonTenant: number;
    creditsPerTonTruckOwner: number;
    bidId: string;
    loadId: string;
    loadTitle: string;
    referenceType?: string; // defaults to 'BID'; pass 'TRIP' for trip-start deductions
  }): Promise<{ tenantTransaction: CreditTransaction; truckOwnerTransaction: CreditTransaction; tenantEarningTransaction: CreditTransaction }> {
    // Calculate credits needed
    const tenantCreditsNeeded = Math.ceil(dto.cargoWeightTons * dto.creditsPerTonTenant);
    const truckOwnerCreditsNeeded = Math.ceil(dto.cargoWeightTons * dto.creditsPerTonTruckOwner);

    // Get both accounts
    const tenantAdminAccount = await this.getOrCreateCreditAccount(dto.tenantId, dto.tenantAdminUserId);
    const truckOwnerAccount = await this.getOrCreateCreditAccount(dto.tenantId, dto.truckOwnerUserId);

    // Validate both have sufficient credits
    if (tenantAdminAccount.currentBalance < tenantCreditsNeeded) {
      throw new BadRequestException(
        `Tenant admin has insufficient credits. Required: ${tenantCreditsNeeded}, Available: ${tenantAdminAccount.currentBalance}`,
      );
    }

    if (truckOwnerAccount.currentBalance < truckOwnerCreditsNeeded) {
      throw new BadRequestException(
        `Truck owner has insufficient credits. Required: ${truckOwnerCreditsNeeded}, Available: ${truckOwnerAccount.currentBalance}`,
      );
    }

    // 1. Deduct from tenant admin (operational cost)
    const tenantTransaction = await this.deductCredits({
      tenantId: dto.tenantId,
      userId: dto.tenantAdminUserId,
      amount: tenantCreditsNeeded,
      description: `Bid accepted - operational cost for "${dto.loadTitle}" (${dto.cargoWeightTons} tons × ${dto.creditsPerTonTenant} credits/ton)`,
      referenceType: dto.referenceType ?? 'BID',
      referenceId: dto.bidId,
      calculationDetails: {
        loadId: dto.loadId,
        cargoWeightTons: dto.cargoWeightTons,
        creditsPerTon: dto.creditsPerTonTenant,
        role: 'TENANT_ADMIN',
        transactionType: 'OPERATIONAL_COST',
      },
    });

    // 2. Deduct from truck owner (payment for the job)
    const truckOwnerTransaction = await this.deductCredits({
      tenantId: dto.tenantId,
      userId: dto.truckOwnerUserId,
      amount: truckOwnerCreditsNeeded,
      description: `Bid accepted - payment for "${dto.loadTitle}" (${dto.cargoWeightTons} tons × ${dto.creditsPerTonTruckOwner} credits/ton)`,
      referenceType: dto.referenceType ?? 'BID',
      referenceId: dto.bidId,
      calculationDetails: {
        loadId: dto.loadId,
        cargoWeightTons: dto.cargoWeightTons,
        creditsPerTon: dto.creditsPerTonTruckOwner,
        role: 'TRUCK_OWNER',
        transactionType: 'JOB_PAYMENT',
      },
    });

    // 3. Grant tenant admin the credits that truck owner paid (revenue/earning)
    const tenantEarningTransaction = await this.grantBonusCredits(
      dto.tenantId,
      truckOwnerCreditsNeeded,
      `Bid revenue from "${dto.loadTitle}" - earned from truck owner payment (${dto.cargoWeightTons} tons × ${dto.creditsPerTonTruckOwner} credits/ton)`,
      null, // No expiry
      dto.tenantAdminUserId,
    );

    // Calculate net result for tenant admin
    const tenantNetGain = truckOwnerCreditsNeeded - tenantCreditsNeeded;

    console.log(`[CreditService] Bid credit flow completed for bid ${dto.bidId}:`);
    console.log(`  - Tenant Admin operational cost: -${tenantCreditsNeeded} credits`);
    console.log(`  - Truck Owner payment: -${truckOwnerCreditsNeeded} credits`);
    console.log(`  - Tenant Admin revenue earned: +${truckOwnerCreditsNeeded} credits`);
    console.log(`  - Tenant Admin net profit: ${tenantNetGain > 0 ? '+' : ''}${tenantNetGain} credits`);

    return { tenantTransaction, truckOwnerTransaction, tenantEarningTransaction };
  }
}
