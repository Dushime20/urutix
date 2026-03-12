import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreditAccount } from '../entities/credit-account.entity';
import { TenantSubscription, SubscriptionStatus } from '../entities/tenant-subscription.entity';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';
import { CreditService } from './credit.service';
import { SubscriptionService } from './subscription.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationType } from '../entities/notification-preference.entity';

export interface NotificationData {
  type: 'LOW_BALANCE' | 'SUBSCRIPTION_EXPIRING' | 'TRIAL_EXPIRING' | 'PAYMENT_FAILED' | 'CREDITS_EXPIRED';
  tenantId: string;
  userId?: string;
  data: Record<string, any>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

@Injectable()
export class SubscriptionNotificationService {
  private readonly logger = new Logger(SubscriptionNotificationService.name);

  constructor(
    @InjectRepository(CreditAccount)
    private creditAccountRepository: Repository<CreditAccount>,
    @InjectRepository(TenantSubscription)
    private subscriptionRepository: Repository<TenantSubscription>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private creditService: CreditService,
    private subscriptionService: SubscriptionService,
    private notificationDeliveryService: NotificationDeliveryService,
  ) {}

  /**
   * Check for low balance accounts and send notifications
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkLowBalanceAccounts(): Promise<void> {
    this.logger.log('Checking for low balance accounts...');

    try {
      // Define thresholds
      const criticalThreshold = 50; // Urgent notification
      const warningThreshold = 200; // High priority notification
      const lowThreshold = 500; // Medium priority notification

      // Get accounts with low balances
      const lowBalanceAccounts = await this.creditAccountRepository
        .createQueryBuilder('account')
        .leftJoinAndSelect('account.tenant', 'tenant')
        .leftJoinAndSelect('account.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('account.currentBalance <= :threshold', { threshold: lowThreshold })
        .andWhere('account.currentBalance > 0')
        .getMany();

      for (const account of lowBalanceAccounts) {
        const balance = account.currentBalance;
        let priority: 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';

        if (balance <= criticalThreshold) {
          priority = 'URGENT';
        } else if (balance <= warningThreshold) {
          priority = 'HIGH';
        }

        // Check if we've already sent a notification recently
        const lastNotificationKey = `low_balance_${account.tenantId}_${account.userId || 'tenant'}`;
        const shouldNotify = await this.shouldSendNotification(lastNotificationKey, priority);

        if (shouldNotify) {
          await this.sendLowBalanceNotification({
            type: 'LOW_BALANCE',
            tenantId: account.tenantId,
            userId: account.userId,
            priority,
            data: {
              currentBalance: balance,
              threshold: priority === 'URGENT' ? criticalThreshold : 
                        priority === 'HIGH' ? warningThreshold : lowThreshold,
              tenantName: account.tenant?.name || 'Unknown',
              userName: account.user?.profile?.firstName || account.user?.email || null,
              estimatedDaysRemaining: this.estimateDaysRemaining(balance, account.tenantId),
            },
          });

          await this.recordNotificationSent(lastNotificationKey);
        }
      }

      this.logger.log(`Processed ${lowBalanceAccounts.length} low balance accounts`);
    } catch (error) {
      this.logger.error('Error checking low balance accounts:', error);
    }
  }

  /**
   * Check for expiring subscriptions
   * Runs daily at 9 AM
   */
  @Cron('0 9 * * *')
  async checkExpiringSubscriptions(): Promise<void> {
    this.logger.log('Checking for expiring subscriptions...');

    try {
      // Get subscriptions expiring in 7, 3, and 1 days
      const expiringIn7Days = await this.subscriptionService.getExpiringSubscriptions(7);
      const expiringIn3Days = await this.subscriptionService.getExpiringSubscriptions(3);
      const expiringIn1Day = await this.subscriptionService.getExpiringSubscriptions(1);

      // Process 7-day notifications (Medium priority)
      for (const subscription of expiringIn7Days) {
        await this.sendSubscriptionExpiringNotification(subscription, 7, 'MEDIUM');
      }

      // Process 3-day notifications (High priority)
      for (const subscription of expiringIn3Days) {
        await this.sendSubscriptionExpiringNotification(subscription, 3, 'HIGH');
      }

      // Process 1-day notifications (Urgent priority)
      for (const subscription of expiringIn1Day) {
        await this.sendSubscriptionExpiringNotification(subscription, 1, 'URGENT');
      }

      this.logger.log(`Processed expiring subscriptions: 7d=${expiringIn7Days.length}, 3d=${expiringIn3Days.length}, 1d=${expiringIn1Day.length}`);
    } catch (error) {
      this.logger.error('Error checking expiring subscriptions:', error);
    }
  }

