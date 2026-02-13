import { IsString, IsNotEmpty, IsIn, IsOptional, IsUUID, IsDate, IsEmail, IsPhoneNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * AddToBlacklistDto
 * 
 * DTO for adding an identifier to the blacklist.
 * Prevents registration and access for matching identifiers.
 */
export class AddToBlacklistDto {
  @ApiProperty({
    description: 'Identifier to blacklist (email, phone, company name, tax ID, etc.)',
    example: 'spam@example.com',
  })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    description: 'Type of identifier',
    enum: ['email', 'email_domain', 'phone', 'company', 'tax_id', 'device_fingerprint', 'ip_address'],
    example: 'email',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['email', 'email_domain', 'phone', 'company', 'tax_id', 'device_fingerprint', 'ip_address'])
  identifierType: 'email' | 'email_domain' | 'phone' | 'company' | 'tax_id' | 'device_fingerprint' | 'ip_address';

  @ApiProperty({
    description: 'Reason for blacklisting',
    example: 'Repeated spam violations and fraudulent activity',
    minLength: 20,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Violation category',
    enum: ['spam', 'fraud', 'abuse', 'harassment', 'illegal', 'other'],
    example: 'fraud',
  })
  @IsOptional()
  @IsString()
  @IsIn(['spam', 'fraud', 'abuse', 'harassment', 'illegal', 'other'])
  violationCategory?: string;

  @ApiPropertyOptional({
    description: 'Expiration date (null for permanent)',
    example: '2027-02-13T00:00:00Z',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Related user ID (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  relatedUserId?: string;

  @ApiPropertyOptional({
    description: 'Related enforcement action ID (if applicable)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  relatedEnforcementActionId?: string;

  @ApiPropertyOptional({
    description: 'Admin notes',
    example: 'User created multiple accounts to bypass restrictions',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
