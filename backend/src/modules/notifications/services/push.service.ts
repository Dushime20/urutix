import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Notification } from '../../../entities/notification.entity';
// import { PushProvider } from '../interfaces/push-provider.interface';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly pushProvider: PushProvider;

  constructor(private readonly configService: ConfigService) {
    this.pushProvider = this.initializePushProvider();
  }

  async sendPush(notification: Notification): Promise<any> {
    try {
      this.logger.log(
        `Sending push notification to ${notification.metadata?.deviceToken}`,
      );

      // Process template content
      const processedContent = this.processTemplate(
        notification.message,
        (notification as any).templateData,
      );

      // Prepare push payload
      const pushPayload = {
        to: notification.metadata?.deviceToken,
        title: notification.title || 'Notification',
        body: processedContent,
        data: {
          notificationId: notification.id,
          category: notification.category,
          priority: notification.priority,
          ...(notification as any).templateData,
        },
        options: {
          priority: this.mapPriority(notification.priority),
          badge: 1,
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
        // trackingId not supported on entity
      };

      // Send push notification
      const result = await this.pushProvider.send(pushPayload);

      this.logger.log(
        `Push notification sent successfully to ${notification.metadata?.deviceToken}`,
      );

      return {
        externalId: result.messageId,
        trackingId: result.trackingId,
        provider: this.pushProvider.getName(),
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to ${notification.metadata?.deviceToken}: ${error.message}`,
      );
      throw error;
    }
  }

  async sendBulkPush(notifications: Notification[]): Promise<any[]> {
    const results: any[] = [];

    for (const notification of notifications) {
      try {
        const result = await this.sendPush(notification);
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

  async trackPushDelivery(trackingId: string, status: string): Promise<void> {
    this.logger.log(`Push delivery status: ${trackingId} -> ${status}`);
    // Emit event for tracking
    // this.eventEmitter.emit('push.delivered', { trackingId, status });
  }

  async trackPushOpen(trackingId: string): Promise<void> {
    this.logger.log(`Push notification opened: ${trackingId}`);
    // Emit event for tracking
    // this.eventEmitter.emit('push.opened', { trackingId });
  }

  private processTemplate(template: string, data: Record<string, any>): string {
    if (!template) return '';

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private mapPriority(priority: string): string {
    switch (priority) {
      case 'emergency':
      case 'urgent':
        return 'high';
      case 'high':
        return 'high';
      case 'normal':
        return 'normal';
      case 'low':
        return 'normal';
      default:
        return 'normal';
    }
  }

  private initializePushProvider(): PushProvider {
    const provider =
      this.configService.get<string>('PUSH_PROVIDER') || 'firebase';

    switch (provider.toLowerCase()) {
      case 'firebase':
        return new FirebaseProvider(this.configService);
      case 'apns':
        return new APNSProvider(this.configService);
      case 'web-push':
        return new WebPushProvider(this.configService);
      default:
        return new MockPushProvider();
    }
  }
}

// Push Provider Interface
export interface PushProvider {
  getName(): string;
  send(payload: any): Promise<any>;
}

// Push Provider Implementations
class FirebaseProvider implements PushProvider {
  private readonly logger = new Logger(FirebaseProvider.name);

  constructor(private configService: ConfigService) {}

  getName(): string {
    return 'firebase';
  }

  async send(payload: any): Promise<any> {
    this.logger.log(`Firebase: Sending push to ${payload.to}`);
    this.logger.log(`Title: ${payload.title}`);
    this.logger.log(`Body: ${payload.body}`);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 150));

    return {
      messageId: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trackingId: `track_${Date.now()}`,
    };
  }
}

class APNSProvider implements PushProvider {
  private readonly logger = new Logger(APNSProvider.name);

  constructor(private configService: ConfigService) {}

  getName(): string {
    return 'apns';
  }

  async send(payload: any): Promise<any> {
    this.logger.log(`APNS: Sending push to ${payload.to}`);
    this.logger.log(`Title: ${payload.title}`);
    this.logger.log(`Body: ${payload.body}`);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 120));

    return {
      messageId: `ap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trackingId: `track_${Date.now()}`,
    };
  }
}

class WebPushProvider implements PushProvider {
  private readonly logger = new Logger(WebPushProvider.name);

  constructor(private configService: ConfigService) {}

  getName(): string {
    return 'web-push';
  }

  async send(payload: any): Promise<any> {
    this.logger.log(`Web Push: Sending push to ${payload.to}`);
    this.logger.log(`Title: ${payload.title}`);
    this.logger.log(`Body: ${payload.body}`);

    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      messageId: `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trackingId: `track_${Date.now()}`,
    };
  }
}

class MockPushProvider implements PushProvider {
  private readonly logger = new Logger(MockPushProvider.name);

  getName(): string {
    return 'mock';
  }

  async send(payload: any): Promise<any> {
    this.logger.log(`Mock: Sending push to ${payload.to}`);
    this.logger.log(`Title: ${payload.title}`);
    this.logger.log(`Body: ${payload.body}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 80));

    return {
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trackingId: `track_${Date.now()}`,
    };
  }
}