  /**
   * Check for expiring trials
   * Runs daily at 10 AM
   */
  @Cron('0 10 * * *')
  async checkExpiringTrials(): Promise<void> {
    this.logger.log('Checking for expiring trials...');

    try {
      // Get trials expiring in 3 and 1 days
      const expiringIn3Days = await this.subscriptionService.getExpiringTrials(3);
      const expiringIn1Day = await this.subscriptionService.getExpiringTrials(1);

      // Process 3-day trial notifications (High priority)
      for (const subscription of expiringIn3Days) {
        await this.sendTrialExpiringNotification(subscription, 3, 'HIGH');
      }

      // Process 1-day trial notifications (Urgent priority)
      for (const subscription of expiringIn1Day) {
        await this.sendTrialExpiringNotification(subscription, 1, 'URGENT');
      }

      this.logger.log(`Processed expiring trials: 3d=${expiringIn3Days.length}, 1d=${expiringIn1Day.length}`);
    } catch (error) {
      this.logger.error('Error checking expiring trials:', error);
    }
  }

  /**
   * Send low balance notification
   */
  private async sendLowBalanceNotification(notification: NotificationData): Promise<void> {
    const { tenantId, userId, data, priority } = notification;

    this.logger.log(`Sending low balance notification: ${tenantId}${userId ? `/${userId}` : ''} - ${data.currentBalance} credits`);

    const message = this.buildLowBalanceMessage(data);
    
    // Use the notification delivery service
    await this.notificationDeliveryService.sendNotification({
      tenantId,
      userId,
      type: NotificationType.LOW_BALANCE,
      subject: `Credit Balance Alert - ${data.currentBalance} credits remaining`,
      message,
      priority,
      data,
    });
  }

  /**
   * Send subscription expiring notification
   */
  private async sendSubscriptionExpiringNotification(
    subscription: TenantSubscription,
    daysRemaining: number,
    priority: 'MEDIUM' | 'HIGH' | 'URGENT'
  ): Promise<void> {
    const notificationKey = `subscription_expiring_${subscription.tenantId}_${daysRemaining}d`;
    const shouldNotify = await this.shouldSendNotification(notificationKey, priority);

    if (!shouldNotify) return;

    this.logger.log(`Sending subscription expiring notification: ${subscription.tenantId} - ${daysRemaining} days`);

    const message = this.buildSubscriptionExpiringMessage(subscription, daysRemaining);

    // Use the notification delivery service
    await this.notificationDeliveryService.sendNotification({
      tenantId: subscription.tenantId,
      type: NotificationType.SUBSCRIPTION_EXPIRING,
      subject: `Subscription Expiring in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
      message,
      priority,
      data: {
        subscriptionId: subscription.id,
        daysRemaining,
        currentPeriodEnd: subscription.currentPeriodEnd,
        planName: subscription.plan?.name || 'Unknown',
        autoRenew: subscription.autoRenew,
      },
    });

    await this.recordNotificationSent(notificationKey);
  }

  /**
   * Send trial expiring notification
   */
  private async sendTrialExpiringNotification(
    subscription: TenantSubscription,
    daysRemaining: number,
    priority: 'HIGH' | 'URGENT'
  ): Promise<void> {
    const notificationKey = `trial_expiring_${subscription.tenantId}_${daysRemaining}d`;
    const shouldNotify = await this.shouldSendNotification(notificationKey, priority);

    if (!shouldNotify) return;

    this.logger.log(`Sending trial expiring notification: ${subscription.tenantId} - ${daysRemaining} days`);

    const message = this.buildTrialExpiringMessage(subscription, daysRemaining);

    // Use the notification delivery service
    await this.notificationDeliveryService.sendNotification({
      tenantId: subscription.tenantId,
      type: NotificationType.TRIAL_EXPIRING,
      subject: `Trial Expiring in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
      message,
      priority,
      data: {
        subscriptionId: subscription.id,
        daysRemaining,
        trialEnd: subscription.trialEnd,
        planName: subscription.plan?.name || 'Unknown',
        hasPaymentMethod: !!subscription.paymentMethodId,
      },
    });

    await this.recordNotificationSent(notificationKey);
  }

  /**
   * Build low balance message
   */
  private buildLowBalanceMessage(data: any): string {
    const { currentBalance, userName, tenantName, estimatedDaysRemaining } = data;
    
    const recipient = userName || tenantName;
    const daysText = estimatedDaysRemaining > 0 ? 
      ` (approximately ${estimatedDaysRemaining} days remaining)` : '';

    if (currentBalance <= 50) {
      return `🚨 URGENT: ${recipient}, your credit balance is critically low (${currentBalance} credits)${daysText}. Please purchase credits immediately to avoid service interruption.`;
    } else if (currentBalance <= 200) {
      return `⚠️ WARNING: ${recipient}, your credit balance is running low (${currentBalance} credits)${daysText}. Consider purchasing credits soon.`;
    } else {
      return `💡 NOTICE: ${recipient}, your credit balance is getting low (${currentBalance} credits)${daysText}. You may want to purchase credits.`;
    }
  }

