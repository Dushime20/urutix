import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * CheckBlacklistDto
 * 
 * DTO for checking if an identifier is blacklisted.
 * Used during registration and login validation.
 */
export class CheckBlacklistDto {
  @ApiProperty({
    description: 'Identifier to check',
    example: 'user@example.com',
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
}
