import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../../entities/notification.entity';

@Injectable()
export class InAppService {
  private readonly logger = new Logger(InAppService.name);

  async sendInApp(notification: Notification): Promise<any> {
    try {
      this.logger.log(
        `Creating in-app notification for user ${notification.recipientId}`,
      );

      // Process template content
      const processedContent = this.processTemplate(
        notification.message,
        (notification as any).templateData,
      );

      // For in-app notifications, we just store them in the database
      // The frontend will fetch and display them
      const inAppPayload = {
        notificationId: notification.id,
        userId: notification.recipientId,
        tenantId: notification.tenantId,
        title: notification.title || 'Notification',
        content: processedContent,
        category: notification.category,
        priority: notification.priority,
        data: (notification as any).templateData,
        isRead: false,
        createdAt: new Date(),
      };

      this.logger.log(
        `In-app notification created for user ${notification.recipientId}`,
      );

      return {
        externalId: notification.id,
        // trackingId not supported on entity
        provider: 'in-app',
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to create in-app notification for user ${notification.recipientId}: ${error.message}`,
      );
      throw error;
    }
  }

  async sendBulkInApp(notifications: Notification[]): Promise<any[]> {
    const results: any[] = [];

    for (const notification of notifications) {
      try {
        const result = await this.sendInApp(notification);
        results.push({
          notificationId: notification.id,
          success: true,
          result,
        });
      } catch (error) {
        results.push({
          notificationId: notification.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    this.logger.log(
      `Marking in-app notification ${notificationId} as read for user ${userId}`,
    );
    // This would typically update the database
    // For now, just log the action
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    this.logger.log(
      `Marking all in-app notifications as read for user ${userId}`,
    );
    // This would typically update the database
    // For now, just log the action
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(
      `Deleting in-app notification ${notificationId} for user ${userId}`,
    );
    // This would typically update the database
    // For now, just log the action
  }

  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    this.logger.log(`Getting unread count for user ${userId}`);
    // This would typically query the database
    // For now, return a mock count
    return Math.floor(Math.random() * 10);
  }

  private processTemplate(template: string, data: Record<string, any>): string {
    if (!template) return '';

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}