  /**
   * Build subscription expiring message
   */
  private buildSubscriptionExpiringMessage(subscription: TenantSubscription, daysRemaining: number): string {
    const planName = subscription.plan?.name || 'subscription';
    const autoRenewText = subscription.autoRenew ? 
      ' Your subscription will auto-renew.' : 
      ' Please renew manually to continue service.';

    if (daysRemaining === 1) {
      return `🚨 Your ${planName} subscription expires tomorrow!${autoRenewText}`;
    } else {
      return `⏰ Your ${planName} subscription expires in ${daysRemaining} days.${autoRenewText}`;
    }
  }

  /**
   * Build trial expiring message
   */
  private buildTrialExpiringMessage(subscription: TenantSubscription, daysRemaining: number): string {
    const planName = subscription.plan?.name || 'trial';
    const paymentText = subscription.paymentMethodId ? 
      ' Your subscription will automatically convert to paid.' : 
      ' Please add a payment method to continue service.';

    if (daysRemaining === 1) {
      return `🚨 Your ${planName} trial expires tomorrow!${paymentText}`;
    } else {
      return `⏰ Your ${planName} trial expires in ${daysRemaining} days.${paymentText}`;
    }
  }

  /**
   * Estimate days remaining based on usage patterns
   */
  private async estimateDaysRemaining(currentBalance: number, tenantId: string): Promise<number> {
    try {
      const stats = await this.creditService.getUsageStatistics(tenantId, 30);
      const dailyAverage = stats.averageDaily || 10; // Default to 10 credits per day
      
      if (dailyAverage <= 0) return 999; // No usage pattern
      
      return Math.floor(currentBalance / dailyAverage);
    } catch (error) {
      this.logger.warn(`Could not estimate days remaining for tenant ${tenantId}:`, error);
      return Math.floor(currentBalance / 10); // Fallback estimate
    }
  }

  /**
   * Check if we should send a notification (rate limiting)
   */
  private async shouldSendNotification(key: string, priority: string): Promise<boolean> {
    // Simple in-memory rate limiting (in production, use Redis or database)
    const now = new Date();
    const lastSent = this.notificationCache.get(key);

    if (!lastSent) return true;

    const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

    // Rate limiting based on priority
    switch (priority) {
      case 'URGENT':
        return hoursSinceLastSent >= 2; // Every 2 hours
      case 'HIGH':
        return hoursSinceLastSent >= 6; // Every 6 hours
      case 'MEDIUM':
        return hoursSinceLastSent >= 24; // Daily
      default:
        return hoursSinceLastSent >= 24;
    }
  }

  /**
   * Record that a notification was sent
   */
  private async recordNotificationSent(key: string): Promise<void> {
    this.notificationCache.set(key, new Date());
  }

  /**
   * Log notification for debugging and audit trail
   */
  private async logNotification(notification: {
    type: string;
    tenantId: string;
    userId?: string;
    priority: string;
    message: string;
    data: any;
  }): Promise<void> {
    this.logger.log(`[${notification.priority}] ${notification.type}: ${notification.message}`);
    
    // TODO: Store in database for audit trail
    // await this.notificationLogRepository.save({
    //   ...notification,
    //   sentAt: new Date(),
    // });
  }

  // Simple in-memory cache for notification rate limiting
  // In production, use Redis or database
  private notificationCache = new Map<string, Date>();

  /**
   * Manual method to send immediate notifications (for testing)
   */
  async sendTestNotification(tenantId: string, type: string): Promise<void> {
    this.logger.log(`Sending test notification: ${type} for tenant ${tenantId}`);

    switch (type) {
      case 'low_balance':
        const account = await this.creditService.getOrCreateCreditAccount(tenantId);
        await this.sendLowBalanceNotification({
          type: 'LOW_BALANCE',
          tenantId,
          priority: 'HIGH',
          data: {
            currentBalance: account.currentBalance,
            threshold: 200,
            tenantName: 'Test Tenant',
            estimatedDaysRemaining: 5,
          },
        });
        break;

      case 'subscription_expiring':
        const subscription = await this.subscriptionRepository.findOne({
          where: { tenantId, status: SubscriptionStatus.ACTIVE },
          relations: ['plan'],
        });
        if (subscription) {
          await this.sendSubscriptionExpiringNotification(subscription, 3, 'HIGH');
        }
        break;

      default:
        this.logger.warn(`Unknown test notification type: ${type}`);
    }
  }
}