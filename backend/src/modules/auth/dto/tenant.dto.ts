import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PaginatorDto } from 'src/utils/paginator';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { TenantStatus, TenantType } from '../../../entities/tenant.entity';

export class FindTenantsDto extends PartialType(PaginatorDto) {
  @ApiProperty({ description: 'Search', required: false })
  q?: string;
}

export class UpdateTenantDto {
  @ApiProperty({
    description: 'Tenant name',
    example: 'Acme Logistics',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tenant name must be at least 2 characters' })
  @MaxLength(100, { message: 'Tenant name must not exceed 100 characters' })
  name?: string;

  @ApiProperty({
    description: 'Tenant subdomain (alphanumeric, lowercase, dots, hyphens, 3-253 characters)',
    example: 'umarava.urutibx.com',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Subdomain must be at least 3 characters' })
  @MaxLength(253, { message: 'Subdomain must not exceed 253 characters' })
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/, {
    message:
      'Subdomain must contain only lowercase letters, numbers, dots, and hyphens. It cannot start or end with a dot or hyphen, and cannot have consecutive dots.',
  })
  subdomain?: string;

  @ApiProperty({
    description: 'Tenant domain',
    example: 'acme.com',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(253, { message: 'Domain must not exceed 253 characters' })
  domain?: string;

  @ApiProperty({
    description: 'Tenant type',
    enum: TenantType,
    required: false,
  })
  @IsOptional()
  @IsEnum(TenantType)
  type?: TenantType;

  @ApiProperty({
    description: 'Tenant status',
    enum: TenantStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @ApiProperty({
    description: 'Contact email for the tenant',
    example: 'admin@acme.com',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  contactEmail?: string;

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
    description: 'Logo URL',
    example: 'https://example.com/logo.png',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Logo URL must not exceed 500 characters' })
  logoUrl?: string;

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
    description: 'Tax ID',
    example: 'TAX123456',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Tax ID must not exceed 50 characters' })
  taxId?: string;

  @ApiProperty({
    description: 'Business license',
    example: 'BL123456',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Business license must not exceed 100 characters' })
  businessLicense?: string;

  @ApiProperty({
    description: 'Maximum number of users',
    example: 100,
    type: Number,
    required: false,
  })
  @IsOptional()
  maxUsers?: number;

  @ApiProperty({
    description: 'Maximum number of trucks',
    example: 50,
    type: Number,
    required: false,
  })
  @IsOptional()
  maxTrucks?: number;

  @ApiProperty({
    description: 'Maximum number of drivers',
    example: 100,
    type: Number,
    required: false,
  })
  @IsOptional()
  maxDrivers?: number;

  @ApiProperty({
    description: 'Maximum loads per month',
    example: 1000,
    type: Number,
    required: false,
  })
  @IsOptional()
  maxLoadsPerMonth?: number;

  @ApiProperty({
    description: 'Subscription plan',
    example: 'starter',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  subscriptionPlan?: string;

  @ApiProperty({
    description: 'Is active',
    example: true,
    type: Boolean,
    required: false,
  })
  @IsOptional()
  isActive?: boolean;
}
