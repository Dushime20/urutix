import { IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateNotificationDto {
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsDateString()
  readAt?: Date;

  @IsOptional()
  @IsDateString()
  archivedAt?: Date;
}
