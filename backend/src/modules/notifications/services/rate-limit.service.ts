import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationCategory,
} from '../entities/notification-preference.entity';

interface RateLimitRule {
  channel: NotificationChannel;
  category: NotificationCategory;
  maxPerHour: number;
  maxPerDay: number;
  maxPerMinute?: number;
}

interface RateLimitKey {
  tenantId: string;
  userId: string;
  channel: NotificationChannel;
  category: NotificationCategory;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly rateLimitRules: RateLimitRule[] = [
    // Email limits
    {
      channel: NotificationChannel.EMAIL,
      category: NotificationCategory.TRIP_STATUS,
      maxPerHour: 10,
      maxPerDay: 50,
    },
    {
      channel: NotificationChannel.EMAIL,
      category: NotificationCategory.PAYMENT,
      maxPerHour: 5,
      maxPerDay: 20,
    },
    {
      channel: NotificationChannel.EMAIL,
      category: NotificationCategory.SAFETY,
      maxPerHour: 20,
      maxPerDay: 100,
    },
    {
      channel: NotificationChannel.EMAIL,
      category: NotificationCategory.PERFORMANCE,
      maxPerHour: 2,
      maxPerDay: 10,
    },
    {
      channel: NotificationChannel.EMAIL,
      category: NotificationCategory.MAINTENANCE,
      maxPerHour: 3,
      maxPerDay: 15,
    },
    {
      channel: NotificationChannel.EMAIL,
      category: NotificationCategory.SYSTEM,
      maxPerHour: 5,
      maxPerDay: 25,
    },
    {
      channel: NotificationChannel.EMAIL,
      category: NotificationCategory.MARKETING,
      maxPerHour: 1,
      maxPerDay: 5,
    },

    // SMS limits
    {
      channel: NotificationChannel.SMS,
      category: NotificationCategory.TRIP_STATUS,
      maxPerHour: 5,
      maxPerDay: 20,
    },
    {
      channel: NotificationChannel.SMS,
      category: NotificationCategory.PAYMENT,
      maxPerHour: 3,
      maxPerDay: 10,
    },
    {
      channel: NotificationChannel.SMS,
      category: NotificationCategory.SAFETY,
      maxPerHour: 10,
      maxPerDay: 50,
    },
    {
      channel: NotificationChannel.SMS,
      category: NotificationCategory.PERFORMANCE,
      maxPerHour: 1,
      maxPerDay: 5,
    },
    {
      channel: NotificationChannel.SMS,
      category: NotificationCategory.MAINTENANCE,
      maxPerHour: 2,
      maxPerDay: 8,
    },
    {
      channel: NotificationChannel.SMS,
      category: NotificationCategory.SYSTEM,
      maxPerHour: 3,
      maxPerDay: 12,
    },
    {
      channel: NotificationChannel.SMS,
      category: NotificationCategory.MARKETING,
      maxPerHour: 1,
      maxPerDay: 3,
    },

    // Push limits
    {
      channel: NotificationChannel.PUSH,
      category: NotificationCategory.TRIP_STATUS,
      maxPerHour: 15,
      maxPerDay: 100,
    },
    {
      channel: NotificationChannel.PUSH,
      category: NotificationCategory.PAYMENT,
      maxPerHour: 8,
      maxPerDay: 30,
    },
    {
      channel: NotificationChannel.PUSH,
      category: NotificationCategory.SAFETY,
      maxPerHour: 30,
      maxPerDay: 200,
    },
    {
      channel: NotificationChannel.PUSH,
      category: NotificationCategory.PERFORMANCE,
      maxPerHour: 5,
      maxPerDay: 20,
    },
    {
      channel: NotificationChannel.PUSH,
      category: NotificationCategory.MAINTENANCE,
      maxPerHour: 5,
      maxPerDay: 25,
    },
    {
      channel: NotificationChannel.PUSH,
      category: NotificationCategory.SYSTEM,
      maxPerHour: 10,
      maxPerDay: 50,
    },
    {
      channel: NotificationChannel.PUSH,
      category: NotificationCategory.MARKETING,
      maxPerHour: 3,
      maxPerDay: 10,
    },

    // In-app limits
    {
      channel: NotificationChannel.IN_APP,
      category: NotificationCategory.TRIP_STATUS,
      maxPerHour: 20,
      maxPerDay: 150,
    },
    {
      channel: NotificationChannel.IN_APP,
      category: NotificationCategory.PAYMENT,
      maxPerHour: 10,
      maxPerDay: 50,
    },
    {
      channel: NotificationChannel.IN_APP,
      category: NotificationCategory.SAFETY,
      maxPerHour: 50,
      maxPerDay: 300,
    },
    {
      channel: NotificationChannel.IN_APP,
      category: NotificationCategory.PERFORMANCE,
      maxPerHour: 10,
      maxPerDay: 40,
    },
    {
      channel: NotificationChannel.IN_APP,
      category: NotificationCategory.MAINTENANCE,
      maxPerHour: 8,
      maxPerDay: 30,
    },
    {
      channel: NotificationChannel.IN_APP,
      category: NotificationCategory.SYSTEM,
      maxPerHour: 15,
      maxPerDay: 75,
    },
    {
      channel: NotificationChannel.IN_APP,
      category: NotificationCategory.MARKETING,
      maxPerHour: 5,
      maxPerDay: 20,
    },
  ];

