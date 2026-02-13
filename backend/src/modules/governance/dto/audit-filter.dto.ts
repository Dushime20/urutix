import { IsOptional, IsEnum, IsUUID, IsDate, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * AuditFilterDto
 * 
 * Data transfer object for filtering audit trail queries.
 */
export class AuditFilterDto {
  @IsOptional()
  @IsUUID()
  adminId?: string;

  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @IsOptional()
  @IsEnum(['suspend', 'unsuspend', 'restrict', 'unrestrict', 'terminate', 'reinstate', 'flag', 'unflag'])
  actionType?: 'suspend' | 'unsuspend' | 'restrict' | 'unrestrict' | 'terminate' | 'reinstate' | 'flag' | 'unflag';

  @IsOptional()
  @IsEnum(['fraud', 'platform_abuse', 'spam', 'illegal_listing', 'policy_violation', 'payment_dispute', 'system_exploitation', 'other'])
  violationCategory?: 'fraud' | 'platform_abuse' | 'spam' | 'illegal_listing' | 'policy_violation' | 'payment_dispute' | 'system_exploitation' | 'other';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity?: 'low' | 'medium' | 'high' | 'critical';

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
