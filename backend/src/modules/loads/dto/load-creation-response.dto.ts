import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsObject,
  ValidateNested,
  Min,
  Max,
  IsUUID,
  MaxLength,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LoadType,
  EquipmentType,
  CargoType,
  UrgencyLevel,
  Visibility,
  PaymentTerms,
  PackagingType,
  SpecialRequirements,
} from '../../../entities/load.entity';

export class LoadLocationDto {
  @ApiProperty({ description: 'Location ID' })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Location type',
    enum: ['PICKUP', 'DELIVERY', 'STOP', 'REFUEL', 'REST'],
  })
  @IsString()
  type: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST';

  @ApiProperty({ description: 'Sequence order' })
  @IsNumber()
  sequence: number;

  @ApiProperty({ description: 'Location data' })
  @IsObject()
  locationData: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    contactInfo?: {
      contactPerson?: string;
      contactPhone?: string;
      contactEmail?: string;
    };
    operatingHours?: Record<string, any>;
    specialInstructions?: string;
    accessInstructions?: string;
  };

  @ApiProperty({ description: 'Scheduled date' })
  @IsDateString()
  scheduledDate: Date;

  @ApiProperty({ description: 'Estimated time in minutes' })
  @IsNumber()
  estimatedTime: number;

  @ApiPropertyOptional({ description: 'Location requirements' })
  @IsOptional()
  @IsObject()
  requirements?: {
    requiresForklift?: boolean;
    requiresCrane?: boolean;
    requiresLoadingDock?: boolean;
    hazmatCertified?: boolean;
    temperatureControlled?: boolean;
    securityClearance?: string;
  };

  @ApiPropertyOptional({ description: 'Location status' })
  @IsOptional()
  @IsString()
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

  @ApiPropertyOptional({ description: 'Actual arrival time' })
  @IsOptional()
  @IsDateString()
  actualArrivalTime?: Date;

  @ApiPropertyOptional({ description: 'Actual departure time' })
  @IsOptional()
  @IsDateString()
  actualDepartureTime?: Date;

  @ApiPropertyOptional({ description: 'Location notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class TimeWindowDto {
  @ApiProperty({ description: 'Start time' })
  @IsDateString()
  start: Date;

  @ApiProperty({ description: 'End time' })
  @IsDateString()
  end: Date;
}

export class CargoDto {
  @ApiProperty({ description: 'Cargo description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Weight in kilograms' })
  @IsNumber()
  weightKg: number;

  @ApiPropertyOptional({ description: 'Volume in cubic meters' })
  @IsOptional()
  @IsNumber()
  volumeM3?: number;

  @ApiPropertyOptional({ description: 'Length in meters' })
  @IsOptional()
  @IsNumber()
  lengthM?: number;

  @ApiPropertyOptional({ description: 'Width in meters' })
  @IsOptional()
  @IsNumber()
  widthM?: number;

  @ApiPropertyOptional({ description: 'Height in meters' })
  @IsOptional()
  @IsNumber()
  heightM?: number;

  @ApiPropertyOptional({ description: 'Value currency' })
  @IsOptional()
  @IsString()
  valueCurrency?: string;

  @ApiPropertyOptional({ description: 'Value amount' })
  @IsOptional()
  @IsNumber()
  valueAmount?: number;

  @ApiPropertyOptional({
    description: 'Packaging type',
    enum: PackagingType,
  })
  @IsOptional()
  @IsEnum(PackagingType)
  packagingType?: PackagingType;

  @ApiPropertyOptional({
    description: 'Special requirements',
    enum: SpecialRequirements,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(SpecialRequirements, { each: true })
  specialRequirements?: SpecialRequirements[];
}

export class PricingDto {
  @ApiPropertyOptional({ description: 'Spot rate currency' })
  @IsOptional()
  @IsString()
  spotRateCurrency?: string;

  @ApiPropertyOptional({ description: 'Spot rate amount' })
  @IsOptional()
  @IsNumber()
  spotRateAmount?: number;

  @ApiPropertyOptional({ description: 'Fuel surcharge currency' })
  @IsOptional()
  @IsString()
  fuelSurchargeCurrency?: string;

  @ApiPropertyOptional({ description: 'Fuel surcharge amount' })
  @IsOptional()
  @IsNumber()
  fuelSurchargeAmount?: number;

  @ApiPropertyOptional({ description: 'Accessorial charges' })
  @IsOptional()
  @IsArray()
  accessorials?: Array<{
    code: string;
    description: string;
    amount: number;
  }>;
}

export class TruckRequirementsDto {
  @ApiPropertyOptional({ description: 'Minimum capacity weight' })
  @IsOptional()
  @IsNumber()
  minCapacityWeight?: number;

  @ApiPropertyOptional({ description: 'Minimum capacity volume' })
  @IsOptional()
  @IsNumber()
  minCapacityVolume?: number;

  @ApiPropertyOptional({ description: 'Required truck types' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredTruckTypes?: string[];

  @ApiPropertyOptional({ description: 'Required features' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredFeatures?: string[];

  @ApiPropertyOptional({ description: 'Maximum truck age' })
  @IsOptional()
  @IsNumber()
  maxTruckAge?: number;

  @ApiPropertyOptional({ description: 'Minimum driver experience' })
  @IsOptional()
  @IsNumber()
  minDriverExperience?: number;

  @ApiPropertyOptional({ description: 'Required certifications' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredCertifications?: string[];

  @ApiPropertyOptional({ description: 'Minimum insurance coverage' })
  @IsOptional()
  @IsNumber()
  minInsuranceCoverage?: number;
}

export class CarrierPreferencesDto {
  @ApiPropertyOptional({ description: 'Preferred carriers' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  preferredCarriers?: string[];

  @ApiPropertyOptional({ description: 'Excluded carriers' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  excludedCarriers?: string[];

  @ApiPropertyOptional({ description: 'Minimum carrier rating' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minCarrierRating?: number;

  @ApiPropertyOptional({ description: 'Maximum distance' })
  @IsOptional()
  @IsNumber()
  maxDistance?: number;

  @ApiPropertyOptional({ description: 'Maximum hours to availability' })
  @IsOptional()
  @IsNumber()
  maxHoursToAvailability?: number;
}

export class CostPreferencesDto {
  @ApiPropertyOptional({ description: 'Maximum budget' })
  @IsOptional()
  @IsNumber()
  maxBudget?: number;

  @ApiPropertyOptional({ description: 'Preferred payment terms' })
  @IsOptional()
  @IsString()
  preferredPaymentTerms?: string;

  @ApiPropertyOptional({ description: 'Requires insurance' })
  @IsOptional()
  @IsBoolean()
  requiresInsurance?: boolean;

  @ApiPropertyOptional({ description: 'Requires tracking' })
  @IsOptional()
  @IsBoolean()
  requiresTracking?: boolean;
}

export class CreateLoadDto {
  @ApiPropertyOptional({ description: 'Client reference number' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiProperty({ description: 'Load title' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Load description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Weight in kg', minimum: 100 })
  @IsNumber()
  @Min(100)
  weight: number;

  @ApiPropertyOptional({ description: 'Volume in cubic meters' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(1000) // 1000 cubic meters max
  volume?: number;

  @ApiProperty({
    description: 'Load type',
    enum: LoadType,
  })
  @IsEnum(LoadType)
  loadType: LoadType;

  @ApiProperty({
    description: 'Equipment type',
    enum: EquipmentType,
  })
  @IsEnum(EquipmentType)
  equipmentType: EquipmentType;

  @ApiProperty({
    description: 'Cargo type',
    enum: CargoType,
  })
  @IsEnum(CargoType)
  cargoType: CargoType;

  @ApiPropertyOptional({
    description: 'Urgency level',
    enum: UrgencyLevel,
    default: UrgencyLevel.NORMAL,
  })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyLevel?: UrgencyLevel;

  @ApiProperty({
    description: 'Visibility',
    enum: Visibility,
  })
  @IsEnum(Visibility)
  visibility: Visibility;

  @ApiProperty({ description: 'Units required', minimum: 1 })
  @IsNumber()
  @Min(1)
  @Max(100) // Maximum 100 units
  unitsRequired: number;

  @ApiProperty({ description: 'Load locations', type: [LoadLocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoadLocationDto)
  locations: LoadLocationDto[];

  @ApiPropertyOptional({ description: 'Origin address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  origin?: AddressDto;

  @ApiPropertyOptional({ description: 'Destination address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  destination?: AddressDto;

  @ApiPropertyOptional({ description: 'Pickup time window' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeWindowDto)
  pickupWindow?: TimeWindowDto;

  @ApiPropertyOptional({ description: 'Delivery time window' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeWindowDto)
  deliveryWindow?: TimeWindowDto;

  @ApiProperty({ description: 'Pickup date' })
  @IsDateString()
  pickupDate: Date;

  @ApiProperty({ description: 'Delivery date' })
  @IsDateString()
  deliveryDate: Date;

  @ApiProperty({ description: 'Load value' })
  @IsNumber()
  @Min(0)
  @Max(1000000000) // 1 billion max
  loadValue: number;

  @ApiPropertyOptional({ description: 'Offered price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000000) // 1 billion max
  offeredPrice?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Pricing structure' })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingDto)
  pricing?: PricingDto;

  @ApiProperty({
    description: 'Payment terms',
    enum: PaymentTerms,
  })
  @IsEnum(PaymentTerms)
  paymentTerms: PaymentTerms;

  @ApiPropertyOptional({
    description: 'Packaging type',
    enum: PackagingType,
    default: PackagingType.PALLETIZED,
  })
  @IsOptional()
  @IsEnum(PackagingType)
  packagingType?: PackagingType;

  @ApiPropertyOptional({ description: 'Invited carriers for private loads' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  invitedCarriers?: string[];

  @ApiPropertyOptional({ description: 'Is fragile cargo' })
  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @ApiPropertyOptional({ description: 'Is hazardous cargo' })
  @IsOptional()
  @IsBoolean()
  isHazardous?: boolean;

  @ApiPropertyOptional({ description: 'Requires refrigeration' })
  @IsOptional()
  @IsBoolean()
  requiresRefrigeration?: boolean;

  @ApiPropertyOptional({ description: 'Contact information' })
  @IsOptional()
  @IsObject()
  contactInfo?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Auto-match enabled', default: true })
  @IsOptional()
  @IsBoolean()
  autoMatchEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Matching criteria' })
  @IsOptional()
  @IsObject()
  matchingCriteria?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Truck requirements' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TruckRequirementsDto)
  truckRequirements?: TruckRequirementsDto;

  @ApiPropertyOptional({ description: 'Carrier preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CarrierPreferencesDto)
  carrierPreferences?: CarrierPreferencesDto;

  @ApiPropertyOptional({ description: 'Cost preferences' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CostPreferencesDto)
  costPreferences?: CostPreferencesDto;

  @ApiPropertyOptional({ description: 'Is stackable', default: false })
  @IsOptional()
  @IsBoolean()
  isStackable?: boolean;

  @ApiPropertyOptional({
    description: 'Requires humidity control',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresHumidityControl?: boolean;

  @ApiPropertyOptional({ description: 'Requires forklift', default: false })
  @IsOptional()
  @IsBoolean()
  requiresForklift?: boolean;

  @ApiPropertyOptional({ description: 'Requires crane', default: false })
  @IsOptional()
  @IsBoolean()
  requiresCrane?: boolean;

  @ApiPropertyOptional({ description: 'Requires loading dock', default: false })
  @IsOptional()
  @IsBoolean()
  requiresLoadingDock?: boolean;

  @ApiPropertyOptional({ description: 'Is time critical', default: false })
  @IsOptional()
  @IsBoolean()
  isTimeCritical?: boolean;

  @ApiPropertyOptional({
    description: 'Requires GPS monitoring',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresGpsMonitoring?: boolean;

  @ApiPropertyOptional({
    description: 'Requires temperature monitoring',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresTemperatureMonitoring?: boolean;

  @ApiPropertyOptional({
    description: 'Requires low clearance route',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresLowClearanceRoute?: boolean;

  @ApiPropertyOptional({
    description: 'Requires escort vehicle',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresEscortVehicle?: boolean;

  @ApiPropertyOptional({
    description: 'Requires pre-shipment inspection',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresPreShipmentInspection?: boolean;

  @ApiPropertyOptional({
    description: 'Requires delivery inspection',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresDeliveryInspection?: boolean;

  @ApiPropertyOptional({
    description: 'Requires photographic documentation',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresPhotographicDocumentation?: boolean;

  @ApiPropertyOptional({ description: 'Number of pieces' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000) // Maximum 10,000 pieces
  numberOfPieces?: number;

  @ApiPropertyOptional({ description: 'Number of pallets' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000) // Maximum 1,000 pallets
  numberOfPallets?: number;

  @ApiPropertyOptional({ description: 'Special handling instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialHandlingInstructions?: string;

  @ApiPropertyOptional({ description: 'Loading instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  loadingInstructions?: string;

  @ApiPropertyOptional({ description: 'Unloading instructions' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  unloadingInstructions?: string;

  @ApiPropertyOptional({ description: 'Emergency contact information' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  emergencyContactInfo?: string;

  @ApiPropertyOptional({ description: 'Metadata for additional properties' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
