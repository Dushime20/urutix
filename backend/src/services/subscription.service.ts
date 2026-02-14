import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import {
  TenantSubscription,
  SubscriptionStatus,
  BillingCycle,
} from '../entities/tenant-subscription.entity';
import { Tenant } from '../entities/tenant.entity';
import { CreditService } from './credit.service';
import { PricingService } from './pricing.service';

export interface CreateSubscriptionDto {
  tenantId: string;
  planId: string;
  billingCycle: BillingCycle;
  paymentMethodId?: string;
  startTrial?: boolean;
  trialDays?: number;
}

export interface UpgradeSubscriptionDto {
  newPlanId: string;
  immediate?: boolean;
}

export interface CancelSubscriptionDto {
  reason?: string;
  immediate?: boolean;
}

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(TenantSubscription)
    private tenantSubscriptionRepository: Repository<TenantSubscription>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private creditService: CreditService,
    private pricingService: PricingService,
  ) {}

  /**
   * Get all available subscription plans
   */
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Get a specific plan by ID or slug
   */
  async getPlan(idOrSlug: string): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: [{ id: idOrSlug }, { slug: idOrSlug }],
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan not found: ${idOrSlug}`);
    }

    return plan;
  }

  /**
   * Get tenant's current active subscription
   */
  async getCurrentSubscription(tenantId: string): Promise<TenantSubscription | null> {
    return this.tenantSubscriptionRepository.findOne({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
  }

  /**
   * Get tenant's subscription history
   */
  async getSubscriptionHistory(tenantId: string): Promise<TenantSubscription[]> {
    return this.tenantSubscriptionRepository.find({
      where: { tenantId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all subscriptions (admin only)
   */
  async getAllSubscriptions(filters?: {
    status?: string;
    plan?: string;
  }): Promise<any[]> {
    const queryBuilder = this.tenantSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.tenant', 'tenant');

    if (filters?.status && filters.status !== 'all') {
      queryBuilder.andWhere('subscription.status = :status', { status: filters.status });
    }

    if (filters?.plan && filters.plan !== 'all') {
      queryBuilder.andWhere('plan.slug = :plan', { plan: filters.plan });
    }

    queryBuilder.orderBy('subscription.createdAt', 'DESC');

    const subscriptions = await queryBuilder.getMany();

    // Enrich with tenant name and credit balance
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        // Get credit account for this tenant
        const creditAccount = await this.creditService.getOrCreateCreditAccount(sub.tenantId);
        
        return {
          ...sub,
          tenantName: sub.tenant?.name || 'Unknown',
          creditBalance: creditAccount?.currentBalance || 0,
          totalRevenue: 0, // TODO: Calculate from subscription_payments table
        };
      })
    );

    return enrichedSubscriptions;
  }

  /**
   * Create a new subscription for a tenant
   */
  async createSubscription(dto: CreateSubscriptionDto): Promise<TenantSubscription> {
    // Check if tenant already has an active subscription
    const existingSubscription = await this.getCurrentSubscription(dto.tenantId);
    if (existingSubscription) {
      throw new BadRequestException('Tenant already has an active subscription');
    }

    // Get the plan
    const plan = await this.getPlan(dto.planId);

    // Calculate period dates
    const now = new Date();
    let currentPeriodStart = now;
    let currentPeriodEnd: Date;
    let trialStart: Date | undefined;
    let trialEnd: Date | undefined;
    let status = SubscriptionStatus.ACTIVE;

    // Handle trial period
    if (dto.startTrial) {
      const trialDays = dto.trialDays || 14; // Default 14 days
      trialStart = now;
      trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      currentPeriodEnd = trialEnd;
      status = SubscriptionStatus.TRIAL;
    } else {
      // Calculate period end based on billing cycle
      if (dto.billingCycle === BillingCycle.MONTHLY) {
        currentPeriodEnd = new Date(now);
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      } else {
        currentPeriodEnd = new Date(now);
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      }
    }

    // Create subscription
    const subscription = this.tenantSubscriptionRepository.create({
      tenantId: dto.tenantId,
      planId: plan.id,
      status,
      billingCycle: dto.billingCycle,
      currentPeriodStart,
      currentPeriodEnd,
      trialStart,
      trialEnd,
      paymentMethodId: dto.paymentMethodId,
      autoRenew: true,
      nextPaymentDate: currentPeriodEnd,
    });

    const savedSubscription = await this.tenantSubscriptionRepository.save(subscription);

    // Grant initial credits (even for trial)
    await this.creditService.grantSubscriptionCredits(
      dto.tenantId,
      plan.includedCredits,
      savedSubscription.id,
      currentPeriodEnd,
    );

    // Update tenant status
    await this.tenantRepository.update(dto.tenantId, {
      isActive: true,
      activatedAt: now,
    });

    return savedSubscription;
  }

  /**
   * Upgrade subscription to a higher tier
   */
  async upgradeSubscription(
    subscriptionId: string,
    dto: UpgradeSubscriptionDto,
  ): Promise<TenantSubscription> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Can only upgrade active subscriptions');
    }

    const newPlan = await this.getPlan(dto.newPlanId);
    const oldPlan = subscription.plan;

    // Validate it's an upgrade (higher price)
    if (Number(newPlan.priceMonthly) <= Number(oldPlan.priceMonthly)) {
      throw new BadRequestException('New plan must be a higher tier');
    }

    // Calculate prorated credits
    const daysRemaining = subscription.daysUntilRenewal;
    const totalDays =
      subscription.billingCycle === BillingCycle.MONTHLY ? 30 : 365;
    const creditDifference = newPlan.includedCredits - oldPlan.includedCredits;
    const proratedCredits = Math.floor((creditDifference * daysRemaining) / totalDays);

    // Update subscription
    subscription.planId = newPlan.id;
    subscription.metadata = {
      ...subscription.metadata,
      upgradedFrom: oldPlan.id,
      upgradedAt: new Date().toISOString(),
    };

    const updatedSubscription = await this.tenantSubscriptionRepository.save(subscription);

    // Grant prorated credits immediately
    if (proratedCredits > 0) {
      await this.creditService.grantBonusCredits(
        subscription.tenantId,
        proratedCredits,
        `Prorated credits for upgrade to ${newPlan.name}`,
        subscription.currentPeriodEnd,
      );
    }

    // Update tenant tier (removed subscriptionTier as it doesn't exist in entity)
    // await this.tenantRepository.update(subscription.tenantId, {
    //   subscriptionTier: newPlan.slug,
    // });

    return updatedSubscription;
  }

  /**
   * Downgrade subscription to a lower tier
   */
  async downgradeSubscription(
    subscriptionId: string,
    dto: UpgradeSubscriptionDto,
  ): Promise<TenantSubscription> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const newPlan = await this.getPlan(dto.newPlanId);
    const oldPlan = subscription.plan;

    // Validate it's a downgrade (lower price)
    if (Number(newPlan.priceMonthly) >= Number(oldPlan.priceMonthly)) {
      throw new BadRequestException('New plan must be a lower tier');
    }

    if (dto.immediate) {
      // Immediate downgrade
      subscription.planId = newPlan.id;
      subscription.metadata = {
        ...subscription.metadata,
        downgradedFrom: oldPlan.id,
        downgradedAt: new Date().toISOString(),
      };

      // Update tenant tier (removed subscriptionTier as it doesn't exist in entity)
      // await this.tenantRepository.update(subscription.tenantId, {
      //   subscriptionTier: newPlan.slug,
      // });
    } else {
      // Schedule downgrade for end of period
      subscription.metadata = {
        ...subscription.metadata,
        scheduledDowngrade: {
          planId: newPlan.id,
          effectiveDate: subscription.currentPeriodEnd.toISOString(),
        },
      };
    }

    return this.tenantSubscriptionRepository.save(subscription);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    dto: CancelSubscriptionDto,
  ): Promise<TenantSubscription> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();

    if (dto.immediate) {
      // Immediate cancellation
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = now;
      subscription.cancellationReason = dto.reason;
      subscription.autoRenew = false;

      // Suspend tenant
      await this.tenantRepository.update(subscription.tenantId, {
        isActive: false,
        suspendedAt: now,
        suspendedReason: 'Subscription cancelled',
      });
    } else {
      // Cancel at end of period
      subscription.autoRenew = false;
      subscription.cancelledAt = now;
      subscription.cancellationReason = dto.reason;
      subscription.metadata = {
        ...subscription.metadata,
        scheduledCancellation: {
          effectiveDate: subscription.currentPeriodEnd.toISOString(),
          reason: dto.reason,
        },
      };
    }

    return this.tenantSubscriptionRepository.save(subscription);
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<TenantSubscription> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Can only reactivate cancelled subscriptions');
    }

    // Check if within 30 days of cancellation
    const daysSinceCancellation = subscription.cancelledAt
      ? Math.floor(
          (new Date().getTime() - subscription.cancelledAt.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 999;

    if (daysSinceCancellation > 30) {
      throw new BadRequestException(
        'Cannot reactivate subscription after 30 days. Please create a new subscription.',
      );
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.autoRenew = true;
    subscription.cancelledAt = null;
    subscription.cancellationReason = null;
    delete subscription.metadata.scheduledCancellation;

    // Reactivate tenant
    await this.tenantRepository.update(subscription.tenantId, {
      isActive: true,
      suspendedAt: null,
      suspendedReason: null,
    });

    return this.tenantSubscriptionRepository.save(subscription);
  }

  /**
   * Renew subscription (called by scheduled job)
   */
  async renewSubscription(subscriptionId: string, paymentId?: string): Promise<TenantSubscription> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Check for scheduled downgrade
    if (subscription.metadata?.scheduledDowngrade) {
      const newPlanId = subscription.metadata.scheduledDowngrade.planId;
      subscription.planId = newPlanId;
      delete subscription.metadata.scheduledDowngrade;
    }

    // Calculate new period
    const now = new Date();
    subscription.currentPeriodStart = now;

    if (subscription.billingCycle === BillingCycle.MONTHLY) {
      subscription.currentPeriodEnd = new Date(now);
      subscription.currentPeriodEnd.setMonth(subscription.currentPeriodEnd.getMonth() + 1);
    } else {
      subscription.currentPeriodEnd = new Date(now);
      subscription.currentPeriodEnd.setFullYear(subscription.currentPeriodEnd.getFullYear() + 1);
    }

    subscription.lastPaymentDate = now;
    subscription.nextPaymentDate = subscription.currentPeriodEnd;

    const updatedSubscription = await this.tenantSubscriptionRepository.save(subscription);

    // Grant new period credits
    await this.creditService.grantSubscriptionCredits(
      subscription.tenantId,
      subscription.plan.includedCredits,
      subscription.id,
      subscription.currentPeriodEnd,
    );

    return updatedSubscription;
  }

  /**
   * Handle trial expiry (called by scheduled job)
   */
  async handleTrialExpiry(subscriptionId: string): Promise<void> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.TRIAL) {
      return;
    }

    if (!subscription.trialEnd || new Date() < subscription.trialEnd) {
      return; // Trial not expired yet
    }

    if (subscription.paymentMethodId) {
      // Convert to paid subscription
      subscription.status = SubscriptionStatus.ACTIVE;
      await this.tenantSubscriptionRepository.save(subscription);
      // Payment processing would happen here
    } else {
      // No payment method, suspend
      subscription.status = SubscriptionStatus.SUSPENDED;
      await this.tenantSubscriptionRepository.save(subscription);

      await this.tenantRepository.update(subscription.tenantId, {
        isActive: false,
        suspendedAt: new Date(),
        suspendedReason: 'Trial expired without payment method',
      });
    }
  }

  /**
   * Get subscriptions expiring soon (for scheduled job)
   */
  async getExpiringSubscriptions(daysAhead: number = 7): Promise<TenantSubscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.tenantSubscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('subscription.autoRenew = :autoRenew', { autoRenew: true })
      .andWhere('subscription.currentPeriodEnd <= :futureDate', { futureDate })
      .andWhere('subscription.currentPeriodEnd > :now', { now: new Date() })
      .getMany();
  }

  /**
   * Get trial subscriptions expiring soon
   */
  async getExpiringTrials(daysAhead: number = 3): Promise<TenantSubscription[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.tenantSubscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.status = :status', { status: SubscriptionStatus.TRIAL })
      .andWhere('subscription.trialEnd <= :futureDate', { futureDate })
      .andWhere('subscription.trialEnd > :now', { now: new Date() })
      .getMany();
  }

  // Pricing Rules Management
  async getAllPricingRules() {
    return this.pricingService.getAllRules();
  }

  async createPricingRule(data: any) {
    return this.pricingService.createRule(data);
  }

  async updatePricingRule(id: string, data: any) {
    return this.pricingService.updateRule(id, data);
  }

  async deletePricingRule(id: string) {
    return this.pricingService.deleteRule(id);
  }
}
