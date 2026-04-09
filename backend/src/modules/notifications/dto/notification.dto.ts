import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  IsUrl,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  NotificationCategory,
  EntityType,
  NotificationChannel,
} from '../../../entities/notification.entity';

// Declare helper DTOs before they are referenced by @Type(() => ...)
export class NotificationAttachmentDto {
  @IsString()
  fileName: string;

  @IsUrl()
  fileUrl: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  mimeType: string;
}

export class WorkflowCommentDto {
  @IsString()
  comment: string;

  @IsUUID()
  commentedBy: string;

  @IsDate()
  @Type(() => Date)
  commentedAt: Date;
}

export class CreateNotificationRequestDto {
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsUUID()
  recipientId: string;

  @IsEnum(EntityType)
  @IsOptional()
  entityType?: EntityType;

  @IsUUID()
  @IsOptional()
  entityId?: string;

  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  shortMessage?: string;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  scheduledAt?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;

  @IsBoolean()
  @IsOptional()
  requiresAction?: boolean;

  @IsUrl()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  actionText?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationAttachmentDto)
  @IsOptional()
  attachments?: NotificationAttachmentDto[];

  @IsString()
  @IsOptional()
  workflowId?: string;

  @IsString()
  @IsOptional()
  step?: string;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;
}

export class UpdateNotificationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  shortMessage?: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  channels?: NotificationChannel[];

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  scheduledAt?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date;

  @IsBoolean()
  @IsOptional()
  requiresAction?: boolean;

  @IsUrl()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  actionText?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationAttachmentDto)
  @IsOptional()
  attachments?: NotificationAttachmentDto[];

  @IsString()
  @IsOptional()
  step?: string;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;
}

export class NotificationFilterDto {
  @IsUUID()
  @IsOptional()
  recipientId?: string;

  @IsEnum(EntityType)
  @IsOptional()
  entityType?: EntityType;

  @IsUUID()
  @IsOptional()
  entityId?: string;

  @IsEnum(NotificationType)
  @IsOptional()
  notificationType?: NotificationType;

  @IsEnum(NotificationCategory)
  @IsOptional()
  category?: NotificationCategory;

  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresAction?: boolean;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  channels?: NotificationChannel[];

  @IsString()
  @IsOptional()
  search?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  createdAfter?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  createdBefore?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  scheduledAfter?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  scheduledBefore?: Date;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}

export class NotificationSearchDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsArray()
  @IsEnum(EntityType, { each: true })
  @IsOptional()
  entityTypes?: EntityType[];

  @IsArray()
  @IsEnum(NotificationCategory, { each: true })
  @IsOptional()
  categories?: NotificationCategory[];

  @IsArray()
  @IsEnum(NotificationStatus, { each: true })
  @IsOptional()
  statuses?: NotificationStatus[];

  @IsArray()
  @IsEnum(NotificationPriority, { each: true })
  @IsOptional()
  priorities?: NotificationPriority[];

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}

// Duplicate removed above

export class NotificationWorkflowDto {
  @IsString()
  workflowId: string;

  @IsString()
  step: string;

  @IsString()
  @IsOptional()
  nextStep?: string;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDate?: Date;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowCommentDto)
  @IsOptional()
  comments?: WorkflowCommentDto[];
}

// Duplicate removed above

export class NotificationEscalationDto {
  @IsNumber()
  escalationLevel: number;

  @IsString()
  escalationReason: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  nextEscalationAt?: Date;
}

export class NotificationComplianceDto {
  @IsString()
  regulatoryBody: string;

  @IsString()
  complianceCode: string;

  @IsString()
  requiredAction: string;

  @IsDate()
  @Type(() => Date)
  deadline: Date;

  @IsString()
  @IsOptional()
  penalty?: string;
}

export class QuietHoursDto {
  @IsString()
  start: string; // Format: "HH:MM"

  @IsString()
  end: string; // Format: "HH:MM"

  @IsString()
  timezone: string;
}

export class UserPreferencesDto {
  @IsBoolean()
  emailEnabled: boolean;

  @IsBoolean()
  smsEnabled: boolean;

  @IsBoolean()
  pushEnabled: boolean;

  @ValidateNested()
  @Type(() => QuietHoursDto)
  @IsOptional()
  quietHours?: QuietHoursDto;
}

export class AnalyticsDto {
  @IsNumber()
  openCount: number;

  @IsNumber()
  clickCount: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  lastOpenedAt?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  lastClickedAt?: Date;

  @IsString()
  @IsOptional()
  deviceInfo?: string;

  @IsString()
  @IsOptional()
  locationInfo?: string;
}

export class DeliveryAttemptDto {
  @IsNumber()
  attempt: number;

  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  error?: string;
}

export class BulkNotificationUpdateDto {
  @IsArray()
  @IsUUID('4', { each: true })
  notificationIds: string[];

  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class NotificationTemplateDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  shortMessage?: string;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
