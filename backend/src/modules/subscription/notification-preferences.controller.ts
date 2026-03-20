import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  NotificationPreference, 
  NotificationType, 
  NotificationChannel 
} from '../../entities/notification-preference.entity';
import { NotificationDeliveryService } from '../../services/notification-delivery.service';

@ApiTags('Notification Preferences')
@ApiBearerAuth()
@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    private notificationService: NotificationDeliveryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Returns user notification preferences' })
  async getPreferences(@Request() req) {
    const tenantId = req.user.tenantId;
    const userId = req.user.role === 'TRUCK_OWNER' ? req.user.id : undefined;

    const preferences = await this.preferenceRepository.find({
      where: {
        tenantId,
        userId,
      },
      order: { notificationType: 'ASC' },
    });

    // If no preferences exist, return defaults
    if (preferences.length === 0) {
      return {
        success: true,
        data: this.getDefaultPreferences(),
      };
    }

    return {
      success: true,
      data: preferences.map(pref => ({
        id: pref.id,
        notificationType: pref.notificationType,
        enabledChannels: pref.enabledChannels,
        isEnabled: pref.isEnabled,
        emailAddress: pref.emailAddress,
        phoneNumber: pref.phoneNumber,
        settings: pref.settings,
      })),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create or update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updatePreferences(@Request() req, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.role === 'TRUCK_OWNER' ? req.user.id : undefined;

    const { preferences } = body;

    if (!Array.isArray(preferences)) {
      return {
        success: false,
        message: 'Preferences must be an array',
      };
    }

    try {
      const updatedPreferences = [];

      for (const prefData of preferences) {
        // Find existing preference or create new one
        let preference = await this.preferenceRepository.findOne({
          where: {
            tenantId,
            userId,
            notificationType: prefData.notificationType,
          },
        });

        if (!preference) {
          preference = this.preferenceRepository.create({
            tenantId,
            userId,
            notificationType: prefData.notificationType,
          });
        }

        // Update fields
        preference.enabledChannels = prefData.enabledChannels || [NotificationChannel.EMAIL];
        preference.isEnabled = prefData.isEnabled !== undefined ? prefData.isEnabled : true;
        preference.emailAddress = prefData.emailAddress || req.user.email;
        preference.phoneNumber = prefData.phoneNumber;
        preference.settings = prefData.settings;

        const saved = await this.preferenceRepository.save(preference);
        updatedPreferences.push(saved);
      }

      return {
        success: true,
        message: 'Notification preferences updated successfully',
        data: updatedPreferences,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update preferences: ${error.message}`,
      };
    }
  }
  @Get('history')
  @ApiOperation({ summary: 'Get notification history' })
  @ApiResponse({ status: 200, description: 'Returns notification history' })
  async getNotificationHistory(
    @Request() req,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.role === 'TRUCK_OWNER' ? req.user.id : undefined;
    const historyLimit = limit ? parseInt(limit) : 50;

    try {
      const history = await this.notificationService.getNotificationHistory(
        tenantId,
        userId,
        historyLimit,
      );

      return {
        success: true,
        data: history.map(log => ({
          id: log.id,
          type: log.notificationType,
          channel: log.channel,
          subject: log.subject,
          message: log.message,
          status: log.status,
          priority: log.priority,
          sentAt: log.sentAt,
          deliveredAt: log.deliveredAt,
          createdAt: log.createdAt,
        })),
        meta: {
          count: history.length,
          limit: historyLimit,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get notification history: ${error.message}`,
      };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Returns notification statistics' })
  async getNotificationStats(
    @Request() req,
    @Query('days') days?: string,
  ) {
    const tenantId = req.user.tenantId;
    const statsDays = days ? parseInt(days) : 30;

    try {
      const stats = await this.notificationService.getNotificationStats(tenantId, statsDays);

      // Process stats for better frontend consumption
      const processedStats = {
        byType: {},
        byChannel: {},
        byStatus: {},
        total: 0,
      };

      for (const stat of stats) {
        const count = parseInt(stat.count);
        processedStats.total += count;

        // Group by type
        if (!processedStats.byType[stat.type]) {
          processedStats.byType[stat.type] = 0;
        }
        processedStats.byType[stat.type] += count;

        // Group by channel
        if (!processedStats.byChannel[stat.channel]) {
          processedStats.byChannel[stat.channel] = 0;
        }
        processedStats.byChannel[stat.channel] += count;

        // Group by status
        if (!processedStats.byStatus[stat.status]) {
          processedStats.byStatus[stat.status] = 0;
        }
        processedStats.byStatus[stat.status] += count;
      }

      return {
        success: true,
        data: processedStats,
        meta: {
          days: statsDays,
          period: `Last ${statsDays} days`,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get notification stats: ${error.message}`,
      };
    }
  }

  @Post('test')
  @ApiOperation({ summary: 'Send test notification' })
  @ApiResponse({ status: 200, description: 'Test notification sent' })
  async sendTestNotification(@Request() req, @Body() body: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.role === 'TRUCK_OWNER' ? req.user.id : undefined;

    const { type, channels } = body;

    if (!type || !Object.values(NotificationType).includes(type)) {
      return {
        success: false,
        message: 'Invalid notification type',
      };
    }

    try {
      await this.notificationService.sendNotification({
        tenantId,
        userId,
        type,
        subject: `Test Notification: ${type}`,
        message: `This is a test notification of type ${type} sent at ${new Date().toISOString()}`,
        priority: 'MEDIUM',
        channels: channels || [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        data: {
          testMode: true,
          sentBy: req.user.email,
        },
      });

      return {
        success: true,
        message: 'Test notification sent successfully',
        data: {
          type,
          channels: channels || [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          sentAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send test notification: ${error.message}`,
      };
    }
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences() {
    return Object.values(NotificationType).map(type => ({
      notificationType: type,
      enabledChannels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      isEnabled: true,
      settings: {
        frequency: 'IMMEDIATE',
      },
    }));
  }
}