  async checkRateLimit(
    tenantId: string,
    userId: string,
    channel: NotificationChannel,
    category: NotificationCategory,
  ): Promise<boolean> {
    const key = this.generateKey({ tenantId, userId, channel, category });
    const rule = this.getRateLimitRule(channel, category);

    if (!rule) {
      this.logger.warn(`No rate limit rule found for ${channel}/${category}`);
      return false; // Allow if no rule exists
    }

    const now = Date.now();
    const current = this.rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      // Reset or initialize
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.getResetTime(rule),
      });
      return false; // Not rate limited
    }

    if (current.count >= rule.maxPerHour) {
      this.logger.warn(
        `Rate limit exceeded for ${key}: ${current.count}/${rule.maxPerHour}`,
      );
      return true; // Rate limited
    }

    // Increment count
    current.count++;
    this.rateLimitStore.set(key, current);

    return false; // Not rate limited
  }

  async checkDailyRateLimit(
    tenantId: string,
    userId: string,
    channel: NotificationChannel,
    category: NotificationCategory,
  ): Promise<boolean> {
    const key = this.generateDailyKey({ tenantId, userId, channel, category });
    const rule = this.getRateLimitRule(channel, category);

    if (!rule) {
      return false; // Allow if no rule exists
    }

    const now = Date.now();
    const current = this.rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      // Reset or initialize (24 hours)
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + 24 * 60 * 60 * 1000, // 24 hours
      });
      return false; // Not rate limited
    }

    if (current.count >= rule.maxPerDay) {
      this.logger.warn(
        `Daily rate limit exceeded for ${key}: ${current.count}/${rule.maxPerDay}`,
      );
      return true; // Rate limited
    }

    // Increment count
    current.count++;
    this.rateLimitStore.set(key, current);

    return false; // Not rate limited
  }

  async checkEmergencyBypass(
    tenantId: string,
    userId: string,
    channel: NotificationChannel,
    category: NotificationCategory,
  ): Promise<boolean> {
    // Emergency notifications (safety alerts) bypass rate limits
    if (category === NotificationCategory.SAFETY) {
      this.logger.log(
        `Emergency bypass for safety notification: ${tenantId}/${userId}`,
      );
      return true;
    }

    // Check if user has emergency bypass privileges
    // This would typically check user roles/permissions
    const hasEmergencyAccess = await this.checkEmergencyAccess(
      tenantId,
      userId,
    );

    if (hasEmergencyAccess) {
      this.logger.log(
        `Emergency bypass for privileged user: ${tenantId}/${userId}`,
      );
      return true;
    }

    return false;
  }

  async getRateLimitStatus(
    tenantId: string,
    userId: string,
    channel: NotificationChannel,
    category: NotificationCategory,
  ): Promise<{
    isLimited: boolean;
    currentCount: number;
    maxCount: number;
    resetTime: Date;
    remainingTime: number;
  }> {
    const key = this.generateKey({ tenantId, userId, channel, category });
    const rule = this.getRateLimitRule(channel, category);

    if (!rule) {
      return {
        isLimited: false,
        currentCount: 0,
        maxCount: 0,
        resetTime: new Date(),
        remainingTime: 0,
      };
    }

    const now = Date.now();
    const current = this.rateLimitStore.get(key);

    if (!current || now > current.resetTime) {
      return {
        isLimited: false,
        currentCount: 0,
        maxCount: rule.maxPerHour,
        resetTime: new Date(now + this.getResetTime(rule)),
        remainingTime: this.getResetTime(rule),
      };
    }

    return {
      isLimited: current.count >= rule.maxPerHour,
      currentCount: current.count,
      maxCount: rule.maxPerHour,
      resetTime: new Date(current.resetTime),
      remainingTime: current.resetTime - now,
    };
  }

  async resetRateLimit(
    tenantId: string,
    userId: string,
    channel: NotificationChannel,
    category: NotificationCategory,
  ): Promise<void> {
    const key = this.generateKey({ tenantId, userId, channel, category });
    const dailyKey = this.generateDailyKey({
      tenantId,
      userId,
      channel,
      category,
    });

    this.rateLimitStore.delete(key);
    this.rateLimitStore.delete(dailyKey);

    this.logger.log(`Rate limit reset for ${key}`);
  }

  async getRateLimitRules(): Promise<RateLimitRule[]> {
    return this.rateLimitRules;
  }

  async updateRateLimitRule(rule: RateLimitRule): Promise<void> {
    const index = this.rateLimitRules.findIndex(
      (r) => r.channel === rule.channel && r.category === rule.category,
    );

    if (index >= 0) {
      this.rateLimitRules[index] = rule;
    } else {
      this.rateLimitRules.push(rule);
    }

    this.logger.log(
      `Rate limit rule updated for ${rule.channel}/${rule.category}`,
    );
  }

  private generateKey(rateLimitKey: RateLimitKey): string {
    return `${rateLimitKey.tenantId}:${rateLimitKey.userId}:${rateLimitKey.channel}:${rateLimitKey.category}:hourly`;
  }

  private generateDailyKey(rateLimitKey: RateLimitKey): string {
    return `${rateLimitKey.tenantId}:${rateLimitKey.userId}:${rateLimitKey.channel}:${rateLimitKey.category}:daily`;
  }

  private getRateLimitRule(
    channel: NotificationChannel,
    category: NotificationCategory,
  ): RateLimitRule | undefined {
    return this.rateLimitRules.find(
      (rule) => rule.channel === channel && rule.category === category,
    );
  }

  private getResetTime(rule: RateLimitRule): number {
    // Default to 1 hour (3600000 ms)
    return 60 * 60 * 1000;
  }

  private async checkEmergencyAccess(
    tenantId: string,
    userId: string,
  ): Promise<boolean> {
    // This would typically check user roles/permissions in the database
    // For now, return false (no emergency access)
    return false;
  }
}
