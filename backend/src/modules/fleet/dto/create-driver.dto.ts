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
  Matches,
} from 'class-validator';
import { DriverStatus, EmploymentType } from '../../../entities/driver.entity';

export class CreateFleetDriverDto {
  @IsString()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^[\d\s\-\+\(\)]+$/, {
    message: 'Phone number must contain only digits, spaces, dashes, plus signs, and parentheses',
  })
  @MaxLength(20)
  phone: string;

  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO 8601 date string (e.g., 2023-12-25T00:00:00.000Z)' })
  dateOfBirth: string;

  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsString()
  @MaxLength(50)
  licenseNumber: string;

  @IsDateString({}, { message: 'licenseIssueDate must be a valid ISO 8601 date string' })
  licenseIssueDate: string;

  @IsDateString({}, { message: 'licenseExpiry must be a valid ISO 8601 date string' })
  licenseExpiry: string;

  @IsString()
  @MaxLength(50)
  licenseState: string;

  @IsString()
  @MaxLength(50)
  licenseCountry: string;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsDateString({}, { message: 'hireDate must be a valid ISO 8601 date string' })
  hireDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'terminationDate must be a valid ISO 8601 date string' })
  terminationDate?: string;

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
  @IsDateString({}, { message: 'medicalCertExpiry must be a valid ISO 8601 date string' })
  medicalCertExpiry?: string;

  @IsOptional()
  @IsDateString({}, { message: 'drugTestDate must be a valid ISO 8601 date string' })
  drugTestDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'backgroundCheckDate must be a valid ISO 8601 date string' })
  backgroundCheckDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'trainingCompletionDate must be a valid ISO 8601 date string' })
  trainingCompletionDate?: string;
}
