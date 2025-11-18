import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
} from '../../../entities/notification.entity';

export class NotificationFilterDto {
  @IsOptional()
  @IsString()
  type?: string;
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search in title and message

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}
