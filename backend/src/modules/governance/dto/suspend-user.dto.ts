import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDate, MinLength, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * SuspendUserDto
 * 
 * Data transfer object for suspending a user account.
 * Requires mandatory reason and violation category for audit trail.
 */
export class SuspendUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Reason must be at least 20 characters' })
  reason: string;

  @IsEnum(['fraud', 'platform_abuse', 'spam', 'illegal_listing', 'policy_violation', 'payment_dispute', 'system_exploitation', 'other'])
  @IsNotEmpty()
  violationCategory: 'fraud' | 'platform_abuse' | 'spam' | 'illegal_listing' | 'policy_violation' | 'payment_dispute' | 'system_exploitation' | 'other';

  @IsEnum(['low', 'medium', 'high', 'critical'])
  @IsNotEmpty()
  severity: 'low' | 'medium' | 'high' | 'critical';

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsObject()
  evidence?: Record<string, any>;
}
