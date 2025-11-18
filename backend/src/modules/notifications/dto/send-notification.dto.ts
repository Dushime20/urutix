import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsObject,
  IsDateString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
} from '../../../entities/notification.entity';

export class NotificationRecipient {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Recipient email address',
    example: 'driver@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    description: 'Recipient phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Recipient name',
    example: 'John Smith',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Device token for push notifications',
    example: 'fcm-token-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceToken?: string;

  @ApiProperty({
    description: 'Language preference',
    example: 'en',
    default: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string = 'en';
}

export class SendNotificationDto {
  @ApiProperty({
    description: 'Tenant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({
    description: 'Template ID to use',
    example: 'trip-started-email',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'List of recipients',
    type: [NotificationRecipient],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationRecipient)
  recipients: NotificationRecipient[];

  @ApiProperty({
    description: 'Template data for variable substitution',
    example: {
      tripId: 'TRP-123',
      origin: 'New York',
      destination: 'Los Angeles',
    },
  })
  @IsObject()
  data: Record<string, any>;

  @ApiProperty({
    description: 'Notification channels to use',
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.EMAIL, NotificationChannel.SMS],
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

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
    description: 'Scheduled send time',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({
    description: 'Additional metadata',
    example: { source: 'trip-service', event: 'trip-started' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
