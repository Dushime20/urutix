import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  MaxLength,
  IsDateString,
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';
import { DriverStatus, EmploymentType } from '../../../entities/driver.entity';

export class CreateDriverDto {
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  phone: string;

  @IsDateString()
  dateOfBirth: Date;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsString()
  @MaxLength(50)
  licenseNumber: string;

  @IsDateString()
  licenseIssueDate: Date;

  @IsDateString()
  licenseExpiry: Date;

  @IsString()
  @MaxLength(50)
  licenseState: string;

  @IsString()
  @MaxLength(50)
  licenseCountry: string;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsDateString()
  hireDate: Date;

  @IsOptional()
  @IsDateString()
  terminationDate?: Date;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus; // Optional - will be set to ACTIVE by service if not provided

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  mileageRate?: number;

  @IsOptional()
  @IsDateString()
  medicalCertExpiry?: Date;

  @IsOptional()
  @IsDateString()
  drugTestDate?: Date;

  @IsOptional()
  @IsDateString()
  backgroundCheckDate?: Date;

  @IsOptional()
  @IsDateString()
  trainingCompletionDate?: Date;
}
