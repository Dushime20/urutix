
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
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
import { MobileMoneyPaymentService, MobileMoneyTransfer } from '../modules/payments/services/mobile-money-payment.service';

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
  private readonly logger = new Logger(SubscriptionService.name);

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
    private configService: ConfigService,
    private mobileMoneyPaymentService: MobileMoneyPaymentService,
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
   * If userId is undefined, returns ALL subscriptions for the tenant (for admins)
   * If userId is provided, returns only that user's subscriptions
   */
  async getSubscriptionHistory(tenantId: string, userId?: string): Promise<TenantSubscription[]> {
    const queryBuilder = this.tenantSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.tenantId = :tenantId', { tenantId });

    // If userId is explicitly provided, filter by that user
    // If userId is undefined, show ALL tenant subscriptions (for admins)
    if (userId !== undefined) {
      queryBuilder.andWhere('subscription.userId = :userId', { userId });
    }
    // Note: Removed the "userId IS NULL" filter to show ALL subscriptions when userId is undefined

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

        // Calculate paid amount from completed payments
        let paidAmount = 0;
        try {
          const paymentsResult = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('COALESCE(SUM(payment.amount), 0)', 'total')
            .where('payment.tenantId = :tenantId', { tenantId: sub.tenantId })
            .andWhere('payment.paymentType = :paymentType', { paymentType: PaymentType.SUBSCRIPTION })
            .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED })
            .andWhere("payment.metadata->>'subscriptionId' = :subscriptionId", { 
              subscriptionId: sub.id 
            })
            .getRawOne();
          
          paidAmount = Number(paymentsResult?.total || 0);
        } catch (error) {
          console.warn(`Could not calculate paid amount for subscription ${sub.id}:`, error.message);
        }

        // Calculate total subscription value (what they purchased)
        // This is based on credits purchased × price per credit
        let totalAmount = 0;
        if (sub.plan) {
          if (sub.plan.pricePerCredit && Number(sub.plan.pricePerCredit) > 0) {
            // Credit-based pricing - calculate from credits granted
            const creditsGranted = sub.plan.creditCostPerPartner || sub.plan.totalCredits || 0;
            if (creditsGranted > 0) {
              totalAmount = Number(sub.plan.pricePerCredit) * creditsGranted;
            }
          } else if (sub.plan.priceMonthly || sub.plan.priceYearly) {
            // Fixed subscription pricing
            totalAmount = sub.billingCycle === 'monthly' 
              ? Number(sub.plan.priceMonthly || 0)
              : Number(sub.plan.priceYearly || 0);
          }
        }

        return {
          ...sub,
          tenantName: sub.tenant?.name || 'Unknown',
          creditBalance,
          totalRevenue: paidAmount, // Keep for backward compatibility
          paidAmount,
          totalAmount,
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
      undefined, // Always credit tenant-level account (userId = null) — all credits belong to the company
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
   * Purchase a subscription with payment processing via ishema Mobile Money.
   *
   * Collection pattern:
   *   payer   = customer's phone (gets PIN popup, is charged)
   *   receiver = MOBILE_MONEY_ACCOUNT_PHONE (platform collects the subscription fee)
   *
   * The subscription and credits are only activated AFTER the ishema API
   * confirms the transaction was accepted (status = pending or success).
   * A PENDING status from ishema is acceptable — it means the PIN popup
   * was delivered; the webhook will confirm final success.
   */
  async purchaseSubscription(data: {
    tenantId: string;
    userId: string;
    planId: string;
    paymentMethod: 'card' | 'mobile_money';
    paymentDetails: any; // { phoneNumber: string } for mobile_money
  }): Promise<any> {
    const plan = await this.getPlan(data.planId);

    // Partner plan slot check
    if (plan.parentSubscriptionId && plan.creditCostPerPartner) {
      const purchasedCount = await this.tenantSubscriptionRepository.count({
        where: { planId: data.planId, status: SubscriptionStatus.ACTIVE },
      });
      if (purchasedCount >= plan.availableSlots) {
        throw new BadRequestException(
          `This partner plan has no available slots. All ${plan.availableSlots} slots have been purchased.`,
        );
      }
      this.logger.log(
        `[SubscriptionService] Partner plan slot check: ${purchasedCount}/${plan.availableSlots} slots used`,
      );
    }

    const creditsToGrant = plan.creditCostPerPartner || plan.totalCredits;
    const totalAmount = creditsToGrant === -1 ? 0 : Number(plan.pricePerCredit) * creditsToGrant;

    // Currency — subscriptions are priced in RWF (align with all other ishema payments)
    const currency = this.configService.get<string>('MOBILE_MONEY_CURRENCY') || 'RWF';

    let externalTransactionId: string | null = null;

    // ── Real payment via ishema (mobile money) ────────────────────────────
    if (totalAmount > 0 && data.paymentMethod === 'mobile_money') {
      const payerPhone: string = data.paymentDetails?.phoneNumber;
      if (!payerPhone) {
        throw new BadRequestException(
          'phoneNumber is required in paymentDetails for mobile_money subscription payment.',
        );
      }

      const platformPhone = this.configService.get<string>('MOBILE_MONEY_ACCOUNT_PHONE');
      if (!platformPhone) {
        throw new BadRequestException(
          'MOBILE_MONEY_ACCOUNT_PHONE is not configured. Cannot collect subscription payment.',
        );
      }

      const referenceId = `SUB-${data.tenantId.slice(-8).toUpperCase()}-${Date.now()}`;
      const senderMessage =
        `Subscription: ${plan.name} — ${creditsToGrant} credits (${currency} ${totalAmount})`.substring(0, 160);
      const callbackUrl = this.configService.get<string>('MOBILE_MONEY_CALLBACK_URL');

      const transfers: MobileMoneyTransfer[] = [
        {
          percentage: 100,
          phoneNumber: platformPhone,
          receiverMessage: senderMessage,
        },
      ];

      this.logger.log(
        `Initiating subscription payment: ${totalAmount} ${currency} from ${payerPhone} ` +
        `to platform ${platformPhone} | plan: ${plan.name} | ref: ${referenceId}`,
      );

      // This throws on failure — no subscription or credits are activated on error
      const mmResponse = await this.mobileMoneyPaymentService.createTransaction(
        totalAmount,
        payerPhone,
        referenceId,
        senderMessage,
        transfers,
        callbackUrl,
      );

      const txn = mmResponse.savedTransaction || mmResponse.transaction;
      externalTransactionId = txn?.externalId || txn?.id || referenceId;

      this.logger.log(
        `Subscription payment accepted by ishema: externalId=${externalTransactionId}, status=${txn?.status}`,
      );
    }

    // Card payments — not yet integrated; reject explicitly so no fake charges occur
    if (totalAmount > 0 && data.paymentMethod === 'card') {
      throw new BadRequestException(
        'Card payments are not yet supported. Please use mobile_money.',
      );
    }

    // ── Activate subscription & credits (payment confirmed or free plan) ──
    const subscription = await this.createSubscription({
      tenantId: data.tenantId,
      userId: null,
      planId: data.planId,
      billingCycle: BillingCycle.MONTHLY,
      paymentMethodId: externalTransactionId || undefined,
      startTrial: false,
    });

    // Persist payer phone in subscription metadata for auto-renewal
    if (data.paymentDetails?.phoneNumber) {
      await this.tenantSubscriptionRepository.update(subscription.id, {
        metadata: {
          ...(subscription.metadata || {}),
          payerPhone: data.paymentDetails.phoneNumber,
          paymentMethod: data.paymentMethod,
        } as any,
      });
    }

    if (creditsToGrant > 0) {
      await this.creditService.grantSubscriptionCredits(
        data.tenantId,
        creditsToGrant,
        subscription.id,
        subscription.currentPeriodEnd,
        undefined,
      );
    }

    if (plan.parentSubscriptionId && plan.creditCostPerPartner) {
      await this.creditService.trackPartnerPlanRevenue(
        data.tenantId,
        totalAmount,
        creditsToGrant,
      );
    }

    // ── Record payment in payments table ─────────────────────────────────
    if (totalAmount > 0) {
      try {
        const methodMap: Record<string, PaymentMethod> = {
          card: PaymentMethod.CREDIT_CARD,
          mobile_money: PaymentMethod.DIGITAL_WALLET,
        };
        // Store as PROCESSING for mobile money (webhook confirms); COMPLETED for card (not used yet)
        const paymentStatus =
          data.paymentMethod === 'mobile_money'
            ? PaymentStatus.PROCESSING
            : PaymentStatus.COMPLETED;

        const payment = this.paymentRepository.create({
          tenantId: data.tenantId,
          payerId: data.userId,
          amount: totalAmount,
          currency,
          paymentMethod: methodMap[data.paymentMethod] ?? PaymentMethod.DIGITAL_WALLET,
          paymentType: PaymentType.SUBSCRIPTION,
          status: paymentStatus,
          transactionId: externalTransactionId,
          referenceNumber: externalTransactionId,
          description: `Subscription: ${plan.name} (${creditsToGrant} credits)`,
          processedAt: paymentStatus === PaymentStatus.COMPLETED ? new Date() : undefined,
          metadata: {
            planId: data.planId,
            planName: plan.name,
            subscriptionId: subscription.id,
            creditsGranted: creditsToGrant,
            payerPhone: data.paymentDetails?.phoneNumber,
          },
        });
        await this.paymentRepository.save(payment);
      } catch (e) {
        // Non-fatal — payment already accepted by ishema; don't fail the whole request
        this.logger.error('[SubscriptionService] Failed to save payment record:', e.message);
      }
    }

    return {
      subscription,
      payment: {
        success: true,
        transactionId: externalTransactionId,
        amount: totalAmount,
        currency,
        paymentMethod: data.paymentMethod,
        status: totalAmount === 0 ? 'completed' : 'processing',
        message:
          totalAmount === 0
            ? 'Free plan activated'
            : 'Payment initiated — awaiting PIN confirmation on your mobile phone.',
      },
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
        undefined, // Always credit tenant-level account on upgrade
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
   * Renew subscription — charges the stored phone via ishema and extends the period.
   * Called by the daily scheduler (2 AM) for auto-renewing subscriptions.
   *
   * The phone number is stored in subscription.metadata.payerPhone at purchase time.
   * If it is missing the renewal is skipped (subscription stays active, no charge).
   */
  async renewSubscription(subscriptionId: string, paymentId?: string): Promise<TenantSubscription> {
    const subscription = await this.tenantSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) return null;

    // Apply any scheduled plan downgrade
    if (subscription.metadata?.scheduledDowngrade) {
      subscription.planId = subscription.metadata.scheduledDowngrade.planId;
      delete subscription.metadata.scheduledDowngrade;
    }

    const plan = subscription.plan;
    const creditsToGrant = plan?.includedCredits || 0;
    const currency = this.configService.get<string>('MOBILE_MONEY_CURRENCY') || 'RWF';
    const totalAmount =
      plan && plan.pricePerCredit && creditsToGrant > 0
        ? Number(plan.pricePerCredit) * creditsToGrant
        : 0;

    let externalTransactionId: string | null = paymentId || null;

    // ── Charge via ishema for paid plans ──────────────────────────────────
    if (totalAmount > 0) {
      const payerPhone: string | undefined =
        (subscription.metadata as any)?.payerPhone ||
        (subscription.metadata as any)?.phoneNumber;

      const platformPhone = this.configService.get<string>('MOBILE_MONEY_ACCOUNT_PHONE');

      if (!payerPhone || !platformPhone) {
        this.logger.warn(
          `[renewSubscription] Cannot charge for subscription ${subscriptionId}: ` +
          `payerPhone=${payerPhone}, platformPhone=${platformPhone}. Skipping payment.`,
        );
        // Do not extend the subscription period without a successful charge
        return subscription;
      }

      const referenceId = `RENEW-${subscriptionId.slice(-8).toUpperCase()}-${Date.now()}`;
      const senderMessage =
        `Renewal: ${plan.name} — ${creditsToGrant} credits (${currency} ${totalAmount})`.substring(0, 160);

      try {
        this.logger.log(
          `[renewSubscription] Charging ${totalAmount} ${currency} from ${payerPhone} ` +
          `for subscription ${subscriptionId} renewal | ref: ${referenceId}`,
        );

        const mmResponse = await this.mobileMoneyPaymentService.createTransaction(
          totalAmount,
          payerPhone,
          referenceId,
          senderMessage,
          [{ percentage: 100, phoneNumber: platformPhone, receiverMessage: senderMessage }],
          this.configService.get<string>('MOBILE_MONEY_CALLBACK_URL'),
        );

        const txn = mmResponse.savedTransaction || mmResponse.transaction;
        externalTransactionId = txn?.externalId || txn?.id || referenceId;
        this.logger.log(`[renewSubscription] ishema accepted renewal: externalId=${externalTransactionId}`);
      } catch (err: any) {
        this.logger.error(
          `[renewSubscription] ishema payment failed for subscription ${subscriptionId}: ${err.message}`,
        );
        // Mark subscription as suspended so the user knows payment failed
        subscription.status = SubscriptionStatus.SUSPENDED;
        subscription.metadata = {
          ...(subscription.metadata || {}),
          paymentFailed: true,
          lastFailedRenewal: new Date().toISOString(),
          lastFailureReason: err.message,
        };
        await this.tenantSubscriptionRepository.save(subscription);
        return subscription;
      }
    }

    // ── Extend the subscription period ────────────────────────────────────
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
    subscription.status = SubscriptionStatus.ACTIVE;
    // Clear any previous failure flags
    if ((subscription.metadata as any)?.paymentFailed) {
      subscription.metadata = { ...(subscription.metadata || {}) };
      delete (subscription.metadata as any).paymentFailed;
      delete (subscription.metadata as any).lastFailedRenewal;
      delete (subscription.metadata as any).lastFailureReason;
    }

    const updatedSubscription = await this.tenantSubscriptionRepository.save(subscription);

    // Grant credits for the new period
    if (creditsToGrant > 0) {
      await this.creditService.grantSubscriptionCredits(
        subscription.tenantId,
        creditsToGrant,
        subscription.id,
        subscription.currentPeriodEnd,
        undefined,
      );
    }

    // Record renewal payment
    if (totalAmount > 0 && externalTransactionId) {
      try {
        const renewalPayment = this.paymentRepository.create({
          tenantId: subscription.tenantId,
          payerId: subscription.userId || subscription.tenantId,
          amount: totalAmount,
          currency,
          paymentMethod: PaymentMethod.DIGITAL_WALLET,
          paymentType: PaymentType.SUBSCRIPTION,
          status: PaymentStatus.PROCESSING,
          transactionId: externalTransactionId,
          referenceNumber: externalTransactionId,
          description: `Subscription renewal: ${plan?.name || subscriptionId}`,
          metadata: {
            subscriptionId: subscription.id,
            planId: subscription.planId,
            planName: plan?.name,
            creditsGranted: creditsToGrant,
            renewalPeriodEnd: subscription.currentPeriodEnd,
          },
        });
        await this.paymentRepository.save(renewalPayment);
      } catch (e) {
        this.logger.error('[renewSubscription] Failed to save renewal payment record:', e.message);
      }
    }

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
