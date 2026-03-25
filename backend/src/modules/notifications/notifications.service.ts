import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
  NotificationStatus,
  NotificationCategory,
} from '../../entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async createNotification(
    createNotificationDto: CreateNotificationDto,
    tenantId: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      notificationType: createNotificationDto.type,
      priority: createNotificationDto.priority || NotificationPriority.NORMAL,
      title: createNotificationDto.subject ?? '',
      message: createNotificationDto.content ?? '',
      recipientId: createNotificationDto.userId,
      tenantId: tenantId,
      channels: createNotificationDto.channel
        ? [createNotificationDto.channel]
        : [NotificationChannel.IN_APP],
      metadata: {
        ...(createNotificationDto.metadata ?? {}),
        recipientEmail: createNotificationDto.recipientEmail,
        recipientPhone: createNotificationDto.recipientPhone,
        recipientName: createNotificationDto.recipientName,
        deviceToken: createNotificationDto.deviceToken,
        language: createNotificationDto.language || 'en',
        templateId: createNotificationDto.templateId,
      },
      category: createNotificationDto.category,
      entityId: createNotificationDto.relatedEntityId,
      entityType: createNotificationDto.relatedEntityType as any,
      actionUrl: createNotificationDto.actionUrl,
      actionText: createNotificationDto.actionText,
    });
    const saved = await this.notificationRepository.save(notification);
    await this.deliverNotification(saved);
    
    // Emit real-time update to the recipient
    this.eventsGateway.emitNotification(saved.recipientId, saved);
    
    return saved;
  }

  async createBulkNotifications(
    notifications: CreateNotificationDto[],
    tenantId: string,
  ): Promise<Notification[]> {
    const fs = require('fs');
    const logPath = 'C:\\Users\\HP\\Desktop\\urutix\\debug.log';
    
    try {
      const createdNotifications: Notification[] = notifications.map(
        (notification) =>
          this.notificationRepository.create({
            notificationType: notification.type,
            priority: notification.priority || NotificationPriority.NORMAL,
            title: notification.subject ?? '',
            message: notification.content ?? '',
            recipientId: notification.userId,
            tenantId: tenantId,
            status: NotificationStatus.SENT,
            isRead: false,
            channels: notification.channel
              ? [notification.channel]
              : [NotificationChannel.IN_APP],
            metadata: {
              ...(notification.metadata ?? {}),
              recipientEmail: notification.recipientEmail,
              recipientPhone: notification.recipientPhone,
              recipientName: notification.recipientName,
              deviceToken: notification.deviceToken,
              language: notification.language || 'en',
              templateId: notification.templateId,
            },
            category: notification.category,
            entityId: notification.relatedEntityId,
            entityType: notification.relatedEntityType as any,
            actionUrl: notification.actionUrl,
            actionText: notification.actionText,
          }),
      );
      
      const savedNotifications =
        await this.notificationRepository.save(createdNotifications);
      
      fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] Saved ${savedNotifications.length} notifications for tenant ${tenantId}`);
      
      await Promise.all(
        savedNotifications.map((notification) => {
          // Emit real-time update to the recipient
          this.eventsGateway.emitNotification(notification.recipientId, notification);
          return this.deliverNotification(notification);
        }),
      );
      return savedNotifications;
    } catch (e) {
      fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] ERROR: ${e.stack}`);
      throw e;
    }
  }

  async findAllNotifications(
    tenantId: string,
    userId: string,
    filter?: NotificationFilterDto,
  ): Promise<Notification[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.tenantId = :tenantId', { tenantId })
      .andWhere('notification.recipientId = :userId', { userId });

    // Apply filters
    if (filter) {
      if (filter.type) {
        query.andWhere('notification.notificationType = :type', {
          type: filter.type,
        });
      }

      if (filter.priority) {
        query.andWhere('notification.priority = :priority', {
          priority: filter.priority,
        });
      }

      if (filter.channel) {
        query.andWhere('notification.channels @> :channels', {
          channels: [filter.channel],
        });
      }

      if (filter.isRead !== undefined) {
        query.andWhere('notification.isRead = :isRead', {
          isRead: filter.isRead,
        });
      }

      if (filter.isArchived !== undefined) {
        query.andWhere('notification.isArchived = :isArchived', {
          isArchived: filter.isArchived,
        });
      }

      if (filter.category) {
        query.andWhere('notification.category = :category', {
          category: filter.category,
        });
      }

      if (filter.relatedEntityType) {
        query.andWhere('notification.relatedEntityType = :relatedEntityType', {
          relatedEntityType: filter.relatedEntityType,
        });
      }

      if (filter.search) {
        query.andWhere(
          '(notification.title ILIKE :search OR notification.message ILIKE :search)',
          { search: `%${filter.search}%` },
        );
      }

      query.limit(filter.limit || 20);
      query.offset(filter.offset || 0);
    }

    query.orderBy('notification.createdAt', 'DESC');

    return query.getMany();
  }

  async findOneNotification(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, tenantId, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async updateNotification(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    tenantId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.findOneNotification(id, tenantId, userId);

    // Handle read status
    if (updateNotificationDto.isRead && !notification.isRead) {
      notification.readAt = new Date();
    }

    // Handle archive status
    // archivedAt is not tracked; only toggle isArchived flag

    Object.assign(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async markAsRead(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<Notification> {
    return this.updateNotification(id, { isRead: true }, tenantId, userId);
  }

  async markAllAsRead(tenantId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { tenantId, recipientId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async archiveNotification(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<Notification> {
    return this.updateNotification(id, { isArchived: true }, tenantId, userId);
  }

  async deleteNotification(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const notification = await this.findOneNotification(id, tenantId, userId);
    await this.notificationRepository.remove(notification);
  }

  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        tenantId,
        recipientId: userId,
        isRead: false,
        isArchived: false,
      },
    });
  }

  async getNotificationStats(tenantId: string, userId: string): Promise<any> {
    const notifications = await this.findAllNotifications(tenantId, userId);

    const totalNotifications = notifications.length;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const archivedCount = notifications.filter((n) => n.isArchived).length;

    const notificationTypes = notifications.reduce(
      (acc, notification) => {
        acc[notification.notificationType] =
          (acc[notification.notificationType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const notificationPriorities = notifications.reduce(
      (acc, notification) => {
        acc[notification.priority] = (acc[notification.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const deliveryStats = notifications.reduce(
      (acc, notification) => {
        acc[notification.status] = (acc[notification.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalNotifications,
      unreadCount,
      archivedCount,
      readCount: totalNotifications - unreadCount,
      notificationTypes,
      notificationPriorities,
      deliveryStats,
    };
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    // Simulate delivery to different channels
    // In production, integrate with actual delivery services (Email, SMS, Push, etc.)

    for (const channel of notification.channels || []) {
      try {
        await this.deliverToChannel(notification, channel);

        // Update delivery status
        await this.notificationRepository.update(notification.id, {
          status: NotificationStatus.DELIVERED,
          deliveredAt: new Date(),
        });
      } catch (error) {
        console.error(
          `Failed to deliver notification ${notification.id} via ${channel}:`,
          error,
        );

        // Update failure status
        await this.notificationRepository.update(notification.id, {
          status: NotificationStatus.FAILED,
          metadata: {
            ...(notification.metadata || {}),
            failureReason: error.message,
          } as any,
        });
      }
    }
  }

  private async deliverToChannel(
    notification: Notification,
    channel: string,
  ): Promise<void> {
    // Simulate delivery delays
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));

    // Simulate delivery failures (10% failure rate for demo)
    if (Math.random() < 0.1) {
      throw new Error(`Delivery failed for channel ${channel}`);
    }

    // In production, implement actual delivery logic:
    // - Email: SendGrid, AWS SES, etc.
    // - SMS: Twilio, AWS SNS, etc.
    // - Push: Firebase, OneSignal, etc.
    // - Webhook: HTTP POST to configured endpoints
    // - In-app: WebSocket or Server-Sent Events
  }

  async createSystemNotification(
    type: NotificationType,
    title: string,
    message: string,
    recipientIds: string[],
    tenantId: string,
    metadata?: Record<string, any>,
  ): Promise<Notification[]> {
    const notifications = recipientIds.map((recipientId) => ({
      type,
      priority: NotificationPriority.NORMAL,
      subject: title,
      content: message,
      userId: recipientId,
      channel: NotificationChannel.IN_APP,
      metadata,
      category: NotificationCategory.SYSTEM,
      tenantId,
      templateId: 'system',
    }));
    return this.createBulkNotifications(notifications as any, tenantId);
  }

  async createTripNotification(
    tripId: string,
    type: NotificationType,
    title: string,
    message: string,
    recipientId: string,
    tenantId: string,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    return this.createNotification(
      {
        type,
        priority: NotificationPriority.HIGH,
        subject: title,
        content: message,
        userId: recipientId,
        relatedEntityId: tripId,
        relatedEntityType: 'trip',
        channel: NotificationChannel.IN_APP,
        metadata,
        category: NotificationCategory.TRIP_STATUS,
        actionUrl: `/trips/${tripId}`,
        actionText: 'View Trip',
        tenantId,
        templateId: 'trip',
      } as any,
      tenantId,
    );
  }

  async createPaymentNotification(
    paymentId: string,
    type: NotificationType,
    title: string,
    message: string,
    recipientId: string,
    tenantId: string,
    metadata?: Record<string, any>,
  ): Promise<Notification> {
    return this.createNotification(
      {
        type,
        priority: NotificationPriority.HIGH,
        subject: title,
        content: message,
        userId: recipientId,
        relatedEntityId: paymentId,
        relatedEntityType: 'payment',
        channel: NotificationChannel.IN_APP,
        metadata,
        category: NotificationCategory.FINANCIAL,
        actionUrl: `/payments/${paymentId}`,
        actionText: 'View Payment',
        tenantId,
        templateId: 'payment',
      } as any,
      tenantId,
    );
  }
}
