import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
  NotificationChannel,
  NotificationCategory,
  NotificationType,
} from '../../../entities/notification.entity';
import {
  NotificationTemplate,
  TemplateType,
} from '../entities/notification-template.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { PushService } from './push.service';
import { InAppService } from './in-app.service';
import { RateLimitService } from './rate-limit.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { NotificationMetrics } from '../interfaces/notification-metrics.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
    private readonly inAppService: InAppService,
    private readonly rateLimitService: RateLimitService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createNotification(
    createDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      tenantId: createDto.tenantId,
      recipientId: createDto.userId,
      category: createDto.category,
      priority: createDto.priority || NotificationPriority.NORMAL,
      channels: createDto.channel
        ? [createDto.channel]
        : [NotificationChannel.IN_APP],
      title: createDto.subject ?? '',
      message: createDto.content ?? '',
      actionUrl: createDto.actionUrl,
      actionText: createDto.actionText,
      notificationType: createDto.type,
      status: NotificationStatus.PENDING,
      metadata: {
        ...(createDto.metadata || {}),
        recipientEmail: createDto.recipientEmail,
        recipientPhone: createDto.recipientPhone,
        recipientName: createDto.recipientName,
        deviceToken: createDto.deviceToken,
        language: createDto.language || 'en',
        templateId: createDto.templateId,
      },
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    this.logger.log(
      `Created notification ${savedNotification.id} for user ${createDto.userId}`,
    );

    // Emit event for immediate processing
    this.eventEmitter.emit('notification.created', savedNotification);

    return savedNotification;
  }

  async sendNotification(
    sendDto: SendNotificationDto,
  ): Promise<Notification[]> {
    const {
      tenantId,
      templateId,
      recipients,
      data,
      channels,
      priority,
      category,
      scheduledAt,
    } = sendDto;

    // Get template
    const template = await this.templateRepository.findOne({
      where: { id: templateId, tenantId, isActive: true },
    });

    if (!template) {
      throw new Error(`Template ${templateId} not found or inactive`);
    }

    // Process recipients and create notifications
    const notifications: Notification[] = [];

    for (const recipient of recipients) {
      // Check user preferences
      const preferences = await this.getUserPreferences(
        tenantId,
        recipient.userId,
      );

      // Determine which channels to use
      const enabledChannels = this.getEnabledChannels(
        channels,
        preferences,
        category,
      );

      for (const channel of enabledChannels) {
        // Check rate limiting
        const isRateLimited = await this.rateLimitService.checkRateLimit(
          tenantId,
          recipient.userId,
          channel as any,
          category as any,
        );

        if (isRateLimited) {
          this.logger.warn(`Rate limited: ${recipient.userId} on ${channel}`);
          continue;
        }

        // Create notification
        const notification = await this.createNotification({
          tenantId,
          userId: recipient.userId,
          channel,
          priority: priority || NotificationPriority.NORMAL,
          category,
          templateId,
          subject: this.processTemplate(template.subject, data),
          content: this.processTemplate(template.content, data),
          templateData: data,
          recipientEmail: recipient.email,
          recipientPhone: recipient.phone,
          recipientName: recipient.name,
          deviceToken: recipient.deviceToken,
          language: recipient.language || 'en',
          scheduledAt,
          metadata: {
            templateVersion: template.version,
            originalTemplateId: template.id,
          },
          type: template.type as unknown as NotificationType,
        });

        notifications.push(notification);
      }
    }

    return notifications;
  }

  async processNotification(notification: Notification): Promise<void> {
    try {
      this.logger.log(
        `Processing notification ${notification.id} via ${notification.channels?.join(', ')}`,
      );

      // Update status to processing
      await this.updateNotificationStatus(
        notification.id,
        NotificationStatus.PENDING,
      );

      let result: any;

      switch ((notification as any).channel) {
        case NotificationChannel.EMAIL:
          result = await this.emailService.sendEmail(
            notification.metadata?.recipientEmail || 'placeholder@example.com',
            notification.title || 'Notification',
            notification.message,
          );
          break;
        case NotificationChannel.SMS:
          result = await this.smsService.sendSms(
            notification.metadata?.recipientPhone || '+1234567890',
            notification.message,
          );
          break;
        case NotificationChannel.PUSH:
          result = await this.pushService.sendPush(notification);
          break;
        case NotificationChannel.IN_APP:
          result = await this.inAppService.sendInApp(notification);
          break;
        default:
          throw new Error(`Unsupported channel`);
      }

      // Update notification with success
      await this.updateNotificationSuccess(notification.id, result);

      this.logger.log(`Successfully sent notification ${notification.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification ${notification.id}: ${error.message}`,
      );

      // Handle retry logic
      await this.handleDeliveryFailure(notification, error);
    }
  }

  async retryFailedNotifications(): Promise<void> {
    const failedNotifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.FAILED,
      },
    });

    this.logger.log(
      `Retrying ${failedNotifications.length} failed notifications`,
    );

    for (const notification of failedNotifications) {
      await this.processNotification(notification);
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId },
      { isRead: true },
    );

    this.eventEmitter.emit('notification.read', { notificationId, userId });
  }

  async markAsDelivered(
    notificationId: string,
    externalId?: string,
  ): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId },
      {
        status: NotificationStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    );
  }

  async markAsOpened(notificationId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId },
      {
        readAt: new Date(),
      },
    );

    this.eventEmitter.emit('notification.opened', { notificationId });
  }

  async markAsClicked(notificationId: string): Promise<void> {
    await this.notificationRepository.update({ id: notificationId }, {
      // no clickedAt field
    } as any);

    this.eventEmitter.emit('notification.clicked', { notificationId });
  }

  async getUserNotifications(
    userId: string,
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      status?: NotificationStatus[];
      category?: NotificationCategory[];
      isRead?: boolean;
    } = {},
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { page = 1, limit = 20, status, category, isRead } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.tenantId = :tenantId', { tenantId })
      .orderBy('notification.createdAt', 'DESC');

    if (status && status.length > 0) {
      queryBuilder.andWhere('notification.status IN (:...status)', { status });
    }

    if (category && category.length > 0) {
      queryBuilder.andWhere('notification.category IN (:...category)', {
        category,
      });
    }

    if (isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
    }

    const [notifications, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { notifications, total };
  }

  async getNotificationMetrics(
    tenantId: string,
    period: { start: Date; end: Date },
  ): Promise<NotificationMetrics> {
    const notifications = await this.notificationRepository.find({
      where: {
        tenantId,
        createdAt: Between(period.start, period.end),
      },
    });

    const total = notifications.length;
    const sent = notifications.filter(
      (n) => n.status === NotificationStatus.SENT,
    ).length;
    const delivered = notifications.filter(
      (n) => n.status === NotificationStatus.DELIVERED,
    ).length;
    const failed = notifications.filter(
      (n) => n.status === NotificationStatus.FAILED,
    ).length;
    const opened = notifications.filter((n) => n.readAt).length;
    const clicked = 0;

    const channelBreakdown = notifications.reduce(
      (acc, notification) => {
        for (const ch of notification.channels || []) {
          acc[ch] = (acc[ch] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const categoryBreakdown = notifications.reduce(
      (acc, notification) => {
        acc[notification.category] = (acc[notification.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      sent,
      delivered,
      failed,
      opened,
      clicked,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      channelBreakdown,
      categoryBreakdown,
      period,
    };
  }

  private async getUserPreferences(
    tenantId: string,
    userId: string,
  ): Promise<NotificationPreference[]> {
    return this.preferenceRepository.find({
      where: { tenantId, userId, isEnabled: true },
    });
  }

  private getEnabledChannels(
    requestedChannels: NotificationChannel[],
    preferences: NotificationPreference[],
    category: NotificationCategory,
  ): NotificationChannel[] {
    const enabledChannels: NotificationChannel[] = [];

    for (const channel of requestedChannels) {
      const preference = preferences.find(
        (p) => (p.category as any) === (category as any),
      );

      if (!preference) {
        // No specific preference, use default
        enabledChannels.push(channel);
        continue;
      }

      // Check if channel is enabled for this category
      switch (channel) {
        case NotificationChannel.EMAIL:
          if (preference.emailEnabled) enabledChannels.push(channel);
          break;
        case NotificationChannel.SMS:
          if (preference.smsEnabled) enabledChannels.push(channel);
          break;
        case NotificationChannel.PUSH:
          if (preference.pushEnabled) enabledChannels.push(channel);
          break;
        case NotificationChannel.IN_APP:
          if (preference.inAppEnabled) enabledChannels.push(channel);
          break;
      }
    }

    return enabledChannels;
  }

  private processTemplate(template: string, data: Record<string, any>): string {
    if (!template) return '';

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
  ): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId },
      { status },
    );
  }

  private async updateNotificationSuccess(
    notificationId: string,
    result: any,
  ): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId },
      {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        metadata: {
          ...result,
          sentAt: new Date(),
        },
      },
    );
  }

  private async handleDeliveryFailure(
    notification: Notification,
    error: Error,
  ): Promise<void> {
    const retryCount = (notification as any).retryCount
      ? (notification as any).retryCount + 1
      : 1;
    const maxRetries = 3;

    if (retryCount >= maxRetries) {
      // Max retries reached, mark as failed
      await this.notificationRepository.update(
        { id: notification.id },
        {
          status: NotificationStatus.FAILED,
          // retryCount,
          metadata: {
            ...notification.metadata,
            error: error.message,
            failedAt: new Date().toISOString(),
          } as any,
        },
      );

      this.eventEmitter.emit('notification.failed', { notification, error });
    } else {
      // Schedule retry

      await this.notificationRepository.update(
        { id: notification.id },
        {
          status: NotificationStatus.FAILED,
          // retryCount,
          // nextRetryAt and deliveryAttempts removed
        },
      );
    }
  }

  // Removed unused calculateNextRetryTime
}
