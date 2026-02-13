import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength, IsObject, IsBoolean } from 'class-validator';

/**
 * TerminateSubscriptionDto
 * 
 * Data transfer object for permanently terminating a user's subscription.
 * This is the most severe enforcement action.
 */
export class TerminateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Reason must be at least 20 characters' })
  reason: string;

  @IsEnum(['fraud', 'platform_abuse', 'spam', 'illegal_listing', 'policy_violation', 'payment_dispute', 'system_exploitation', 'other'])
  @IsNotEmpty()
  violationCategory: 'fraud' | 'platform_abuse' | 'spam' | 'illegal_listing' | 'policy_violation' | 'payment_dispute' | 'system_exploitation' | 'other';

  @IsOptional()
  @IsBoolean()
  addToBlacklist?: boolean;

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
