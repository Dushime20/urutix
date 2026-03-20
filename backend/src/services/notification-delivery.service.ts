import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog, NotificationStatus } from './../entities/notification-log.entity';
import { NotificationPreference, NotificationChannel, NotificationType } from './../entities/notification-preference.entity';

export interface NotificationPayload {
  tenantId: string;
  userId?: string;
  type: NotificationType;
  subject?: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  data?: Record<string, any>;
  channels?: NotificationChannel[];
}

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(
    @InjectRepository(NotificationLog)
    private notificationLogRepository: Repository<NotificationLog>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
  ) {}

  /**
   * Send notification through all enabled channels
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    this.logger.log(`Sending notification: ${payload.type} to tenant ${payload.tenantId}`);

    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(payload.tenantId, payload.userId, payload.type);
      
      if (!preferences || !preferences.isEnabled) {
        this.logger.log(`Notifications disabled for ${payload.type}`);
        return;
      }

      // Determine channels to use
      const channels = payload.channels || preferences.enabledChannels;

      // Send through each enabled channel
      for (const channel of channels) {
        await this.sendThroughChannel(payload, channel, preferences);
      }
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`, error);
    }
  }

  /**
   * Send notification through specific channel
   */
  private async sendThroughChannel(
    payload: NotificationPayload,
    channel: NotificationChannel,
    preferences: NotificationPreference,
  ): Promise<void> {
    const recipientAddress = this.getRecipientAddress(channel, preferences);
    if (!recipientAddress) {
      this.logger.warn(`No recipient address for channel ${channel}`);
      return;
    }

    // Create notification log entry
    const logEntry = this.notificationLogRepository.create({
      tenantId: payload.tenantId,
      userId: payload.userId,
      notificationType: payload.type,
      channel,
      recipientAddress,
      subject: payload.subject,
      message: payload.message,
      priority: payload.priority,
      status: NotificationStatus.PENDING,
      metadata: {
        templateVariables: payload.data,
        retryCount: 0,
      },
    });

    const savedLog = await this.notificationLogRepository.save(logEntry);

    try {
      // Send through appropriate provider
      switch (channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmail(savedLog, preferences);
          break;
        case NotificationChannel.SMS:
          await this.sendSMS(savedLog, preferences);
          break;
        case NotificationChannel.PUSH:
          await this.sendPushNotification(savedLog, preferences);
          break;
        case NotificationChannel.IN_APP:
          await this.sendInAppNotification(savedLog, preferences);
          break;
        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }

      // Update status to sent
      await this.updateNotificationStatus(savedLog.id, NotificationStatus.SENT);
    } catch (error) {
      this.logger.error(`Failed to send via ${channel}: ${error.message}`);
      await this.updateNotificationStatus(savedLog.id, NotificationStatus.FAILED, error.message);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(log: NotificationLog, preferences: NotificationPreference): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    this.logger.log(`[EMAIL] Sending to ${log.recipientAddress}: ${log.subject}`);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In production, integrate with your email provider:
    // await this.emailService.send({
    //   to: log.recipientAddress,
    //   subject: log.subject,
    //   html: log.message,
    //   priority: log.priority,
    // });
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(log: NotificationLog, preferences: NotificationPreference): Promise<void> {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    this.logger.log(`[SMS] Sending to ${log.recipientAddress}: ${log.message.substring(0, 50)}...`);
    
    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In production, integrate with your SMS provider:
    // await this.smsService.send({
    //   to: log.recipientAddress,
    //   message: log.message,
    //   priority: log.priority,
    // });
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(log: NotificationLog, preferences: NotificationPreference): Promise<void> {
    // TODO: Integrate with push service (Firebase, OneSignal, etc.)
    this.logger.log(`[PUSH] Sending to ${log.recipientAddress}: ${log.subject}`);
    
    // Simulate push sending
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(log: NotificationLog, preferences: NotificationPreference): Promise<void> {
    // TODO: Store in database for in-app display or send via WebSocket
    this.logger.log(`[IN_APP] Storing notification for user ${log.userId}`);
    
    // In production, you might:
    // 1. Store in a notifications table for in-app display
    // 2. Send via WebSocket for real-time notifications
    // 3. Use Server-Sent Events (SSE) for live updates
  }

  /**
   * Get recipient address based on channel
   */
  private getRecipientAddress(channel: NotificationChannel, preferences: NotificationPreference): string | null {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return preferences.emailAddress || preferences.user?.email || null;
      case NotificationChannel.SMS:
        return preferences.phoneNumber || null;
      case NotificationChannel.PUSH:
        // In production, this would be a device token
        return preferences.userId || null;
      case NotificationChannel.IN_APP:
        return preferences.userId || null;
      default:
        return null;
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(
    tenantId: string,
    userId?: string,
    type?: NotificationType,
  ): Promise<NotificationPreference | null> {
    const query = this.preferenceRepository
      .createQueryBuilder('pref')
      .leftJoinAndSelect('pref.user', 'user')
      .where('pref.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('pref.userId = :userId', { userId });
    } else {
      query.andWhere('pref.userId IS NULL'); // Tenant-level preferences
    }

    if (type) {
      query.andWhere('pref.notificationType = :type', { type });
    }

    return await query.getOne();
  }

  /**
   * Update notification status
   */
  private async updateNotificationStatus(
    logId: string,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: any = { status };

    switch (status) {
      case NotificationStatus.SENT:
        updateData.sentAt = new Date();
        break;
      case NotificationStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        break;
      case NotificationStatus.FAILED:
        updateData.failedAt = new Date();
        if (errorMessage) updateData.errorMessage = errorMessage;
        break;
      case NotificationStatus.OPENED:
        updateData.openedAt = new Date();
        break;
      case NotificationStatus.CLICKED:
        updateData.clickedAt = new Date();
        break;
    }

    await this.notificationLogRepository.update(logId, updateData);
  }

  /**
   * Get notification history for a user/tenant
   */
  async getNotificationHistory(
    tenantId: string,
    userId?: string,
    limit: number = 50,
  ): Promise<NotificationLog[]> {
    const query = this.notificationLogRepository
      .createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId })
      .orderBy('log.createdAt', 'DESC')
      .limit(limit);

    if (userId) {
      query.andWhere('log.userId = :userId', { userId });
    }

    return await query.getMany();
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(tenantId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.notificationLogRepository
      .createQueryBuilder('log')
      .select([
        'log.notificationType as type',
        'log.channel as channel',
        'log.status as status',
        'COUNT(*) as count',
      ])
      .where('log.tenantId = :tenantId', { tenantId })
      .andWhere('log.createdAt >= :startDate', { startDate })
      .groupBy('log.notificationType, log.channel, log.status')
      .getRawMany();

    return stats;
  }
}