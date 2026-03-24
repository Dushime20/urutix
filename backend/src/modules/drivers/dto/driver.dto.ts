import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsUUID,
  IsObject,
  IsArray,
  Min,
  Max,
  IsPhoneNumber,
  IsBoolean,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EmploymentType, DriverStatus } from '../../../entities/driver.entity';

export class EmergencyContactDto {
  @ApiProperty({
    description: 'Emergency contact name',
    example: 'John Smith',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Emergency contact relationship',
    example: 'Spouse',
  })
  @IsString()
  relationship: string;

  @ApiProperty({
    description: 'Emergency contact phone number',
    example: '+1234567890',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    description: 'Emergency contact email',
    example: 'emergency@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class LicenseClassDto {
  @ApiProperty({
    description: 'License class code',
    example: 'CDL-A',
  })
  @IsString()
  class: string;

  @ApiProperty({
    description: 'License class description',
    example: 'Commercial Driver License Class A',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'License class issue date',
    example: '2020-01-15',
  })
  @IsDateString()
  issueDate: string;

  @ApiProperty({
    description: 'License class expiry date',
    example: '2025-01-15',
  })
  @IsDateString()
  expiryDate: string;
}

export class CertificationDto {
  @ApiProperty({
    description: 'Certification name',
    example: 'Hazmat Transportation',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Certification issuing authority',
    example: 'Department of Transportation',
  })
  @IsString()
  issuingAuthority: string;

  @ApiProperty({
    description: 'Certification issue date',
    example: '2020-01-15',
  })
  @IsDateString()
  issueDate: string;

  @ApiProperty({
    description: 'Certification expiry date',
    example: '2025-01-15',
  })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({
    description: 'Certification number',
    example: 'CERT-123456',
  })
  @IsString()
  certificateNumber: string;
}

export class CreateDriverDto {
  @ApiProperty({
    description: 'Tenant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Employer ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  employerId: string;

  @ApiProperty({
    description: 'Employee ID',
    example: 'EMP-123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({
    description: 'Driver first name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Driver last name',
    example: 'Smith',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Driver email address',
    example: 'john.smith@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Driver phone number',
    example: '+1234567890',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    description: 'Driver date of birth',
    example: '1985-06-15',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Driver address',
    example: '123 Main St, City, State 12345',
  })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Emergency contact information',
    type: EmergencyContactDto,
  })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact: EmergencyContactDto;

  @ApiProperty({
    description: 'Driver license number',
    example: 'DL123456789',
  })
  @IsString()
  licenseNumber: string;

  @ApiProperty({
    description: 'License classes',
    type: [LicenseClassDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LicenseClassDto)
  licenseClasses: LicenseClassDto[];

  @ApiProperty({
    description: 'License issue date',
    example: '2020-01-15',
  })
  @IsDateString()
  licenseIssueDate: string;

  @ApiProperty({
    description: 'License expiry date',
    example: '2025-01-15',
  })
  @IsDateString()
  licenseExpiry: string;

  @ApiProperty({
    description: 'License state',
    example: 'CA',
  })
  @IsString()
  licenseState: string;

  @ApiProperty({
    description: 'License country',
    example: 'USA',
  })
  @IsString()
  licenseCountry: string;

  @ApiProperty({
    description: 'License endorsements',
    example: ['H', 'T', 'X'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  endorsements?: string[];

  @ApiProperty({
    description: 'License restrictions',
    example: ['E', 'L'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];

  @ApiProperty({
    description: 'Employment type',
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiProperty({
    description: 'Hire date',
    example: '2020-01-15',
  })
  @IsDateString()
  hireDate: string;

  @ApiProperty({
    description: 'Driver status',
    enum: DriverStatus,
    example: DriverStatus.ACTIVE,
  })
  @IsEnum(DriverStatus)
  status: DriverStatus;

  @ApiProperty({
    description: 'Availability status',
    example: 'AVAILABLE',
  })
  @IsString()
  availabilityStatus: string;

  @ApiProperty({
    description: 'Current truck ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  currentTruckId?: string;

  @ApiProperty({
    description: 'Current trip ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  currentTripId?: string;

  @ApiProperty({
    description: 'Medical certificate expiry date',
    example: '2025-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  medicalCertExpiry?: string;

  @ApiProperty({
    description: 'Drug test date',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  drugTestDate?: string;

  @ApiProperty({
    description: 'Background check date',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  backgroundCheckDate?: string;

  @ApiProperty({
    description: 'Training completion date',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  trainingCompletionDate?: string;

  @ApiProperty({
    description: 'Driver certifications',
    type: [CertificationDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  @ApiProperty({
    description: 'Driver rating (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({
    description: 'Hourly rate',
    example: 25.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({
    description: 'Mileage rate',
    example: 0.65,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileageRate?: number;

  @ApiProperty({
    description: 'Driver preferences',
    example: { preferredRoutes: ['CA-NY'], maxHoursPerDay: 10 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;
}

export class UpdateDriverDto {
  @ApiProperty({
    description: 'Driver first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Driver last name',
    example: 'Smith',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Driver email address',
    example: 'john.smith@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Driver phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiProperty({
    description: 'Driver address',
    example: '123 Main St, City, State 12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Emergency contact information',
    type: EmergencyContactDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiProperty({
    description: 'License expiry date',
    example: '2025-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  licenseExpiry?: string;

  @ApiProperty({
    description: 'License endorsements',
    example: ['H', 'T', 'X'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  endorsements?: string[];

  @ApiProperty({
    description: 'License restrictions',
    example: ['E', 'L'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];

  @ApiProperty({
    description: 'Employment type',
    enum: EmploymentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiProperty({
    description: 'Driver status',
    enum: DriverStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiProperty({
    description: 'Availability status',
    example: 'AVAILABLE',
    required: false,
  })
  @IsOptional()
  @IsString()
  availabilityStatus?: string;

  @ApiProperty({
    description: 'Current truck ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  currentTruckId?: string;

  @ApiProperty({
    description: 'Current trip ID',
    example: '550e8400-e29b-41d4-a716-446655440004',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  currentTripId?: string;

  @ApiProperty({
    description: 'Medical certificate expiry date',
    example: '2025-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  medicalCertExpiry?: string;

  @ApiProperty({
    description: 'Drug test date',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  drugTestDate?: string;

  @ApiProperty({
    description: 'Background check date',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  backgroundCheckDate?: string;

  @ApiProperty({
    description: 'Training completion date',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  trainingCompletionDate?: string;

  @ApiProperty({
    description: 'Driver certifications',
    type: [CertificationDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  @ApiProperty({
    description: 'Driver rating (0-5)',
    example: 4.5,
    minimum: 0,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({
    description: 'Hourly rate',
    example: 25.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({
    description: 'Mileage rate',
    example: 0.65,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileageRate?: number;

  @ApiProperty({
    description: 'Driver preferences',
    example: { preferredRoutes: ['CA-NY'], maxHoursPerDay: 10 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @ApiProperty({
    description: 'Driver license number',
    example: 'DL123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  licenseNumber?: string;
}

export class TelematicsEventDto {
  @ApiProperty({
    description: 'Telematics event type',
    example: 'HARSH_BRAKING',
    enum: [
      'HARSH_BRAKING',
      'SPEEDING',
      'SAFE_EVENT',
      'ROUTE_DEVIATION',
      'ENGINE_FAULT',
      'FUEL_LEVEL',
      'LOCATION_UPDATE',
    ],
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Telematics event value',
    example: '75',
  })
  @IsString()
  value: string;

  @ApiProperty({
    description: 'Event timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({
    description: 'Vehicle location (latitude, longitude)',
    example: { latitude: 40.7128, longitude: -74.006 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  location?: { latitude: number; longitude: number };

  @ApiProperty({
    description: 'Vehicle speed in mph',
    example: 65,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  speed?: number;

  @ApiProperty({
    description: 'Engine RPM',
    example: 2000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  engineRpm?: number;

  @ApiProperty({
    description: 'Fuel level percentage',
    example: 75,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fuelLevel?: number;

  @ApiProperty({
    description: 'Additional event data',
    example: { severity: 'HIGH', threshold: 80 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class EmergencyReportDto {
  @ApiProperty({
    description: 'Emergency type',
    example: 'ACCIDENT',
    enum: ['ACCIDENT', 'BREAKDOWN', 'MEDICAL', 'WEATHER', 'TRAFFIC', 'OTHER'],
  })
  @IsString()
  emergencyType: string;

  @ApiProperty({
    description: 'Emergency description',
    example: 'Vehicle breakdown on highway',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Emergency location',
    example: { latitude: 40.7128, longitude: -74.006 },
  })
  @IsObject()
  location: { latitude: number; longitude: number };

  @ApiProperty({
    description: 'Emergency severity',
    example: 'HIGH',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  @IsString()
  severity: string;

  @ApiProperty({
    description: 'Additional emergency details',
    example: { injuries: false, vehicleDamage: 'MINOR' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}

export class DriverFilterDto {
  @ApiProperty({
    description: 'Filter by status',
    enum: DriverStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @ApiProperty({
    description: 'Filter by employment type',
    enum: EmploymentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiProperty({
    description: 'Filter by availability status',
    example: 'AVAILABLE',
    required: false,
  })
  @IsOptional()
  @IsString()
  availabilityStatus?: string;

  @ApiProperty({
    description: 'Filter by minimum rating',
    example: 4.0,
    minimum: 0,
    maximum: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiProperty({
    description: 'Filter by minimum safety score',
    example: 80,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minSafetyScore?: number;

  @ApiProperty({
    description: 'Search by name or license number',
    example: 'John Smith',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CompleteDeliveryDto {
  @ApiProperty({
    description: 'Load ID to complete',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  loadId: string;

  @ApiProperty({
    description: 'Recipient name',
    example: 'Jane Doe',
  })
  @IsString()
  recipientName: string;

  @ApiProperty({
    description: 'Signature in base64 format',
    required: false,
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsOptional()
  @IsString()
  signatureBase64?: string;

  @ApiProperty({
    description: 'Additional delivery notes',
    required: false,
    example: 'Left at the back entrance as requested.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
