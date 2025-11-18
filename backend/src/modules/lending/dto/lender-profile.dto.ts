import {
  IsString,
  IsEmail,
  IsUrl,
  IsOptional,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class LendingCapacityDto {
  @IsNumber()
  minLoanAmount: number;

  @IsNumber()
  maxLoanAmount: number;

  @IsNumber()
  totalCapacity: number;

  @IsNumber()
  availableCapacity: number;
}

export class PersonalInfoDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  bio?: string;
}

export class BusinessInfoDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @IsString()
  @IsOptional()
  taxId?: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  @IsOptional()
  foundedYear?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  operationalCountries?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportedCurrencies?: string[];

  @ValidateNested()
  @Type(() => LendingCapacityDto)
  @IsOptional()
  lendingCapacity?: LendingCapacityDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specializations?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];
}

export class BankingInfoDto {
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  routingNumber: string;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsOptional()
  swiftCode?: string;
}

export class PreferencesDto {
  @IsString()
  @IsOptional()
  language?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  dateFormat?: string;

  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  smsNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  marketingEmails?: boolean;

  @IsBoolean()
  @IsOptional()
  twoFactorAuth?: boolean;
}

export class UpdateLenderProfileDto {
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  @IsOptional()
  personal?: PersonalInfoDto;

  @ValidateNested()
  @Type(() => BusinessInfoDto)
  @IsOptional()
  business?: BusinessInfoDto;

  @ValidateNested()
  @Type(() => BankingInfoDto)
  @IsOptional()
  banking?: BankingInfoDto;

  @ValidateNested()
  @Type(() => PreferencesDto)
  @IsOptional()
  preferences?: PreferencesDto;
}

export class LenderProfileResponseDto {
  id: string;
  personal: PersonalInfoDto;
  business: BusinessInfoDto;
  banking?: BankingInfoDto;
  preferences?: PreferencesDto;
  security?: {
    lastPasswordChange: string;
    loginSessions: number;
    twoFactorAuth: boolean;
  };
  created_at: string;
  updated_at: string;
}
