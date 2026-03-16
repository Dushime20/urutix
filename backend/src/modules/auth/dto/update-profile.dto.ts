import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentInfoDto {
  @ApiProperty({ required: false, description: 'Phone number for payments' })
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false, description: 'Mobile Money code' })
  @IsOptional()
  momoCode?: string;

  @ApiProperty({ required: false, description: 'Bank account number' })
  @IsOptional()
  accountNumber?: string;
}

export class PreferencesDto {
  @ApiProperty({ required: false, type: PaymentInfoDto, description: 'Payment information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentInfoDto)
  paymentInfo?: PaymentInfoDto;

  // Allow additional properties
  [key: string]: any;
}

export class ProfileDataDto {
  @ApiProperty({ required: false, description: 'First name' })
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false, description: 'Last name' })
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false, description: 'Company name' })
  @IsOptional()
  companyName?: string;

  @ApiProperty({ required: false, description: 'Phone number' })
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false, description: 'Address' })
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false, description: 'Bio' })
  @IsOptional()
  bio?: string;

  @ApiProperty({ required: false, description: 'Website URL' })
  @IsOptional()
  websiteUrl?: string;

  @ApiProperty({ required: false, description: 'Postal Code' })
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ required: false, description: 'Country Code' })
  @IsOptional()
  countryCode?: string;

  @ApiProperty({ required: false, type: PreferencesDto, description: 'User preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;
}

export class UpdateProfileDto {
  @ApiProperty({ required: false, type: PreferencesDto, description: 'User preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;

  @ApiProperty({ required: false, type: ProfileDataDto, description: 'Profile data' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDataDto)
  profile?: ProfileDataDto;
}

