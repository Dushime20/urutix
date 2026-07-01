import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  MaxLength,
  IsDateString,
  IsEmail,
  IsArray,
  ValidateNested,
  IsObject,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { DriverStatus, EmploymentType } from '../../../entities/driver.entity';

/**
 * Helper: if the incoming value is a JSON string (from multipart form-data),
 * parse it; otherwise return it as-is.
 */
function parseJsonIfString(value: any): any {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

export class EmergencyContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  relationship?: string;
}

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
  @Matches(/^[\d\s\-\+\(\)\.ext]+$/i, {
    message: 'Phone number must contain only digits, spaces, dashes, plus signs, parentheses, dots, or ext',
  })
  @MaxLength(30)
  phone: string;

  @IsDateString({}, { message: 'dateOfBirth must be a valid ISO 8601 date string' })
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
  status?: DriverStatus;

  @IsOptional()
  @IsString()
  availabilityStatus?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseJsonIfString(value);
    const num = Number(parsed);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseJsonIfString(value);
    const num = Number(parsed);
    return isNaN(num) ? undefined : num;
  })
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

  /**
   * Array of route IDs to assign to the driver.
   * Comes as a JSON string from multipart — @Transform parses it back.
   */
  @IsOptional()
  @Transform(({ value }) => parseJsonIfString(value))
  @IsArray()
  @IsString({ each: true })
  routeIds?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = parseJsonIfString(value);
    const num = Number(parsed);
    return isNaN(num) ? undefined : num;
  })
  @IsNumber()
  @Min(0)
  @Max(50)
  experience?: number;

  @IsOptional()
  @IsString()
  driverNotes?: string;

  /**
   * Emergency contact object.
   * Comes as a JSON string from multipart — @Transform parses it, then
   * @ValidateNested + @Type validate the resulting object.
   */
  @IsOptional()
  @Transform(({ value }) => parseJsonIfString(value))
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  /**
   * License classes array — e.g. ["CLASS_A"].
   * Comes as a JSON string from multipart.
   */
  @IsOptional()
  @Transform(({ value }) => parseJsonIfString(value))
  @IsArray()
  @IsString({ each: true })
  licenseClasses?: string[];

  @IsOptional()
  @Transform(({ value }) => parseJsonIfString(value))
  @IsArray()
  @IsString({ each: true })
  endorsements?: string[];

  @IsOptional()
  @Transform(({ value }) => parseJsonIfString(value))
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];

  /**
   * Certifications — stored as an array of enabled key names.
   * Comes as a JSON string from multipart.
   */
  @IsOptional()
  @Transform(({ value }) => parseJsonIfString(value))
  @IsArray()
  certifications?: string[];

  /**
   * Arbitrary preferences object.
   * Comes as a JSON string from multipart.
   */
  @IsOptional()
  @Transform(({ value }) => parseJsonIfString(value))
  @IsObject()
  preferences?: Record<string, any>;

  /**
   * documentsMeta is sent as a JSON string alongside the uploaded files.
   * We accept it here so the ValidationPipe doesn't reject it;
   * the controller reads it separately via (createDriverDto as any).documentsMeta.
   */
  @IsOptional()
  documentsMeta?: any;
}
