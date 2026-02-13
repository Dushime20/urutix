import { IsString, IsNotEmpty, IsOptional, IsDate, MinLength, IsObject, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * RestrictFeaturesDto
 * 
 * Data transfer object for applying feature-level restrictions to a user.
 * Allows granular control over what features a user can access.
 */
export class RestrictFeaturesDto {
  @IsObject()
  @IsNotEmpty()
  restrictions: Record<string, boolean>;
  // Example: { "canPostCargo": false, "canAddTrucks": false, "canBid": false }

  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Reason must be at least 20 characters' })
  reason: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsObject()
  evidence?: Record<string, any>;
}
