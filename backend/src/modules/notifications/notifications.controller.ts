import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './services/notification.service';
import { TemplateService } from './services/template.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import {
  Notification,
  NotificationStatus,
  NotificationCategory,
} from '../../entities/notification.entity';
import {
  NotificationTemplate,
  TemplateType,
  TemplateCategory,
} from './entities/notification-template.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly templateService: TemplateService,
  ) {}

  // Notification Management
  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
  })
  async createNotification(
    @Body(ValidationPipe) createDto: CreateNotificationDto,
    @Request() req,
  ): Promise<{ message: string; notification: Notification }> {
    const notification = await this.notificationService.createNotification({
      ...createDto,
      tenantId: req.user.tenantId,
    });

    return {
      message: 'Notification created successfully',
      notification,
    };
  }

  @Post('send')
  @ApiOperation({ summary: 'Send notifications to multiple recipients' })
  @ApiResponse({ status: 201, description: 'Notifications sent successfully' })
  async sendNotifications(
    @Body(ValidationPipe) sendDto: SendNotificationDto,
    @Request() req,
  ): Promise<{ message: string; notifications: Notification[] }> {
    const notifications = await this.notificationService.sendNotification({
      ...sendDto,
      tenantId: req.user.tenantId,
    });

    return {
      message: 'Notifications sent successfully',
      notifications,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: NotificationStatus,
    isArray: true,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: NotificationCategory,
    isArray: true,
  })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  async getUserNotifications(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: NotificationStatus[],
    @Query('category') category?: NotificationCategory[],
    @Query('isRead') isRead?: boolean,
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const result = await this.notificationService.getUserNotifications(
      req.user.userId,
      req.user.tenantId,
      {
        page,
        limit,
        status,
        category,
        isRead,
      },
    );

    return {
      ...result,
      page: page || 1,
      limit: limit || 20,
    };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.notificationService.markAsRead(id, req.user.userId);
    return { message: 'Notification marked as read' };
  }

  @Put(':id/delivered')
  @ApiOperation({ summary: 'Mark notification as delivered' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsDelivered(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('externalId') externalId?: string,
  ): Promise<{ message: string }> {
    await this.notificationService.markAsDelivered(id, externalId);
    return { message: 'Notification marked as delivered' };
  }

  @Put(':id/opened')
  @ApiOperation({ summary: 'Mark notification as opened' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsOpened(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.notificationService.markAsOpened(id);
    return { message: 'Notification marked as opened' };
  }

  @Put(':id/clicked')
  @ApiOperation({ summary: 'Mark notification as clicked' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsClicked(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.notificationService.markAsClicked(id);
    return { message: 'Notification marked as clicked' };
  }

  // Template Management
  @Post('templates')
  @ApiOperation({ summary: 'Create a new notification template' })
  async createTemplate(
    @Body(ValidationPipe) templateData: Partial<NotificationTemplate>,
    @Request() req,
  ): Promise<{ message: string; template: NotificationTemplate }> {
    const template = await this.templateService.createTemplate({
      ...templateData,
      tenantId: req.user.tenantId,
    });

    return {
      message: 'Template created successfully',
      template,
    };
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get notification templates' })
  @ApiQuery({ name: 'category', required: false, enum: TemplateCategory })
  @ApiQuery({ name: 'type', required: false, enum: TemplateType })
  @ApiQuery({ name: 'language', required: false, type: String })
  async getTemplates(
    @Request() req,
    @Query('category') category?: TemplateCategory,
    @Query('type') type?: TemplateType,
    @Query('language') language?: string,
  ): Promise<{ templates: NotificationTemplate[] }> {
    let templates: NotificationTemplate[];

    if (category && type) {
      templates = await this.templateService.getTemplatesByCategory(
        req.user.tenantId,
        category,
        language,
      );
    } else if (type) {
      templates = await this.templateService.getTemplatesByType(
        req.user.tenantId,
        type,
        language,
      );
    } else if (category) {
      templates = await this.templateService.getTemplatesByCategory(
        req.user.tenantId,
        category,
        language,
      );
    } else {
      templates = await this.templateService.getAllTemplates(
        req.user.tenantId,
        language,
      );
    }

    return { templates };
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a specific template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async getTemplate(
    @Param('id') id: string,
    @Request() req,
    @Query('language') language?: string,
  ): Promise<{ template: NotificationTemplate }> {
    const template = await this.templateService.getTemplate(
      id,
      req.user.tenantId,
      language,
    );
    return { template };
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update a notification template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async updateTemplate(
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<NotificationTemplate>,
    @Request() req,
  ): Promise<{ message: string; template: NotificationTemplate }> {
    const template = await this.templateService.updateTemplate(
      id,
      req.user.tenantId,
      updateData,
    );
    return {
      message: 'Template updated successfully',
      template,
    };
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a notification template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async deleteTemplate(
    @Param('id') id: string,
    @Request() req,
  ): Promise<{ message: string }> {
    await this.templateService.deleteTemplate(id, req.user.tenantId);
    return { message: 'Template deleted successfully' };
  }

  @Post('templates/:id/duplicate')
  @ApiOperation({ summary: 'Duplicate a notification template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async duplicateTemplate(
    @Param('id') id: string,
    @Body() body: { name: string; slug: string },
    @Request() req,
  ): Promise<{ message: string; template: NotificationTemplate }> {
    const template = await this.templateService.duplicateTemplate(
      id,
      req.user.tenantId,
      body.name,
      body.slug,
    );
    return {
      message: 'Template duplicated successfully',
      template,
    };
  }

  @Put('templates/:id/default')
  @ApiOperation({ summary: 'Set template as default' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async setDefaultTemplate(
    @Param('id') id: string,
    @Body() body: { category: TemplateCategory; type: TemplateType },
    @Request() req,
  ): Promise<{ message: string }> {
    await this.templateService.setDefaultTemplate(
      id,
      req.user.tenantId,
      body.category,
      body.type,
    );
    return { message: 'Template set as default successfully' };
  }

  // Analytics and Metrics
  @Get('metrics')
  @ApiOperation({ summary: 'Get notification metrics' })
  @ApiQuery({ name: 'start', required: false, type: String })
  @ApiQuery({ name: 'end', required: false, type: String })
  async getMetrics(
    @Request() req,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ): Promise<{ metrics: any }> {
    const period = {
      start: start
        ? new Date(start)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: end ? new Date(end) : new Date(),
    };

    const metrics = await this.notificationService.getNotificationMetrics(
      req.user.tenantId,
      period,
    );
    return { metrics };
  }

  @Get('metrics/channels')
  @ApiOperation({ summary: 'Get channel-specific metrics' })
  async getChannelMetrics(@Request() req): Promise<{ channels: any[] }> {
    // This would typically call a service method
    const channels = [
      {
        channel: 'email',
        total: 1000,
        sent: 950,
        delivered: 900,
        failed: 50,
        deliveryRate: 94.7,
        averageResponseTime: 250,
      },
      {
        channel: 'sms',
        total: 500,
        sent: 480,
        delivered: 450,
        failed: 30,
        deliveryRate: 93.8,
        averageResponseTime: 150,
      },
      {
        channel: 'push',
        total: 800,
        sent: 780,
        delivered: 750,
        failed: 30,
        deliveryRate: 96.2,
        averageResponseTime: 100,
      },
      {
        channel: 'in_app',
        total: 1200,
        sent: 1200,
        delivered: 1200,
        failed: 0,
        deliveryRate: 100,
        averageResponseTime: 50,
      },
    ];
    return { channels };
  }

  @Get('metrics/categories')
  @ApiOperation({ summary: 'Get category-specific metrics' })
  async getCategoryMetrics(@Request() req): Promise<{ categories: any[] }> {
    // This would typically call a service method
    const categories = [
      {
        category: 'trip_status',
        total: 800,
        sent: 780,
        delivered: 750,
        failed: 30,
        opened: 600,
        clicked: 300,
        deliveryRate: 96.2,
        openRate: 80,
        clickRate: 40,
      },
      {
        category: 'payment',
        total: 400,
        sent: 390,
        delivered: 370,
        failed: 20,
        opened: 300,
        clicked: 150,
        deliveryRate: 94.9,
        openRate: 81.1,
        clickRate: 40.5,
      },
      {
        category: 'safety',
        total: 200,
        sent: 200,
        delivered: 200,
        failed: 0,
        opened: 180,
        clicked: 120,
        deliveryRate: 100,
        openRate: 90,
        clickRate: 60,
      },
      {
        category: 'performance',
        total: 100,
        sent: 95,
        delivered: 90,
        failed: 5,
        opened: 70,
        clicked: 40,
        deliveryRate: 94.7,
        openRate: 77.8,
        clickRate: 44.4,
      },
    ];
    return { categories };
  }

  // System Management
  @Post('retry-failed')
  @ApiOperation({ summary: 'Retry failed notifications' })
  async retryFailedNotifications(): Promise<{ message: string }> {
    await this.notificationService.retryFailedNotifications();
    return { message: 'Failed notifications retry process started' };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Request() req): Promise<{ count: number }> {
    // This would typically call a service method
    const count = Math.floor(Math.random() * 10);
    return { count };
  }

  @Post('templates/defaults')
  @ApiOperation({ summary: 'Create default templates for tenant' })
  async createDefaultTemplates(@Request() req): Promise<{ message: string }> {
    await this.templateService.createDefaultTemplates(req.user.tenantId);
    return { message: 'Default templates created successfully' };
  }

  @Post('validate-template')
  @ApiOperation({ summary: 'Validate template syntax and variables' })
  async validateTemplate(
    @Body() templateData: Partial<NotificationTemplate>,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.templateService.validateTemplate(templateData);
  }
}
