import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';
import { CreditService } from './credit.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantSubscription, SubscriptionStatus } from '../entities/tenant-subscription.entity';

@Injectable()
export class SubscriptionSchedulerService {
  private readonly logger = new Logger(SubscriptionSchedulerService.name);

  constructor(
    private subscriptionService: SubscriptionService,
    private creditService: CreditService,
    @InjectRepository(TenantSubscription)
    private tenantSubscriptionRepository: Repository<TenantSubscription>,
  ) {}

  /**
   * Daily job: Process subscription renewals
   * Runs at 2:00 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processSubscriptionRenewals() {
    this.logger.log('Starting subscription renewal process...');

    try {
      // Get subscriptions expiring today
      const expiringSubscriptions = await this.subscriptionService.getExpiringSubscriptions(1);

      this.logger.log(`Found ${expiringSubscriptions.length} subscriptions to renew`);

      let renewed = 0;
      let failed = 0;

      for (const subscription of expiringSubscriptions) {
        try {
          if (subscription.autoRenew) {
            // Process payment (would integrate with payment gateway here)
            // For now, we'll just renew
            await this.subscriptionService.renewSubscription(subscription.id);
            renewed++;
            this.logger.log(`Renewed subscription ${subscription.id} for tenant ${subscription.tenantId}`);
          } else {
            // Mark as expired
            subscription.status = SubscriptionStatus.EXPIRED;
            await this.tenantSubscriptionRepository.save(subscription);
            this.logger.log(`Expired subscription ${subscription.id} (auto-renew disabled)`);
          }
        } catch (error) {
          failed++;
          this.logger.error(
            `Failed to renew subscription ${subscription.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Subscription renewal complete: ${renewed} renewed, ${failed} failed`,
      );
    } catch (error) {
      this.logger.error('Subscription renewal process failed', error.stack);
    }
  }

  /**
   * Daily job: Handle trial expirations
   * Runs at 3:00 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async processTrialExpirations() {
    this.logger.log('Starting trial expiration process...');

    try {
      const expiringTrials = await this.subscriptionService.getExpiringTrials(1);

      this.logger.log(`Found ${expiringTrials.length} trials expiring today`);

      let converted = 0;
      let suspended = 0;

      for (const subscription of expiringTrials) {
        try {
          await this.subscriptionService.handleTrialExpiry(subscription.id);

          if (subscription.paymentMethodId) {
            converted++;
            this.logger.log(`Converted trial ${subscription.id} to paid subscription`);
          } else {
            suspended++;
            this.logger.log(`Suspended trial ${subscription.id} (no payment method)`);
          }
        } catch (error) {
          this.logger.error(
            `Failed to process trial expiry ${subscription.id}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `Trial expiration complete: ${converted} converted, ${suspended} suspended`,
      );
    } catch (error) {
      this.logger.error('Trial expiration process failed', error.stack);
    }
  }

  /**
   * Daily job: Expire old credits
   * Runs at 4:00 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async expireOldCredits() {
    this.logger.log('Starting credit expiration process...');

    try {
      const totalExpired = await this.creditService.expireCredits();

      this.logger.log(`Credit expiration complete: ${totalExpired} credits expired`);
    } catch (error) {
      this.logger.error('Credit expiration process failed', error.stack);
    }
  }

  /**
   * Daily job: Send low credit warnings
   * Runs at 10:00 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendLowCreditWarnings() {
    this.logger.log('Starting low credit warning process...');

    try {
      const lowBalanceAccounts = await this.creditService.getLowBalanceTenants(100);

      this.logger.log(`Found ${lowBalanceAccounts.length} accounts with low balance`);

      for (const account of lowBalanceAccounts) {
        try {
          // Send notification (would integrate with notification service)
          this.logger.log(
            `Low credit warning for tenant ${account.tenantId}: ${account.currentBalance} credits remaining`,
          );
          // TODO: Send email/SMS notification
        } catch (error) {
          this.logger.error(
            `Failed to send low credit warning for ${account.tenantId}: ${error.message}`,
          );
        }
      }

      this.logger.log('Low credit warning process complete');
    } catch (error) {
      this.logger.error('Low credit warning process failed', error.stack);
    }
  }

  /**
   * Daily job: Send renewal reminders
   * Runs at 9:00 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendRenewalReminders() {
    this.logger.log('Starting renewal reminder process...');

    try {
      // Get subscriptions expiring in 7 days
      const upcomingRenewals = await this.subscriptionService.getExpiringSubscriptions(7);

      this.logger.log(`Found ${upcomingRenewals.length} subscriptions renewing soon`);

      for (const subscription of upcomingRenewals) {
        try {
          const daysRemaining = subscription.daysUntilRenewal;

          // Send reminder at 7, 3, and 1 day before renewal
          if ([7, 3, 1].includes(daysRemaining)) {
            this.logger.log(
              `Renewal reminder for subscription ${subscription.id}: ${daysRemaining} days remaining`,
            );
            // TODO: Send email notification
          }
        } catch (error) {
          this.logger.error(
            `Failed to send renewal reminder for ${subscription.id}: ${error.message}`,
          );
        }
      }

      this.logger.log('Renewal reminder process complete');
    } catch (error) {
      this.logger.error('Renewal reminder process failed', error.stack);
    }
  }

  /**
   * Weekly job: Generate usage reports
   * Runs every Monday at 8:00 AM
   */
  @Cron(CronExpression.EVERY_WEEK)
  async generateUsageReports() {
    this.logger.log('Starting weekly usage report generation...');

    try {
      // Get all active subscriptions
      const activeSubscriptions = await this.tenantSubscriptionRepository.find({
        where: { status: SubscriptionStatus.ACTIVE },
      });

      this.logger.log(`Generating reports for ${activeSubscriptions.length} active tenants`);

      for (const subscription of activeSubscriptions) {
        try {
          const stats = await this.creditService.getUsageStatistics(
            subscription.tenantId,
            7, // Last 7 days
          );

          this.logger.log(
            `Usage report for tenant ${subscription.tenantId}: ${stats.totalConsumed} credits consumed, avg ${stats.averageDaily}/day`,
          );

          // TODO: Send weekly usage report email
        } catch (error) {
          this.logger.error(
            `Failed to generate usage report for ${subscription.tenantId}: ${error.message}`,
          );
        }
      }

      this.logger.log('Weekly usage report generation complete');
    } catch (error) {
      this.logger.error('Usage report generation failed', error.stack);
    }
  }

  /**
   * Hourly job: Check for failed payments and retry
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async retryFailedPayments() {
    this.logger.log('Checking for failed payments to retry...');

    try {
      // Get subscriptions with failed payments in last 24 hours
      const failedSubscriptions = await this.tenantSubscriptionRepository
        .createQueryBuilder('subscription')
        .where('subscription.status = :status', { status: SubscriptionStatus.SUSPENDED })
        .andWhere('subscription.metadata @> :metadata', {
          metadata: JSON.stringify({ paymentFailed: true }),
        })
        .getMany();

      this.logger.log(`Found ${failedSubscriptions.length} subscriptions with failed payments`);

      for (const subscription of failedSubscriptions) {
        try {
          // Retry payment (would integrate with payment gateway)
          this.logger.log(`Retrying payment for subscription ${subscription.id}`);
          // TODO: Implement payment retry logic
        } catch (error) {
          this.logger.error(
            `Failed to retry payment for ${subscription.id}: ${error.message}`,
          );
        }
      }

      this.logger.log('Failed payment retry process complete');
    } catch (error) {
      this.logger.error('Failed payment retry process failed', error.stack);
    }
  }
}
