import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, IsNull, Not } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationCategory,
  EntityType,
  NotificationChannel,
} from '../../entities/notification.entity';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationFilterDto,
  NotificationSearchDto,
} from './dto/notification.dto';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { PushNotificationService } from './services/push-notification.service';
import { WebhookService } from './services/webhook.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private emailService: EmailService,
    private smsService: SmsService,
    private pushNotificationService: PushNotificationService,
    private webhookService: WebhookService,
  ) {}

  /**
   * Create a new notification
   */
  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    // Create notification
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      status: NotificationStatus.PENDING,
      userPreferences: {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
      },
      analytics: {
        openCount: 0,
        clickCount: 0,
      },
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Send notification through specified channels
    await this.sendNotification(savedNotification);

    return savedNotification;
  }

  /**
   * Send smart notification based on user behavior and context
   */
  async sendSmartNotification(
    userId: string,
    type: string,
    data: any,
    tenantId: string,
  ): Promise<Notification> {
    // Analyze user behavior and context to determine notification strategy
    const userBehavior = await this.analyzeUserBehavior(userId, tenantId);
    const notificationStrategy = this.determineNotificationStrategy(
      type,
      data,
      userBehavior,
    );

    // Create smart notification
    const smartNotification = this.notificationRepository.create({
      recipientId: userId,
      tenantId,
      title: notificationStrategy.title,
      message: notificationStrategy.message,
      shortMessage: notificationStrategy.shortMessage,
      notificationType: notificationStrategy.type,
      category: notificationStrategy.category,
      priority: notificationStrategy.priority,
      channels: notificationStrategy.channels,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: {
        ...data,
        smartFeatures: {
          userBehavior: userBehavior,
          strategy: notificationStrategy.name,
          context: data.context,
        },
      },
      status: NotificationStatus.PENDING,
      userPreferences: {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
      },
      analytics: {
        openCount: 0,
        clickCount: 0,
      },
    });

    const savedNotification =
      await this.notificationRepository.save(smartNotification);

    // Send through optimal channels
    await this.sendNotification(savedNotification);

    return savedNotification;
  }

  /**
   * Analyze user behavior for smart notifications
   */
  private async analyzeUserBehavior(
    userId: string,
    tenantId: string,
  ): Promise<any> {
    const userNotifications = await this.notificationRepository.find({
      where: { recipientId: userId, tenantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const behavior = {
      preferredChannels: this.getPreferredChannels(userNotifications),
      responseTime: this.calculateResponseTime(userNotifications),
      preferredCategories: this.getPreferredCategories(userNotifications),
      activeHours: this.getActiveHours(userNotifications),
      notificationVolume: userNotifications.length,
      lastActivity: userNotifications[0]?.createdAt || new Date(),
    };

    return behavior;
  }

  /**
   * Determine optimal notification strategy
   */
  private determineNotificationStrategy(
    type: string,
    data: any,
    userBehavior: any,
  ): any {
    const strategies = {
      price_drop: {
        name: 'Price Drop Alert',
        title: '🚨 Price Drop Alert!',
        message: `Great news! The price for your cargo ${data.cargoTitle} has dropped by ${data.priceReduction}%. This could save you money!`,
        shortMessage: `Price drop: ${data.cargoTitle}`,
        type: NotificationType.TRIP_UPDATE,
        category: NotificationCategory.BUSINESS,
        priority: NotificationPriority.HIGH,
        channels: this.optimizeChannels(
          userBehavior.preferredChannels,
          'price_drop',
        ),
      },
      route_optimization: {
        name: 'Route Optimization',
        title: '🛣️ Better Route Available',
        message: `We found a faster route for your cargo ${data.cargoTitle}. Save ${data.timeSaved} hours and ${data.fuelSaved}% fuel!`,
        shortMessage: `Better route: ${data.cargoTitle}`,
        type: NotificationType.TRIP_ROUTE_CHANGE,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.NORMAL,
        channels: this.optimizeChannels(
          userBehavior.preferredChannels,
          'route_optimization',
        ),
      },
      demand_spike: {
        name: 'Demand Spike',
        title: '📈 High Demand Alert',
        message: `High demand detected on route ${data.route}. Consider increasing your price by ${data.recommendedIncrease}% for better profitability.`,
        shortMessage: `High demand: ${data.route}`,
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.BUSINESS,
        priority: NotificationPriority.HIGH,
        channels: this.optimizeChannels(
          userBehavior.preferredChannels,
          'demand_spike',
        ),
      },
      delivery_delay: {
        name: 'Delivery Delay Warning',
        title: '⚠️ Delivery Delay Warning',
        message: `Your cargo ${data.cargoTitle} is experiencing delays. Estimated new delivery time: ${data.newDeliveryTime}.`,
        shortMessage: `Delay: ${data.cargoTitle}`,
        type: NotificationType.TRIP_DELAY,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        channels: this.optimizeChannels(
          userBehavior.preferredChannels,
          'delivery_delay',
        ),
      },
      market_opportunity: {
        name: 'Market Opportunity',
        title: '💡 Market Opportunity',
        message: `New high-value cargo available on route ${data.route}. Estimated profit: $${data.estimatedProfit}. Act fast!`,
        shortMessage: `Opportunity: ${data.route}`,
        type: NotificationType.SYSTEM_UPDATE,
        category: NotificationCategory.BUSINESS,
        priority: NotificationPriority.NORMAL,
        channels: this.optimizeChannels(
          userBehavior.preferredChannels,
          'market_opportunity',
        ),
      },
    };

    return strategies[type] || strategies['market_opportunity'];
  }

  /**
   * Optimize notification channels based on user behavior
   */
  private optimizeChannels(
    preferredChannels: string[],
    notificationType: string,
  ): NotificationChannel[] {
    const channelPriorities = {
      price_drop: [
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
        NotificationChannel.SMS,
      ],
      route_optimization: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
      demand_spike: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
      delivery_delay: [
        NotificationChannel.PUSH,
        NotificationChannel.SMS,
        NotificationChannel.EMAIL,
      ],
      market_opportunity: [NotificationChannel.PUSH, NotificationChannel.EMAIL],
    };

    const typeChannels = channelPriorities[notificationType] || [
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
    ];

    // Filter based on user preferences
    return typeChannels.filter((channel) =>
      preferredChannels.includes(channel),
    );
  }

  /**
   * Get user's preferred notification channels
   */
  private getPreferredChannels(
    notifications: Notification[],
  ): NotificationChannel[] {
    const channelCounts = {};
    notifications.forEach((notification) => {
      notification.channels.forEach((channel) => {
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      });
    });

    return Object.entries(channelCounts as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .map(([channel]) => channel as NotificationChannel);
  }

  /**
   * Calculate user's average response time to notifications
   */
  private calculateResponseTime(notifications: Notification[]): number {
    const respondedNotifications = notifications.filter(
      (n) => (n.analytics?.openCount || 0) > 0,
    );
    if (respondedNotifications.length === 0) return 0;

    const totalResponseTime = respondedNotifications.reduce(
      (sum, notification) => {
        const openedAt =
          (notification.analytics as any)?.openedAt ||
          (notification.analytics as any)?.lastOpenedAt;
        const responseTime =
          new Date(openedAt || notification.updatedAt).getTime() -
          new Date(notification.createdAt).getTime();
        return sum + responseTime;
      },
      0,
    );

    return totalResponseTime / respondedNotifications.length; // in milliseconds
  }

  /**
   * Get user's preferred notification categories
   */
  private getPreferredCategories(notifications: Notification[]): string[] {
    const categoryCounts = {};
    notifications.forEach((notification) => {
      categoryCounts[notification.category] =
        (categoryCounts[notification.category] || 0) + 1;
    });

    return Object.entries(categoryCounts as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category);
  }

  /**
   * Get user's active hours based on notification interactions
   */
  private getActiveHours(notifications: Notification[]): number[] {
    const interactionHours = notifications
      .map(
        (n) =>
          (n.analytics as any)?.openedAt || (n.analytics as any)?.lastOpenedAt,
      )
      .filter(Boolean)
      .map((d: Date | string) => new Date(d).getHours());

    const hourCounts = {};
    interactionHours.forEach((hour) => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([hour]) => parseInt(hour));
  }

  /**
   * Get notifications with filtering and pagination
   */
  async getNotifications(
    filterDto: NotificationFilterDto,
    tenantId: string,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.tenantId = :tenantId', { tenantId });

    // Apply filters
    if (filterDto.recipientId) {
      queryBuilder.andWhere('notification.recipientId = :recipientId', {
        recipientId: filterDto.recipientId,
      });
    }

    if (filterDto.entityType) {
      queryBuilder.andWhere('notification.entityType = :entityType', {
        entityType: filterDto.entityType,
      });
    }

    if (filterDto.entityId) {
      queryBuilder.andWhere('notification.entityId = :entityId', {
        entityId: filterDto.entityId,
      });
    }

    if (filterDto.notificationType) {
      queryBuilder.andWhere(
        'notification.notificationType = :notificationType',
        { notificationType: filterDto.notificationType },
      );
    }

    if (filterDto.category) {
      queryBuilder.andWhere('notification.category = :category', {
        category: filterDto.category,
      });
    }

    if (filterDto.status) {
      queryBuilder.andWhere('notification.status = :status', {
        status: filterDto.status,
      });
    }

    if (filterDto.priority) {
      queryBuilder.andWhere('notification.priority = :priority', {
        priority: filterDto.priority,
      });
    }

    if (filterDto.isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', {
        isRead: filterDto.isRead,
      });
    }

    if (filterDto.requiresAction !== undefined) {
      queryBuilder.andWhere('notification.requiresAction = :requiresAction', {
        requiresAction: filterDto.requiresAction,
      });
    }

    if (filterDto.channels && filterDto.channels.length > 0) {
      queryBuilder.andWhere('notification.channels @> :channels', {
        channels: filterDto.channels,
      });
    }

    if (filterDto.search) {
      queryBuilder.andWhere(
        '(notification.title ILIKE :search OR notification.message ILIKE :search OR notification.shortMessage ILIKE :search)',
        { search: `%${filterDto.search}%` },
      );
    }

    // Apply date filters
    if (filterDto.createdAfter) {
      queryBuilder.andWhere('notification.createdAt >= :createdAfter', {
        createdAfter: filterDto.createdAfter,
      });
    }

    if (filterDto.createdBefore) {
      queryBuilder.andWhere('notification.createdAt <= :createdBefore', {
        createdBefore: filterDto.createdBefore,
      });
    }

    if (filterDto.scheduledAfter) {
      queryBuilder.andWhere('notification.scheduledAt >= :scheduledAfter', {
        scheduledAfter: filterDto.scheduledAfter,
      });
    }

    if (filterDto.scheduledBefore) {
      queryBuilder.andWhere('notification.scheduledAt <= :scheduledBefore', {
        scheduledBefore: filterDto.scheduledBefore,
      });
    }

    // Apply sorting
    const sortField = filterDto.sortBy || 'createdAt';
    const sortOrder = filterDto.sortOrder || 'DESC';
    queryBuilder.orderBy(`notification.${sortField}`, sortOrder);

    // Apply pagination
    const page = filterDto.page || 1;
    const limit = Math.min(filterDto.limit || 20, 100);
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    // Execute query
    const [notifications, total] = await queryBuilder.getManyAndCount();

    return { notifications, total };
  }

  /**
   * Search notifications across all fields
   */
  async searchNotifications(
    searchDto: NotificationSearchDto,
    tenantId: string,
  ): Promise<Notification[]> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.tenantId = :tenantId', { tenantId });

    if (searchDto.query) {
      queryBuilder.andWhere(
        `(
          notification.title ILIKE :query OR 
          notification.message ILIKE :query OR 
          notification.shortMessage ILIKE :query OR
          notification.tags::text ILIKE :query OR
          notification.metadata::text ILIKE :query
        )`,
        { query: `%${searchDto.query}%` },
      );
    }

    if (searchDto.entityTypes && searchDto.entityTypes.length > 0) {
      queryBuilder.andWhere('notification.entityType IN (:...entityTypes)', {
        entityTypes: searchDto.entityTypes,
      });
    }

    if (searchDto.categories && searchDto.categories.length > 0) {
      queryBuilder.andWhere('notification.category IN (:...categories)', {
        categories: searchDto.categories,
      });
    }

    if (searchDto.statuses && searchDto.statuses.length > 0) {
      queryBuilder.andWhere('notification.status IN (:...statuses)', {
        statuses: searchDto.statuses,
      });
    }

    if (searchDto.priorities && searchDto.priorities.length > 0) {
      queryBuilder.andWhere('notification.priority IN (:...priorities)', {
        priorities: searchDto.priorities,
      });
    }

    // Apply relevance scoring
    queryBuilder.addSelect(
      `(
        CASE 
          WHEN notification.title ILIKE :exactQuery THEN 100
          WHEN notification.title ILIKE :query THEN 80
          WHEN notification.message ILIKE :query THEN 60
          WHEN notification.shortMessage ILIKE :query THEN 40
          WHEN notification.tags @> :tagArray THEN 30
          ELSE 10
        END
      )`,
      'relevance_score',
    );

    queryBuilder.setParameter('exactQuery', searchDto.query);
    queryBuilder.setParameter('query', `%${searchDto.query}%`);
    queryBuilder.setParameter(
      'tagArray',
      searchDto.query ? [searchDto.query] : [],
    );

    queryBuilder.orderBy('relevance_score', 'DESC');
    queryBuilder.addOrderBy('notification.createdAt', 'DESC');

    if (searchDto.limit) {
      queryBuilder.limit(Math.min(searchDto.limit, 100));
    }

    return queryBuilder.getMany();
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(
    id: string,
    tenantId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, tenantId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  /**
   * Update notification
   */
  async updateNotification(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    updatedBy: string,
    tenantId: string,
  ): Promise<Notification> {
    const notification = await this.getNotificationById(id, tenantId);

    // Update fields
    Object.assign(notification, updateNotificationDto);

    // Update notification

    notification.updatedAt = new Date();

    return this.notificationRepository.save(notification);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<Notification> {
    const notification = await this.getNotificationById(id, tenantId);

    if (notification.recipientId !== userId) {
      throw new BadRequestException(
        'You can only mark your own notifications as read',
      );
    }

    notification.isRead = true;
    notification.readAt = new Date();

    // Update analytics
    if (!notification.analytics) {
      notification.analytics = { openCount: 0, clickCount: 0 };
    }
    notification.analytics.openCount += 1;
    notification.analytics.lastOpenedAt = new Date();

    notification.updatedAt = new Date();

    return this.notificationRepository.save(notification);
  }

  /**
   * Mark notification as delivered
   */
  async markAsDelivered(
    id: string,
    channel: NotificationChannel,
    tenantId: string,
  ): Promise<Notification> {
    const notification = await this.getNotificationById(id, tenantId);

    notification.status = NotificationStatus.DELIVERED;
    notification.deliveredAt = new Date();

    // Update delivery attempts
    if (!notification.deliveryAttempts) {
      notification.deliveryAttempts = {};
    }

    if (!notification.deliveryAttempts[channel.toLowerCase()]) {
      notification.deliveryAttempts[channel.toLowerCase()] = [];
    }

    notification.deliveryAttempts[channel.toLowerCase()].push({
      attempt: notification.deliveryAttempts[channel.toLowerCase()].length + 1,
      timestamp: new Date(),
      status: 'DELIVERED',
    });

    notification.updatedAt = new Date();

    return this.notificationRepository.save(notification);
  }

  /**
   * Mark notification as failed
   */
  async markAsFailed(
    id: string,
    channel: NotificationChannel,
    error: string,
    tenantId: string,
  ): Promise<Notification> {
    const notification = await this.getNotificationById(id, tenantId);

    notification.status = NotificationStatus.FAILED;

    // Update delivery attempts
    if (!notification.deliveryAttempts) {
      notification.deliveryAttempts = {};
    }

    if (!notification.deliveryAttempts[channel.toLowerCase()]) {
      notification.deliveryAttempts[channel.toLowerCase()] = [];
    }

    notification.deliveryAttempts[channel.toLowerCase()].push({
      attempt: notification.deliveryAttempts[channel.toLowerCase()].length + 1,
      timestamp: new Date(),
      status: 'FAILED',
      error,
    });

    notification.updatedAt = new Date();

    return this.notificationRepository.save(notification);
  }

  /**
   * Get notifications by recipient
   */
  async getNotificationsByRecipient(
    recipientId: string,
    tenantId: string,
    limit: number = 50,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId, tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(recipientId: string, tenantId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId, tenantId, isRead: false },
    });
  }

  /**
   * Get notifications by entity
   */
  async getNotificationsByEntity(
    entityType: EntityType,
    entityId: string,
    tenantId: string,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { entityType, entityId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get scheduled notifications
   */
  async getScheduledNotifications(tenantId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        tenantId,
        scheduledAt: Not(IsNull()),
        status: NotificationStatus.PENDING,
      },
      order: { scheduledAt: 'ASC' },
    });
  }

  /**
   * Get expired notifications
   */
  async getExpiredNotifications(tenantId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        tenantId,
        expiresAt: Between(new Date(0), new Date()),
      },
      order: { expiresAt: 'ASC' },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    id: string,
    deletedBy: string,
    tenantId: string,
  ): Promise<void> {
    const notification = await this.getNotificationById(id, tenantId);

    // Soft delete
    await this.notificationRepository.softDelete(id);

    // Update notification

    notification.updatedAt = new Date();
    await this.notificationRepository.save(notification);
  }

  /**
   * Bulk mark notifications as read
   */
  async bulkMarkAsRead(
    notificationIds: string[],
    userId: string,
    tenantId: string,
  ): Promise<Notification[]> {
    const notifications = await this.notificationRepository.find({
      where: { id: In(notificationIds), tenantId, recipientId: userId },
    });

    const updatedNotifications = notifications.map((notification) => {
      notification.isRead = true;
      notification.readAt = new Date();

      if (!notification.analytics) {
        notification.analytics = { openCount: 0, clickCount: 0 };
      }
      notification.analytics.openCount += 1;
      notification.analytics.lastOpenedAt = new Date();

      notification.updatedAt = new Date();
      return notification;
    });

    return this.notificationRepository.save(updatedNotifications);
  }

  /**
   * Send notification through specified channels
   */
  private async sendNotification(notification: Notification): Promise<void> {
    const promises: Promise<any>[] = [];

    // Check if notification should be sent now
    if (!notification.shouldSend) {
      return;
    }

    // Send through each channel
    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case NotificationChannel.EMAIL:
            promises.push(this.sendEmailNotification(notification));
            break;
          case NotificationChannel.SMS:
            promises.push(this.sendSmsNotification(notification));
            break;
          case NotificationChannel.PUSH:
            promises.push(this.sendPushNotification(notification));
            break;
          case NotificationChannel.WEBHOOK:
            promises.push(this.sendWebhookNotification(notification));
            break;
          case NotificationChannel.IN_APP:
            // In-app notifications are already stored in the database
            break;
          default:
            console.warn(`Unknown notification channel: ${channel}`);
        }
      } catch (error) {
        console.error(`Failed to send notification through ${channel}:`, error);
        await this.markAsFailed(
          notification.id,
          channel,
          error.message,
          notification.tenantId,
        );
      }
    }

    // Wait for all delivery attempts
    await Promise.allSettled(promises);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    notification: Notification,
  ): Promise<void> {
    try {
      // TODO: Get recipient email from user context or notification metadata
      const recipientEmail =
        notification.metadata?.recipientEmail || 'placeholder@example.com';
      await this.emailService.sendEmail(
        recipientEmail,
        notification.title || 'Notification',
        notification.message,
      );
      await this.markAsDelivered(
        notification.id,
        NotificationChannel.EMAIL,
        notification.tenantId,
      );
    } catch (error) {
      await this.markAsFailed(
        notification.id,
        NotificationChannel.EMAIL,
        error.message,
        notification.tenantId,
      );
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(notification: Notification): Promise<void> {
    try {
      // TODO: Get recipient phone from user context or notification metadata
      const recipientPhone =
        notification.metadata?.recipientPhone || '+1234567890';
      await this.smsService.sendSms(recipientPhone, notification.message);
      await this.markAsDelivered(
        notification.id,
        NotificationChannel.SMS,
        notification.tenantId,
      );
    } catch (error) {
      await this.markAsFailed(
        notification.id,
        NotificationChannel.SMS,
        error.message,
        notification.tenantId,
      );
      throw error;
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    notification: Notification,
  ): Promise<void> {
    try {
      // TODO: Get device token from user context or notification metadata
      const deviceToken =
        notification.metadata?.deviceToken || 'placeholder-device-token';
      await this.pushNotificationService.sendPushNotification(
        deviceToken,
        notification.title || 'Notification',
        notification.message,
      );
      await this.markAsDelivered(
        notification.id,
        NotificationChannel.PUSH,
        notification.tenantId,
      );
    } catch (error) {
      await this.markAsFailed(
        notification.id,
        NotificationChannel.PUSH,
        error.message,
        notification.tenantId,
      );
      throw error;
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    notification: Notification,
  ): Promise<void> {
    try {
      await this.webhookService.sendWebhook(
        notification.actionUrl,
        notification.message,
      );
      await this.markAsDelivered(
        notification.id,
        NotificationChannel.WEBHOOK,
        notification.tenantId,
      );
    } catch (error) {
      await this.markAsFailed(
        notification.id,
        NotificationChannel.WEBHOOK,
        error.message,
        notification.tenantId,
      );
      throw error;
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    const scheduledNotifications =
      await this.getScheduledNotifications('system'); // Use system tenant for global processing

    for (const notification of scheduledNotifications) {
      if (notification.scheduledAt && notification.scheduledAt <= new Date()) {
        // Update status to pending and send
        notification.status = NotificationStatus.PENDING;
        notification.scheduledAt = null;
        await this.notificationRepository.save(notification);

        // Send the notification
        await this.sendNotification(notification);
      }
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    const expiredNotifications = await this.getExpiredNotifications('system'); // Use system tenant for global processing

    for (const notification of expiredNotifications) {
      notification.status = NotificationStatus.CANCELLED;
      await this.notificationRepository.save(notification);
    }
  }
}
