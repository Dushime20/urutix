
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
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../entities/payment.entity';

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
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
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
    
    // Add userId to query if provided
    if (userId) {
      where.userId = userId;
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
    const queryBuilder = this.tenantSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.tenantId = :tenantId', { tenantId });

    if (userId) {
      queryBuilder.andWhere('subscription.userId = :userId', { userId });
    } else {
      queryBuilder.andWhere('subscription.userId IS NULL');
    }

    queryBuilder.orderBy('subscription.createdAt', 'DESC');

    return queryBuilder.getMany();
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
        let creditBalance = 0;
        try {
          const creditAccount = await this.creditService.getOrCreateCreditAccount(sub.tenantId, sub.userId);
          creditBalance = creditAccount?.currentBalance || 0;
        } catch (error) {
          // If credit account creation fails (e.g., duplicate key), just use 0 balance
          console.warn(`Could not get credit account for subscription ${sub.id}:`, error.message);
        }

        return {
          ...sub,
          tenantName: sub.tenant?.name || 'Unknown',
          creditBalance,
          totalRevenue: 0,
        };
      })
    );

    return enrichedSubscriptions;
  }

  /**
   * Create a new subscription
   */
  async createSubscription(dto: CreateSubscriptionDto): Promise<TenantSubscription> {
    // Check for existing subscription and cancel it if found (allow upgrades/replacements)
    const existingSubscription = await this.getCurrentSubscription(dto.tenantId, dto.userId);
    if (existingSubscription) {
      // Cancel the existing subscription to allow the new one
      await this.tenantSubscriptionRepository.update(existingSubscription.id, {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      });
      // Existing subscription cancelled to allow new purchase
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
   * Purchase a subscription with payment processing
   */
  async purchaseSubscription(data: {
    tenantId: string;
    userId: string;
    planId: string;
    paymentMethod: 'card' | 'mobile_money';
    paymentDetails: any;
  }): Promise<any> {
    // Get the plan
    const plan = await this.getPlan(data.planId);

    // Check if this is a partner plan and validate available slots
    if (plan.parentSubscriptionId && plan.creditCostPerPartner) {
      // This is a partner plan - check available slots
      const purchasedCount = await this.tenantSubscriptionRepository.count({
        where: {
          planId: data.planId,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      if (purchasedCount >= plan.availableSlots) {
        throw new BadRequestException(
          `This partner plan has no available slots. All ${plan.availableSlots} slots have been purchased.`,
        );
      }

      console.log(`[SubscriptionService] Partner plan slot check: ${purchasedCount}/${plan.availableSlots} slots used`);
    }

    // Determine credits to grant based on plan type
    // For partner plans (with creditCostPerPartner), grant per-partner credits
    // For regular plans, grant totalCredits
    const creditsToGrant = plan.creditCostPerPartner || plan.totalCredits;
    
    // Calculate total amount based on credits to grant
    const totalAmount = creditsToGrant === -1 ? 0 : Number(plan.pricePerCredit) * creditsToGrant;

    // TODO: Process payment with payment gateway
    // For now, we'll simulate successful payment
    const paymentResult = {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      amount: totalAmount,
      paymentMethod: data.paymentMethod,
    };

    if (!paymentResult.success) {
      throw new BadRequestException('Payment processing failed');
    }

    // Create subscription with userId to track who purchased it
    const subscription = await this.createSubscription({
      tenantId: data.tenantId,
      userId: data.userId,
      planId: data.planId,
      billingCycle: BillingCycle.MONTHLY,
      paymentMethodId: paymentResult.transactionId,
      startTrial: false,
    });

    // Grant credits based on plan type
    if (creditsToGrant > 0) {
      await this.creditService.grantSubscriptionCredits(
        data.tenantId,
        creditsToGrant,
        subscription.id,
        subscription.currentPeriodEnd,
        data.userId,
      );
    }

    // Track revenue for tenant admin if this is a partner plan purchase
    if (plan.parentSubscriptionId && plan.creditCostPerPartner) {
      // This is a partner plan - track revenue for the tenant admin who created it
      await this.creditService.trackPartnerPlanRevenue(
        data.tenantId,
        totalAmount,
        creditsToGrant,
      );
    }

    // ── Record payment in payments table ──────────────────────────────────
    if (totalAmount > 0) {
      try {
        const methodMap: Record<string, PaymentMethod> = {
          card: PaymentMethod.CREDIT_CARD,
          mobile_money: PaymentMethod.DIGITAL_WALLET,
        };
        const payment = this.paymentRepository.create({
          tenantId: data.tenantId,
          payerId: data.userId,
          amount: totalAmount,
          currency: 'USD',
          paymentMethod: methodMap[data.paymentMethod] ?? PaymentMethod.CREDIT_CARD,
          paymentType: PaymentType.SUBSCRIPTION,
          status: PaymentStatus.COMPLETED,
          transactionId: paymentResult.transactionId,
          description: `Subscription: ${plan.name} (${creditsToGrant} credits)`,
          processedAt: new Date(),
          metadata: {
            planId: data.planId,
            planName: plan.name,
            subscriptionId: subscription.id,
            creditsGranted: creditsToGrant,
          },
        });
        await this.paymentRepository.save(payment);
      } catch (e) {
        console.error('[SubscriptionService] Failed to save payment record:', e.message);
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    return {
      subscription,
      payment: paymentResult,
      creditsAdded: creditsToGrant,
      plan: {
        name: plan.name,
        pricePerCredit: plan.pricePerCredit,
        totalCredits: creditsToGrant,
      },
    };
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

  /**
   * Get partner plans created by tenant admin
   */
  async getPartnerPlans(tenantId: string): Promise<any[]> {
    // Get all subscriptions purchased by this tenant
    const tenantSubscriptions = await this.tenantSubscriptionRepository.find({
      where: { tenantId },
      relations: ['plan'],
    });

    const subscriptionIds = tenantSubscriptions.map(sub => sub.id);

    if (subscriptionIds.length === 0) {
      return [];
    }

    // Get all partner plans created from these subscriptions
    const partnerPlans = await this.subscriptionPlanRepository
      .createQueryBuilder('plan')
      .where('plan.parent_subscription_id IN (:...subscriptionIds)', { subscriptionIds })
      .getMany();

    return partnerPlans;
  }

  /**
   * Create a partner plan for truck owners
   */
  async createPartnerPlan(data: {
    tenantId: string;
    userId: string;
    parentSubscriptionId: string;
    name: string;
    slug: string;
    description: string;
    creditCostPerPartner: number;
    availableSlots: number;
    totalCredits: number;
    isActive: boolean;
  }): Promise<SubscriptionPlan> {
    // Verify parent subscription exists and belongs to tenant
    const parentSubscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: data.parentSubscriptionId, tenantId: data.tenantId },
      relations: ['plan'],
    });

    if (!parentSubscription) {
      throw new NotFoundException('Parent subscription not found');
    }

    // Calculate available credits
    const existingPartnerPlans = await this.subscriptionPlanRepository.find({
      where: { parentSubscriptionId: data.parentSubscriptionId },
    });

    const allocatedCredits = existingPartnerPlans.reduce((sum, plan) => sum + plan.totalCredits, 0);
    const availableCredits = parentSubscription.plan.totalCredits - allocatedCredits;

    if (data.totalCredits > availableCredits) {
      throw new BadRequestException(
        `Cannot allocate ${data.totalCredits} credits. Only ${availableCredits} credits available from parent subscription.`
      );
    }

    // Check if slug already exists
    const existing = await this.subscriptionPlanRepository.findOne({ where: { slug: data.slug } });
    if (existing) {
      throw new BadRequestException(`Plan with slug ${data.slug} already exists`);
    }

    // Create partner plan with inherited values from parent subscription
    const partnerPlan = this.subscriptionPlanRepository.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentSubscriptionId: data.parentSubscriptionId,
      pricePerCredit: parentSubscription.plan.pricePerCredit,
      creditCostPerPartner: data.creditCostPerPartner,
      availableSlots: data.availableSlots,
      totalCredits: data.totalCredits, // creditCostPerPartner × availableSlots
      creditsPerTonTenant: parentSubscription.plan.creditsPerTonTenant, // Inherit from parent
      creditsPerTonTruckOwner: parentSubscription.plan.creditsPerTonTruckOwner, // Inherit from parent
      isActive: data.isActive,
      features: {},
      limits: {},
      displayOrder: 0,
    });

    return this.subscriptionPlanRepository.save(partnerPlan);
  }

  /**
   * Update a partner plan
   */
  async updatePartnerPlan(
    planId: string,
    tenantId: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      creditCostPerPartner?: number;
      availableSlots?: number;
      totalCredits?: number;
      isActive?: boolean;
    }
  ): Promise<SubscriptionPlan> {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id: planId },
    });

    if (!plan || !plan.parentSubscriptionId) {
      throw new NotFoundException('Partner plan not found');
    }

    // Verify parent subscription belongs to tenant
    const parentSubscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: plan.parentSubscriptionId, tenantId },
      relations: ['plan'],
    });

    if (!parentSubscription) {
      throw new NotFoundException('Parent subscription not found');
    }

    // If updating total credits, validate available credits
    if (data.totalCredits !== undefined && data.totalCredits !== plan.totalCredits) {
      const existingPartnerPlans = await this.subscriptionPlanRepository.find({
        where: { parentSubscriptionId: plan.parentSubscriptionId },
      });

      const allocatedCredits = existingPartnerPlans
        .filter(p => p.id !== planId)
        .reduce((sum, p) => sum + p.totalCredits, 0);

      const availableCredits = parentSubscription.plan.totalCredits - allocatedCredits;

      if (data.totalCredits > availableCredits) {
        throw new BadRequestException(
          `Cannot allocate ${data.totalCredits} credits. Only ${availableCredits} credits available.`
        );
      }
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== plan.slug) {
      const existing = await this.subscriptionPlanRepository.findOne({ where: { slug: data.slug } });
      if (existing) {
        throw new BadRequestException(`Plan with slug ${data.slug} already exists`);
      }
    }

    // Update plan
    Object.assign(plan, data);
    return this.subscriptionPlanRepository.save(plan);
  }

  /**
   * Delete a partner plan
   */
  async deletePartnerPlan(planId: string, tenantId: string): Promise<void> {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id: planId },
    });

    if (!plan || !plan.parentSubscriptionId) {
      throw new NotFoundException('Partner plan not found');
    }

    // Verify parent subscription belongs to tenant
    const parentSubscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: plan.parentSubscriptionId, tenantId },
    });

    if (!parentSubscription) {
      throw new NotFoundException('Parent subscription not found');
    }

    // Check if there are active subscriptions using this plan
    const activeSubscriptions = await this.tenantSubscriptionRepository.count({
      where: { planId: plan.id, status: SubscriptionStatus.ACTIVE }
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot delete partner plan. ${activeSubscriptions} truck owner(s) are currently using this plan.`
      );
    }

    await this.subscriptionPlanRepository.remove(plan);
  }

  /**
   * Get available credits for a parent subscription
   */
  async getParentSubscriptionAvailableCredits(subscriptionId: string, tenantId: string): Promise<number> {
    const parentSubscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId, tenantId },
      relations: ['plan'],
    });

    if (!parentSubscription) {
      throw new NotFoundException('Parent subscription not found');
    }

    const partnerPlans = await this.subscriptionPlanRepository.find({
      where: { parentSubscriptionId: subscriptionId },
    });

    const allocatedCredits = partnerPlans.reduce((sum, plan) => sum + plan.totalCredits, 0);
    return parentSubscription.plan.totalCredits - allocatedCredits;
  }

  /**
   * Get truck owners who purchased partner plans created by tenant admin
   */
  async getPartnerSubscribers(tenantId: string): Promise<any[]> {
    // Step 1: Find all partner plans where parent subscription belongs to this tenant
    const partnerPlans = await this.subscriptionPlanRepository
      .createQueryBuilder('plan')
      .innerJoin('tenant_subscriptions', 'parent_sub', 'plan.parent_subscription_id = parent_sub.id')
      .where('parent_sub.tenantId = :tenantId', { tenantId })
      .andWhere('plan.parent_subscription_id IS NOT NULL')
      .getMany();

    if (partnerPlans.length === 0) {
      return [];
    }

    const partnerPlanIds = partnerPlans.map(plan => plan.id);

    // Step 2: Find all subscriptions for these partner plans
    const subscribers = await this.tenantSubscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.plan', 'plan')
      .where('sub.planId IN (:...partnerPlanIds)', { partnerPlanIds })
      .andWhere('sub.userId IS NOT NULL')
      .orderBy('sub.createdAt', 'DESC')
      .getMany();

    // Step 3: Enrich with user and credit information
    const enrichedSubscriptions = await Promise.all(
      subscribers.map(async (sub: any) => {
        let creditBalance = 0;
        let lifetimeSpent = 0;
        let userEmail = 'N/A';
        let truckOwnerName = 'Unknown';

        // Fetch user information
        if (sub.userId) {
          try {
            const user = await this.tenantSubscriptionRepository.manager
              .createQueryBuilder()
              .select(['user.id', 'user.email', 'profile.firstName', 'profile.lastName', 'profile.companyName'])
              .from('users', 'user')
              .leftJoin('user_profiles', 'profile', 'user.id = profile.userId')
              .where('user.id = :userId', { userId: sub.userId })
              .getRawOne();

            if (user) {
              userEmail = user.user_email || 'N/A';
              truckOwnerName = user.profile_companyName || 
                              (user.profile_firstName && user.profile_lastName 
                                ? `${user.profile_firstName} ${user.profile_lastName}` 
                                : userEmail.split('@')[0]) || 
                              'Unknown';
            }
          } catch (error) {
            console.warn(`Could not fetch user info for userId ${sub.userId}:`, error.message);
          }

          // Fetch credit account
          try {
            const creditAccount = await this.creditService.getOrCreateCreditAccount(sub.tenantId, sub.userId);
            creditBalance = creditAccount?.currentBalance || 0;
            lifetimeSpent = creditAccount?.lifetimeSpent || 0;
          } catch (error) {
            console.warn(`Could not get credit account for subscription ${sub.id}:`, error.message);
          }
        }

        // Calculate days until expiry
        const now = new Date();
        const expiryDate = new Date(sub.currentPeriodEnd);
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Determine status
        let status = 'active';
        if (sub.status === SubscriptionStatus.CANCELLED || sub.status === SubscriptionStatus.SUSPENDED) {
          status = 'expired';
        } else if (daysLeft <= 7) {
          status = 'expiring';
        }

        return {
          id: sub.id,
          userId: sub.userId,
          truckOwnerName,
          email: userEmail,
          planName: sub.plan?.name || 'Unknown Plan',
          planSlug: sub.plan?.slug || '',
          status,
          creditsRemaining: creditBalance,
          creditsTotal: sub.plan?.creditCostPerPartner || sub.plan?.totalCredits || 0,
          purchaseDate: sub.createdAt,
          expiryDate: sub.currentPeriodEnd,
          daysLeft,
          lifetimeSpent,
        };
      })
    );

    return enrichedSubscriptions;
  }

  /**
   * Get available plans with slot information for truck owners
   */
  async getAvailablePlansWithSlotInfo(tenantId: string): Promise<any[]> {
    // Get system admin plans (no parent subscription)
    const systemPlans = await this.getAvailablePlans();

    // Get partner plans created by tenant admin
    const partnerPlans = await this.getPartnerPlans(tenantId);

    // Combine both
    const allPlans = [
      ...systemPlans.filter(p => !p.parentSubscriptionId),
      ...partnerPlans.filter(p => p.isActive),
    ];

    // Add purchased count and slots remaining for partner plans
    const plansWithSlotInfo = await Promise.all(
      allPlans.map(async (plan) => {
        if (plan.parentSubscriptionId && plan.creditCostPerPartner) {
          // This is a partner plan - get purchased count
          const purchasedCount = await this.tenantSubscriptionRepository.count({
            where: {
              planId: plan.id,
              status: SubscriptionStatus.ACTIVE,
            },
          });

          return {
            ...plan,
            purchasedCount,
            slotsRemaining: plan.availableSlots - purchasedCount,
            isFull: purchasedCount >= plan.availableSlots,
          };
        }
        return plan;
      })
    );

    return plansWithSlotInfo;
  }
}
