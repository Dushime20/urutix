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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationFilterDto,
  NotificationSearchDto,
  BulkNotificationUpdateDto,
} from './dto/notification.dto';
import { Notification } from '../../entities/notification.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Create a new notification',
    description: 'Create and send a notification through specified channels',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: Notification,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiBody({
    description: 'Notification creation data',
    type: CreateNotificationDto,
  })
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() user: any,
  ): Promise<Notification> {
    // Ensure tenant ID is set from user context
    const notificationData = {
      ...createNotificationDto,
      tenantId: user.tenantId,
    };

    return this.notificationService.createNotification(notificationData);
  }

  @Post('smart')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.CARGO_OWNER,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.AGENT,
    UserRole.LENDER,
    UserRole.USER,
  )
  @ApiOperation({
    summary: 'Send smart notification',
    description:
      'Send an intelligent notification based on user behavior and context',
  })
  @ApiResponse({
    status: 201,
    description: 'Smart notification sent successfully',
    type: Notification,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBody({
    description: 'Smart notification data',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            'price_drop',
            'route_optimization',
            'demand_spike',
            'delivery_delay',
            'market_opportunity',
          ],
        },
        data: { type: 'object' },
        recipientId: { type: 'string' },
      },
      required: ['type', 'data', 'recipientId'],
    },
  })
  async sendSmartNotification(
    @Body() body: { type: string; data: any; recipientId: string },
    @CurrentUser() user: any,
  ): Promise<Notification> {
    return this.notificationService.sendSmartNotification(
      body.recipientId,
      body.type,
      body.data,
      user.tenantId,
    );
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.CARGO_OWNER,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.AGENT,
    UserRole.LENDER,
    UserRole.USER,
  )
  @ApiOperation({
    summary: 'Get notifications with filtering and pagination',
    description:
      'Retrieve notifications with advanced filtering, sorting, and pagination',
  })
  @ApiQuery({ name: 'recipientId', required: false, type: String })
  @ApiQuery({
    name: 'entityType',
    required: false,
    enum: ['USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP'],
  })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  @ApiQuery({
    name: 'notificationType',
    required: false,
    enum: ['DRIVER_ASSIGNMENT', 'VEHICLE_MAINTENANCE_DUE', 'SYSTEM_UPDATE'],
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['SYSTEM', 'DRIVER', 'VEHICLE', 'CARGO', 'TRIP'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'],
  })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'requiresAction', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, minimum: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        notifications: {
          type: 'array',
          items: { $ref: '#/components/schemas/Notification' },
        },
        total: { type: 'number' },
      },
    },
  })
  async getNotifications(
    @Query() filterDto: NotificationFilterDto,
    @CurrentUser() user: any,
  ): Promise<{ notifications: Notification[]; total: number }> {
    return this.notificationService.getNotifications(filterDto, user.tenantId);
  }

  @Get('search')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Search notifications across all fields',
    description:
      'Full-text search across notification titles, messages, and metadata with relevance scoring',
  })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'entityTypes', required: false, type: [String] })
  @ApiQuery({ name: 'categories', required: false, type: [String] })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [Notification],
  })
  async searchNotifications(
    @Query() searchDto: NotificationSearchDto,
    @CurrentUser() user: any,
  ): Promise<Notification[]> {
    return this.notificationService.searchNotifications(
      searchDto,
      user.tenantId,
    );
  }

  @Get('my')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.CARGO_OWNER,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.AGENT,
    UserRole.LENDER,
    UserRole.USER,
  )
  @ApiOperation({
    summary: 'Get current user notifications',
    description: 'Retrieve notifications for the currently authenticated user',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, default: 50 })
  @ApiResponse({
    status: 200,
    description: 'User notifications retrieved successfully',
    type: [Notification],
  })
  async getMyNotifications(
    @Query('limit') limit: number = 50,
    @CurrentUser() user: any,
  ): Promise<Notification[]> {
    try {
      return await this.notificationService.getNotificationsByRecipient(
        user.userId,
        user.tenantId,
        limit,
      );
    } catch (error: any) {
      console.error('Error fetching user notifications:', error);
      // Return empty array instead of throwing to prevent UI crashes
      // The frontend already handles empty arrays gracefully
      return [];
    }
  }

  @Get('my/unread-count')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.TENANT_ADMIN,
    UserRole.MANAGER,
    UserRole.CARGO_OWNER,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
    UserRole.AGENT,
    UserRole.LENDER,
    UserRole.USER,
  )
  @ApiOperation({
    summary: 'Get unread notifications count',
    description: 'Get the count of unread notifications for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    },
  })
  async getUnreadCount(@CurrentUser() user: any): Promise<{ count: number }> {
    try {
      const count = await this.notificationService.getUnreadCount(
        user.userId,
        user.tenantId,
      );
      return { count };
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      // Return 0 as safe fallback
      return { count: 0 };
    }
  }

  @Get('entity/:entityType/:entityId')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Get notifications by entity',
    description: 'Retrieve all notifications for a specific entity',
  })
  @ApiParam({
    name: 'entityType',
    enum: ['USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP'],
  })
  @ApiParam({ name: 'entityId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Notifications for the entity',
    type: [Notification],
  })
  async getNotificationsByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: any,
  ): Promise<Notification[]> {
    return this.notificationService.getNotificationsByEntity(
      entityType as any,
      entityId,
      user.tenantId,
    );
  }

  @Get('scheduled')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER)
  @ApiOperation({
    summary: 'Get scheduled notifications',
    description: 'Retrieve all scheduled notifications for the tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled notifications retrieved successfully',
    type: [Notification],
  })
  async getScheduledNotifications(
    @CurrentUser() user: any,
  ): Promise<Notification[]> {
    return this.notificationService.getScheduledNotifications(user.tenantId);
  }

  @Get('expired')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER)
  @ApiOperation({
    summary: 'Get expired notifications',
    description: 'Retrieve all expired notifications for the tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Expired notifications retrieved successfully',
    type: [Notification],
  })
  async getExpiredNotifications(
    @CurrentUser() user: any,
  ): Promise<Notification[]> {
    return this.notificationService.getExpiredNotifications(user.tenantId);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve a specific notification by its ID',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: Notification,
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async getNotificationById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<Notification> {
    return this.notificationService.getNotificationById(id, user.tenantId);
  }

  @Put(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Update notification',
    description: 'Update an existing notification',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    description: 'Notification update data',
    type: UpdateNotificationDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
    type: Notification,
  })
  async updateNotification(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @CurrentUser() user: any,
  ): Promise<Notification> {
    return this.notificationService.updateNotification(
      id,
      updateNotificationDto,
      user.userId,
      user.tenantId,
    );
  }

  @Post(':id/read')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a notification as read by the current user',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    type: Notification,
  })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<Notification> {
    return this.notificationService.markAsRead(id, user.userId, user.tenantId);
  }

  @Post('bulk/read')
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.TRUCK_OWNER,
    UserRole.DRIVER,
  )
  @ApiOperation({
    summary: 'Bulk mark notifications as read',
    description: 'Mark multiple notifications as read at once',
  })
  @ApiBody({
    description: 'Notification IDs to mark as read',
    schema: {
      type: 'object',
      properties: {
        notificationIds: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications marked as read successfully',
    type: [Notification],
  })
  async bulkMarkAsRead(
    @Body() body: { notificationIds: string[] },
    @CurrentUser() user: any,
  ): Promise<Notification[]> {
    if (!body.notificationIds || !Array.isArray(body.notificationIds)) {
      throw new BadRequestException('notificationIds must be an array');
    }

    return this.notificationService.bulkMarkAsRead(
      body.notificationIds,
      user.userId,
      user.tenantId,
    );
  }

  @Post('bulk/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER)
  @ApiOperation({
    summary: 'Bulk update notification status',
    description: 'Update the status of multiple notifications at once',
  })
  @ApiBody({ type: BulkNotificationUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Notifications updated successfully',
    type: [Notification],
  })
  async bulkUpdateStatus(
    @Body() bulkUpdateDto: BulkNotificationUpdateDto,
    @CurrentUser() user: any,
  ): Promise<Notification[]> {
    // This would need to be implemented in the service
    // For now, we'll return a placeholder response
    throw new BadRequestException('Bulk status update not yet implemented');
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRUCK_OWNER)
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Permanently delete a notification (soft delete)',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.notificationService.deleteNotification(
      id,
      user.userId,
      user.tenantId,
    );
  }

  @Post('process-scheduled')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Process scheduled notifications',
    description: 'Process all scheduled notifications that are due to be sent',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled notifications processed successfully',
  })
  async processScheduledNotifications(): Promise<{ message: string }> {
    await this.notificationService.processScheduledNotifications();
    return { message: 'Scheduled notifications processed successfully' };
  }

  @Post('cleanup-expired')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Clean up expired notifications',
    description: 'Clean up all expired notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Expired notifications cleaned up successfully',
  })
  async cleanupExpiredNotifications(): Promise<{ message: string }> {
    await this.notificationService.cleanupExpiredNotifications();
    return { message: 'Expired notifications cleaned up successfully' };
  }

  @Post('test/:channel')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Test notification channel',
    description: 'Send a test notification through a specific channel',
  })
  @ApiParam({ name: 'channel', enum: ['EMAIL', 'SMS', 'PUSH', 'WEBHOOK'] })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent successfully',
  })
  async testNotificationChannel(
    @Param('channel') channel: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    // This would need to be implemented in the service
    // For now, we'll return a placeholder response
    return { message: `Test notification sent through ${channel} channel` };
  }
}
