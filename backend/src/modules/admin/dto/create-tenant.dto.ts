import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';

export enum SubscriptionPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant name',
    example: 'Acme Logistics',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Tenant name is required' })
  @MinLength(2, { message: 'Tenant name must be at least 2 characters' })
  @MaxLength(100, { message: 'Tenant name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Tenant subdomain (alphanumeric, lowercase, dots, hyphens, 3-253 characters)',
    example: 'umarava.urutibx.com',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Subdomain is required' })
  @MinLength(3, { message: 'Subdomain must be at least 3 characters' })
  @MaxLength(253, { message: 'Subdomain must not exceed 253 characters' })
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/, {
    message:
      'Subdomain must contain only lowercase letters, numbers, dots, and hyphens. It cannot start or end with a dot or hyphen, and cannot have consecutive dots.',
  })
  subdomain: string;

  @ApiProperty({
    description: 'Tenant domain (optional - will be auto-generated from subdomain if not provided)',
    example: 'umarava.urutibx.com',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(253, { message: 'Domain must not exceed 253 characters' })
  domain?: string;

  @ApiProperty({
    description: 'Contact email for the tenant (will be used for admin user)',
    example: 'admin@acme.com',
    type: String,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Contact email is required' })
  contactEmail: string;

  @ApiProperty({
    description: 'Admin first name',
    example: 'John',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Admin first name is required' })
  @MinLength(1, { message: 'Admin first name is required' })
  @MaxLength(50, { message: 'Admin first name must not exceed 50 characters' })
  adminFirstName: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'Doe',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Admin last name is required' })
  @MinLength(1, { message: 'Admin last name is required' })
  @MaxLength(50, { message: 'Admin last name must not exceed 50 characters' })
  adminLastName: string;

  @ApiProperty({
    description: 'Admin password (minimum 8 characters)',
    example: 'SecurePassword123!',
    type: String,
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Admin password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  adminPassword: string;

  @ApiProperty({
    description: 'Subscription plan',
    example: SubscriptionPlan.STARTER,
    enum: SubscriptionPlan,
    default: SubscriptionPlan.STARTER,
  })
  @IsEnum(SubscriptionPlan, {
    message: 'Subscription plan must be one of: starter, professional, enterprise',
  })
  @IsOptional()
  plan?: SubscriptionPlan;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+1234567890',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Phone number must not exceed 20 characters' })
  contactPhone?: string;

  @ApiProperty({
    description: 'Company name (optional, defaults to tenant name)',
    example: 'Acme Logistics Inc.',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Company name must not exceed 100 characters' })
  companyName?: string;

  @ApiProperty({
    description: 'Tenant description',
    example: 'Leading logistics provider in the region',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Tenant address',
    example: '123 Main Street',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Address must not exceed 200 characters' })
  address?: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'City must not exceed 100 characters' })
  city?: string;

  @ApiProperty({
    description: 'State/Province',
    example: 'NY',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'State must not exceed 100 characters' })
  state?: string;

  @ApiProperty({
    description: 'Country',
    example: 'USA',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Country must not exceed 100 characters' })
  country?: string;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Postal code must not exceed 20 characters' })
  postalCode?: string;

  @ApiProperty({
    description: 'Website URL',
    example: 'https://www.acme.com',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Website URL must not exceed 200 characters' })
  websiteUrl?: string;
}

