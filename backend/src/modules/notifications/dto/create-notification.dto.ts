import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
  NotificationType,
} from '../../../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.TRIP_UPDATE,
  })
  @IsEnum(NotificationType)
  type: NotificationType;
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  actionText?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  trackingId?: string;
  @ApiProperty({
    description: 'Tenant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'Notification channel',
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({
    description: 'Notification priority',
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL,
  })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @ApiProperty({
    description: 'Notification category',
    enum: NotificationCategory,
    example: NotificationCategory.TRIP_STATUS,
  })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @ApiProperty({
    description: 'Template ID',
    example: 'trip-started-email',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Notification subject',
    example: 'Trip TRP-123 has started',
    required: false,
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({
    description: 'Notification content',
    example: 'Your trip TRP-123 from New York to Los Angeles has started.',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Template data for variable substitution',
    example: {
      tripId: 'TRP-123',
      origin: 'New York',
      destination: 'Los Angeles',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;

  @ApiProperty({
    description: 'Recipient email address',
    example: 'driver@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @ApiProperty({
    description: 'Recipient phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiProperty({
    description: 'Recipient name',
    example: 'John Smith',
    required: false,
  })
  @IsOptional()
  @IsString()
  recipientName?: string;

  @ApiProperty({
    description: 'Device token for push notifications',
    example: 'fcm-token-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceToken?: string;

  @ApiProperty({
    description: 'Language code',
    example: 'en',
    default: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string = 'en';

  @ApiProperty({
    description: 'Scheduled send time',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({
    description: 'Maximum retry attempts',
    example: 3,
    default: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxRetries?: number = 3;

  @ApiProperty({
    description: 'Additional metadata',
    example: { source: 'trip-service', event: 'trip-started' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'External tracking ID',
    example: 'ext-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  // ...existing code...
}
