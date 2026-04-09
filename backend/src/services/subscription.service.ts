import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './../entities/subscription-plan.entity';
import {
  TenantSubscription,
  SubscriptionStatus,
  BillingCycle,
} from './../entities/tenant-subscription.entity';
import { Tenant } from './../entities/tenant.entity';
import { CreditService } from './credit.service';
import { PricingService } from './pricing.service';

export interface CreateSubscriptionDto {
  tenantId: string;
  planId: string;
  billingCycle: BillingCycle;
  paymentMethodId?: string;
  startTrial?: boolean;
  trialDays?: number;
  userId?: string;
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
  ) { }

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
   * Get all subscription plans, including inactive (admin only)
   */
  async getAllSubscriptionPlans(includeInactive = false): Promise<SubscriptionPlan[]> {
    return this.subscriptionPlanRepository.find({
      where: includeInactive ? {} : { isActive: true },
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
   * Create a new subscription plan (admin only)
   */
  async createSubscriptionPlan(data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const existing = await this.subscriptionPlanRepository.findOne({ where: { slug: data.slug } });
    if (existing) {
      throw new BadRequestException(`Plan with slug ${data.slug} already exists`);
    }

    const plan = this.subscriptionPlanRepository.create(data);
    return this.subscriptionPlanRepository.save(plan);
  }

  /**
   * Update a subscription plan (admin only)
   */
  async updateSubscriptionPlan(id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plan = await this.getPlan(id);
    
    if (data.slug && data.slug !== plan.slug) {
      const existing = await this.subscriptionPlanRepository.findOne({ where: { slug: data.slug } });
      if (existing) {
        throw new BadRequestException(`Plan with slug ${data.slug} already exists`);
      }
    }

    Object.assign(plan, data);
    return this.subscriptionPlanRepository.save(plan);
  }

  /**
   * Delete a subscription plan (admin only)
   */
  async deleteSubscriptionPlan(id: string): Promise<void> {
    const plan = await this.getPlan(id);
    
    // Check if there are active subscriptions using this plan
    const activeSubscriptions = await this.tenantSubscriptionRepository.count({
      where: { planId: id, status: SubscriptionStatus.ACTIVE }
    });

    if (activeSubscriptions > 0) {
      // Soft delete/deactivate instead of hard delete if in use
      plan.isActive = false;
      await this.subscriptionPlanRepository.save(plan);
    } else {
      await this.subscriptionPlanRepository.remove(plan);
    }
  }

  /**
   * Get tenant's or user's current active subscription
   */
  async getCurrentSubscription(tenantId: string, userId?: string): Promise<TenantSubscription | null> {
    const where: any = { tenantId, status: SubscriptionStatus.ACTIVE };
    if (userId) {
      where.userId = userId;
    } else {
      where.userId = null;
    }

    return this.tenantSubscriptionRepository.findOne({
      where,
      relations: ['plan'],
    });
  }

  /**
   * Get tenant's or user's subscription history
   */
  async getSubscriptionHistory(tenantId: string, userId?: string): Promise<TenantSubscription[]> {
    const where: any = { tenantId };
    if (userId) {
      where.userId = userId;
    } else {
      where.userId = null;
    }

    return this.tenantSubscriptionRepository.find({
      where,
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

    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (sub) => {
        const creditAccount = await this.creditService.getOrCreateCreditAccount(sub.tenantId, sub.userId);

        return {
          ...sub,
          tenantName: sub.tenant?.name || 'Unknown',
          creditBalance: creditAccount?.currentBalance || 0,
          totalRevenue: 0,
        };
      })
    );

    return enrichedSubscriptions;
  }

  /**
   * Create a new subscription for a tenant or user
   */
  async createSubscription(dto: CreateSubscriptionDto): Promise<TenantSubscription> {
    const existingSubscription = await this.getCurrentSubscription(dto.tenantId, dto.userId);
    if (existingSubscription) {
      throw new BadRequestException(`${dto.userId ? 'User' : 'Tenant'} already has an active subscription`);
    }

    const plan = await this.getPlan(dto.planId);

    const now = new Date();
    let currentPeriodStart = now;
    let currentPeriodEnd: Date;
    let trialStart: Date | undefined;
    let trialEnd: Date | undefined;
    let status = SubscriptionStatus.ACTIVE;

    if (dto.startTrial) {
      const trialDays = dto.trialDays || 14;
      trialStart = now;
      trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      currentPeriodEnd = trialEnd;
      status = SubscriptionStatus.TRIAL;
    } else {
      currentPeriodEnd = new Date(now);
      if (dto.billingCycle === BillingCycle.MONTHLY) {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      } else {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      }
    }

    const subscription = this.tenantSubscriptionRepository.create({
      tenantId: dto.tenantId,
      userId: dto.userId || null,
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

    await this.creditService.grantSubscriptionCredits(
      dto.tenantId,
      plan.includedCredits,
      savedSubscription.id,
      currentPeriodEnd,
      dto.userId,
    );

    if (!dto.userId) {
      await this.tenantRepository.update(dto.tenantId, {
        isActive: true,
        activatedAt: now,
      });
    }

    return savedSubscription;
  }

  /**
   * Upgrade subscription
   */
  async upgradeSubscription(subscriptionId: string, dto: UpgradeSubscriptionDto): Promise<TenantSubscription> {
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

    if (Number(newPlan.priceMonthly) <= Number(oldPlan.priceMonthly)) {
      throw new BadRequestException('New plan must be a higher tier');
    }

    // Pro-rata credit calculation (simplified)
    const now = new Date();
    const totalPeriodDays = subscription.billingCycle === BillingCycle.MONTHLY ? 30 : 365;
    const daysRemaining = Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const creditDifference = newPlan.includedCredits - oldPlan.includedCredits;
    const proratedCredits = Math.max(0, Math.floor((creditDifference * daysRemaining) / totalPeriodDays));

    subscription.planId = newPlan.id;
    subscription.metadata = {
      ...subscription.metadata,
      upgradedFrom: oldPlan.id,
      upgradedAt: now.toISOString(),
    };

    const updatedSubscription = await this.tenantSubscriptionRepository.save(subscription);

    if (proratedCredits > 0) {
      await this.creditService.grantBonusCredits(
        subscription.tenantId,
        proratedCredits,
        `Prorated credits for upgrade to ${newPlan.name}`,
        subscription.currentPeriodEnd,
        subscription.userId,
      );
    }

    return updatedSubscription;
  }

  /**
   * Downgrade subscription
   */
  async downgradeSubscription(subscriptionId: string, dto: UpgradeSubscriptionDto): Promise<TenantSubscription> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const newPlan = await this.getPlan(dto.newPlanId);
    const oldPlan = subscription.plan;

    if (Number(newPlan.priceMonthly) >= Number(oldPlan.priceMonthly)) {
      throw new BadRequestException('New plan must be a lower tier');
    }

    if (dto.immediate) {
      subscription.planId = newPlan.id;
      subscription.metadata = {
        ...subscription.metadata,
        downgradedFrom: oldPlan.id,
        downgradedAt: new Date().toISOString(),
      };
    } else {
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
  async cancelSubscription(subscriptionId: string, dto: CancelSubscriptionDto): Promise<TenantSubscription> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const now = new Date();

    if (dto.immediate) {
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = now;
      subscription.cancellationReason = dto.reason;
      subscription.autoRenew = false;

      if (!subscription.userId) {
        await this.tenantRepository.update(subscription.tenantId, {
          isActive: false,
          suspendedAt: now,
          suspendedReason: 'Subscription cancelled',
        });
      }
    } else {
      subscription.autoRenew = false;
      subscription.cancelledAt = now;
      subscription.cancellationReason = dto.reason;
    }

    return this.tenantSubscriptionRepository.save(subscription);
  }

  /**
   * Reactivate subscription
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

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.autoRenew = true;
    subscription.cancelledAt = null;
    subscription.cancellationReason = null;

    if (!subscription.userId) {
      await this.tenantRepository.update(subscription.tenantId, {
        isActive: true,
        suspendedAt: null,
        suspendedReason: null,
      });
    }

    return this.tenantSubscriptionRepository.save(subscription);
  }

  /**
   * Renew subscription
   */
  async renewSubscription(subscriptionId: string, paymentId?: string): Promise<TenantSubscription> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) return null;

    if (subscription.metadata?.scheduledDowngrade) {
      subscription.planId = subscription.metadata.scheduledDowngrade.planId;
      delete subscription.metadata.scheduledDowngrade;
    }

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

    await this.creditService.grantSubscriptionCredits(
      subscription.tenantId,
      subscription.plan.includedCredits,
      subscription.id,
      subscription.currentPeriodEnd,
      subscription.userId,
    );

    return updatedSubscription;
  }

  /**
   * Trial expiry
   */
  async handleTrialExpiry(subscriptionId: string): Promise<void> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.TRIAL) return;

    const now = new Date();
    if (!subscription.trialEnd || now < subscription.trialEnd) return;

    if (subscription.paymentMethodId) {
      subscription.status = SubscriptionStatus.ACTIVE;
      await this.tenantSubscriptionRepository.save(subscription);
    } else {
      subscription.status = SubscriptionStatus.SUSPENDED;
      await this.tenantSubscriptionRepository.save(subscription);

      if (!subscription.userId) {
        await this.tenantRepository.update(subscription.tenantId, {
          isActive: false,
          suspendedAt: now,
          suspendedReason: 'Trial expired without payment method',
        });
      }
    }
  }

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
