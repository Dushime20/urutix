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

// Enums based on database schema
export enum CargoTypeV2 {
  GENERAL = 'GENERAL',
  FOOD = 'FOOD',
  ELECTRONICS = 'ELECTRONICS',
  CHEMICALS = 'CHEMICALS',
  AUTOMOTIVE = 'AUTOMOTIVE',
  TEXTILES = 'TEXTILES',
  MACHINERY = 'MACHINERY',
  FRAGILE = 'FRAGILE',
  HAZARDOUS = 'HAZARDOUS',
  REFRIGERATED = 'REFRIGERATED',
}

export enum LoadStatusV2 {
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
  CRITICAL = 'CRITICAL',
}

// Contact Info interface
export interface ContactInfoV2 {
  name: string;
  phone: string;
  email?: string;
  company?: string;
}

// Matching Criteria interface
export interface MatchingCriteriaV2 {
  maxDistance?: number;
  preferredCarriers?: string[];
  excludedCarriers?: string[];
  minRating?: number;
}

// Truck Requirements interface
export interface TruckRequirementsV2 {
  truckType?: string[];
  minCapacity?: number;
  maxAge?: number;
  requiredEquipment?: string[];
}

// Carrier Preferences interface
export interface CarrierPreferencesV2 {
  preferredCarriers?: string[];
  excludedCarriers?: string[];
  minRating?: number;
  maxDistance?: number;
}

// Cost Preferences interface
export interface CostPreferencesV2 {
  maxPrice?: number;
  preferredPaymentTerms?: string;
  includesFuelSurcharge?: boolean;
}

// Create Load DTO V2
export class CreateLoadV2Dto {
  @ApiProperty({ description: 'Load title', maxLength: 255 })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiPropertyOptional({ description: 'Load description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Weight in kg', minimum: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100)
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
  matchingCriteria?: MatchingCriteriaV2;

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
