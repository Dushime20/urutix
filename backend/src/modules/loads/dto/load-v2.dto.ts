import {
  IsUUID,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
  IsInt,
  Min,
  Max,
  Length,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums based on the provided entity
export enum CargoTypeV2 {
  GENERAL = 'GENERAL',
  FOOD = 'FOOD',
  ELECTRONICS = 'ELECTRONICS',
  CHEMICALS = 'CHEMICALS',
  AUTOMOTIVE = 'AUTOMOTIVE',
  TEXTILES = 'TEXTILES',
  MACHINERY = 'MACHINERY',
}

export enum LoadStatusV2 {
  LOADED = 'LOADED',
  DRAFT = 'DRAFT',
  CREATED = 'CREATED',
  PUBLISHED = 'PUBLISHED',
  ASSIGNED = 'ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum UrgencyLevelV2 {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Contact Info interface
export interface ContactInfoV2 {
  name: string;
  phone: string;
  email?: string;
  company?: string;
}

// Truck Requirements interface
export interface TruckRequirementsV2 {
  minCapacityWeight?: number;
  minCapacityVolume?: number;
  requiredTruckTypes?: string[];
  requiredFeatures?: string[];
  maxTruckAge?: number;
  minDriverExperience?: number;
  requiredCertifications?: string[];
  minInsuranceCoverage?: number;
}

// Carrier Preferences interface
export interface CarrierPreferencesV2 {
  preferredCarriers?: string[];
  excludedCarriers?: string[];
  minCarrierRating?: number;
  maxDistance?: number;
  maxHoursToAvailability?: number;
}

// Cost Preferences interface
export interface CostPreferencesV2 {
  maxBudget?: number;
  preferredPaymentTerms?: string;
  requiresInsurance?: boolean;
  requiresTracking?: boolean;
}

// Create Load DTO
export class CreateLoadV2Dto {
  @ApiProperty({ description: 'Load title', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiPropertyOptional({ description: 'Load description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Weight in kg', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight: number;

  @ApiPropertyOptional({ description: 'Volume in cubic meters', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  volume?: number;

  @ApiProperty({ enum: CargoTypeV2, description: 'Type of cargo' })
  @IsEnum(CargoTypeV2)
  cargoType: CargoTypeV2;

  @ApiProperty({ description: 'Pickup location ID' })
  @IsUUID()
  pickupLocationId: string;

  @ApiProperty({ description: 'Delivery location ID' })
  @IsUUID()
  deliveryLocationId: string;

  @ApiProperty({ description: 'Pickup date and time' })
  @IsDateString()
  pickupDate: string;

  @ApiProperty({ description: 'Delivery date and time' })
  @IsDateString()
  deliveryDate: string;

  @ApiProperty({ description: 'Load value', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  loadValue: number;

  @ApiPropertyOptional({ description: 'Offered price', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  offeredPrice?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string = 'USD';

  @ApiPropertyOptional({ description: 'Is cargo fragile', default: false })
  @IsOptional()
  @IsBoolean()
  isFragile?: boolean = false;

  @ApiPropertyOptional({ description: 'Is cargo hazardous', default: false })
  @IsOptional()
  @IsBoolean()
  isHazardous?: boolean = false;

  @ApiPropertyOptional({
    description: 'Requires refrigeration',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresRefrigeration?: boolean = false;

  @ApiPropertyOptional({ description: 'Contact information' })
  @IsOptional()
  @IsObject()
  contactInfo?: ContactInfoV2;

  @ApiPropertyOptional({ description: 'Auto matching enabled', default: true })
  @IsOptional()
  @IsBoolean()
  autoMatchEnabled?: boolean = true;

  @ApiPropertyOptional({ description: 'Matching criteria' })
  @IsOptional()
  @IsObject()
  matchingCriteria?: any;

  // Physical dimensions
  @ApiPropertyOptional({ description: 'Length in meters', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  length?: number;

  @ApiPropertyOptional({ description: 'Width in meters', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ description: 'Height in meters', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  height?: number;

  @ApiPropertyOptional({
    description: 'Stackable height in meters',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  stackableHeight?: number;

  @ApiPropertyOptional({ description: 'Is stackable', default: false })
  @IsOptional()
  @IsBoolean()
  isStackable?: boolean = false;

  // Temperature control
  @ApiPropertyOptional({ description: 'Minimum temperature in Celsius' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  temperatureMin?: number;

  @ApiPropertyOptional({ description: 'Maximum temperature in Celsius' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  temperatureMax?: number;

  @ApiPropertyOptional({
    description: 'Requires humidity control',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresHumidityControl?: boolean = false;

  // Handling requirements
  @ApiPropertyOptional({ description: 'Requires forklift', default: false })
  @IsOptional()
  @IsBoolean()
  requiresForklift?: boolean = false;

  @ApiPropertyOptional({ description: 'Requires crane', default: false })
  @IsOptional()
  @IsBoolean()
  requiresCrane?: boolean = false;

  @ApiPropertyOptional({ description: 'Requires loading dock', default: false })
  @IsOptional()
  @IsBoolean()
  requiresLoadingDock?: boolean = false;

  @ApiPropertyOptional({ description: 'Loading time estimate in hours' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  loadingTimeEstimate?: number;

  @ApiPropertyOptional({ description: 'Unloading time estimate in hours' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unloadingTimeEstimate?: number;

  // Hazmat information
  @ApiPropertyOptional({ description: 'Hazmat class' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  hazmatClass?: string;

  @ApiPropertyOptional({ description: 'Hazmat number' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  hazmatNumber?: string;

  // Urgency and timing
  @ApiPropertyOptional({
    enum: UrgencyLevelV2,
    description: 'Urgency level',
    default: UrgencyLevelV2.NORMAL,
  })
  @IsOptional()
  @IsEnum(UrgencyLevelV2)
  urgencyLevel?: UrgencyLevelV2 = UrgencyLevelV2.NORMAL;

  @ApiPropertyOptional({ description: 'Is time critical', default: false })
  @IsOptional()
  @IsBoolean()
  isTimeCritical?: boolean = false;

  @ApiPropertyOptional({ description: 'Maximum transit time in hours' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxTransitTime?: number;

  // Packaging and pieces
  @ApiPropertyOptional({ description: 'Packaging type' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  packagingType?: string;

  @ApiPropertyOptional({ description: 'Number of pieces', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfPieces?: number = 0;

  @ApiPropertyOptional({ description: 'Number of pallets', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfPallets?: number = 0;

  // Monitoring requirements
  @ApiPropertyOptional({
    description: 'Requires GPS monitoring',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresGpsMonitoring?: boolean = false;

  @ApiPropertyOptional({
    description: 'Requires temperature monitoring',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresTemperatureMonitoring?: boolean = false;

  // Insurance and special requirements
  @ApiPropertyOptional({ description: 'Insurance value', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  insuranceValue?: number;

  @ApiPropertyOptional({
    description: 'Requires low clearance route',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresLowClearanceRoute?: boolean = false;

  @ApiPropertyOptional({ description: 'Maximum clearance height in meters' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxClearanceHeight?: number;

  @ApiPropertyOptional({
    description: 'Requires escort vehicle',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresEscortVehicle?: boolean = false;

  // Instructions and contact
  @ApiPropertyOptional({ description: 'Special handling instructions' })
  @IsOptional()
  @IsString()
  specialHandlingInstructions?: string;

  @ApiPropertyOptional({ description: 'Loading instructions' })
  @IsOptional()
  @IsString()
  loadingInstructions?: string;

  @ApiPropertyOptional({ description: 'Unloading instructions' })
  @IsOptional()
  @IsString()
  unloadingInstructions?: string;

  @ApiPropertyOptional({ description: 'Emergency contact information' })
  @IsOptional()
  @IsString()
  emergencyContactInfo?: string;

  // Preferences
  @ApiPropertyOptional({ description: 'Truck requirements' })
  @IsOptional()
  @IsObject()
  truckRequirements?: TruckRequirementsV2;

  @ApiPropertyOptional({ description: 'Carrier preferences' })
  @IsOptional()
  @IsObject()
  carrierPreferences?: CarrierPreferencesV2;

  @ApiPropertyOptional({ description: 'Cost preferences' })
  @IsOptional()
  @IsObject()
  costPreferences?: CostPreferencesV2;

  // Documentation requirements
  @ApiPropertyOptional({
    description: 'Requires pre-shipment inspection',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresPreShipmentInspection?: boolean = false;

  @ApiPropertyOptional({
    description: 'Requires delivery inspection',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresDeliveryInspection?: boolean = false;

  @ApiPropertyOptional({
    description: 'Requires photographic documentation',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresPhotographicDocumentation?: boolean = false;
}

// Update Load DTO
export class UpdateLoadV2Dto {
  @ApiPropertyOptional({ description: 'Load title', maxLength: 255 })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @ApiPropertyOptional({ description: 'Load description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Weight in kg', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: 'Volume in cubic meters', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  volume?: number;

  @ApiPropertyOptional({ enum: CargoTypeV2, description: 'Type of cargo' })
  @IsOptional()
  @IsEnum(CargoTypeV2)
  cargoType?: CargoTypeV2;

  @ApiPropertyOptional({ description: 'Pickup location ID' })
  @IsOptional()
  @IsUUID()
  pickupLocationId?: string;

  @ApiPropertyOptional({ description: 'Delivery location ID' })
  @IsOptional()
  @IsUUID()
  deliveryLocationId?: string;

  @ApiPropertyOptional({ description: 'Pickup date and time' })
  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @ApiPropertyOptional({ description: 'Delivery date and time' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @ApiPropertyOptional({ enum: LoadStatusV2, description: 'Load status' })
  @IsOptional()
  @IsEnum(LoadStatusV2)
  status?: LoadStatusV2;

  @ApiPropertyOptional({ description: 'Load value', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  loadValue?: number;

  @ApiPropertyOptional({ description: 'Offered price', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  offeredPrice?: number;

  @ApiPropertyOptional({ description: 'Contact information' })
  @IsOptional()
  @IsObject()
  contactInfo?: ContactInfoV2;

  @ApiPropertyOptional({ description: 'Auto matching enabled' })
  @IsOptional()
  @IsBoolean()
  autoMatchEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Matching criteria' })
  @IsOptional()
  @IsObject()
  matchingCriteria?: any;

  @ApiPropertyOptional({ description: 'Assigned truck ID' })
  @IsOptional()
  @IsUUID()
  assignedTruckId?: string;

  // Include other optional fields from CreateLoadV2Dto as needed
  @ApiPropertyOptional({ description: 'Is cargo fragile' })
  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @ApiPropertyOptional({ description: 'Is cargo hazardous' })
  @IsOptional()
  @IsBoolean()
  isHazardous?: boolean;

  @ApiPropertyOptional({ description: 'Requires refrigeration' })
  @IsOptional()
  @IsBoolean()
  requiresRefrigeration?: boolean;

  @ApiPropertyOptional({ enum: UrgencyLevelV2, description: 'Urgency level' })
  @IsOptional()
  @IsEnum(UrgencyLevelV2)
  urgencyLevel?: UrgencyLevelV2;

  @ApiPropertyOptional({ description: 'Is time critical' })
  @IsOptional()
  @IsBoolean()
  isTimeCritical?: boolean;

  @ApiPropertyOptional({ description: 'Metadata for additional properties' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// Load Query DTO for filtering and searching
export class LoadQueryV2Dto {
  @ApiPropertyOptional({ description: 'Tenant ID filter' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Cargo owner ID filter' })
  @IsOptional()
  @IsUUID()
  cargoOwnerId?: string;

  @ApiPropertyOptional({ enum: LoadStatusV2, description: 'Status filter' })
  @IsOptional()
  @IsEnum(LoadStatusV2)
  status?: LoadStatusV2;

  @ApiPropertyOptional({ enum: CargoTypeV2, description: 'Cargo type filter' })
  @IsOptional()
  @IsEnum(CargoTypeV2)
  cargoType?: CargoTypeV2;

  @ApiPropertyOptional({
    description: 'Search query for title and description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Pickup location ID filter' })
  @IsOptional()
  @IsUUID()
  pickupLocationId?: string;

  @ApiPropertyOptional({ description: 'Delivery location ID filter' })
  @IsOptional()
  @IsUUID()
  deliveryLocationId?: string;

  @ApiPropertyOptional({ description: 'Pickup date from' })
  @IsOptional()
  @IsDateString()
  pickupDateFrom?: string;

  @ApiPropertyOptional({ description: 'Pickup date to' })
  @IsOptional()
  @IsDateString()
  pickupDateTo?: string;

  @ApiPropertyOptional({ description: 'Minimum weight' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWeight?: number;

  @ApiPropertyOptional({ description: 'Maximum weight' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeight?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', default: 'DESC' })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// Paginated response interface
export interface PaginatedResponseV2<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
