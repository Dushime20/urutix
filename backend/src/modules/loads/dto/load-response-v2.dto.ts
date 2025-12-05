import { ApiProperty } from '@nestjs/swagger';
import { CargoTypeV2, LoadStatusV2, UrgencyLevelV2 } from './load-v2.dto';

export class LoadResponseV2Dto {
  @ApiProperty({ description: 'Load ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'Cargo owner ID' })
  cargoOwnerId: string;

  @ApiProperty({ description: 'Load title' })
  title: string;

  @ApiProperty({ description: 'Load description' })
  description: string;

  @ApiProperty({ description: 'Weight in kg' })
  weight: number;

  @ApiProperty({ description: 'Volume in cubic meters' })
  volume: number;

  @ApiProperty({ enum: CargoTypeV2, description: 'Type of cargo' })
  cargoType: CargoTypeV2;

  @ApiProperty({ description: 'Route locations array' })
  locations: any[];

  @ApiProperty({ description: 'Pickup date and time' })
  pickupDate: string;

  @ApiProperty({ description: 'Delivery date and time' })
  deliveryDate: string;

  @ApiProperty({ enum: LoadStatusV2, description: 'Load status' })
  status: LoadStatusV2;

  @ApiProperty({ description: 'Load value' })
  loadValue: number;

  @ApiProperty({ description: 'Offered price' })
  offeredPrice: number;

  @ApiProperty({ description: 'Currency code' })
  currencyCode: string;

  @ApiProperty({ description: 'Is cargo fragile' })
  isFragile: boolean;

  @ApiProperty({ description: 'Is cargo hazardous' })
  isHazardous: boolean;

  @ApiProperty({ description: 'Requires refrigeration' })
  requiresRefrigeration: boolean;

  @ApiProperty({ description: 'Contact information' })
  contactInfo: any;

  @ApiProperty({ description: 'Auto matching enabled' })
  autoMatchEnabled: boolean;

  @ApiProperty({ description: 'Matching criteria' })
  matchingCriteria: any;

  @ApiProperty({ description: 'Published at' })
  publishedAt: string;

  @ApiProperty({ description: 'Assigned truck ID' })
  assignedTruckId: string;

  @ApiProperty({ description: 'Rating', minimum: 0, maximum: 5 })
  rating: number;

  @ApiProperty({ description: 'View count' })
  viewCount: number;

  @ApiProperty({ description: 'Created at' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: string;

  @ApiProperty({ enum: UrgencyLevelV2, description: 'Urgency level' })
  urgencyLevel: UrgencyLevelV2;

  @ApiProperty({ description: 'Is time critical' })
  isTimeCritical: boolean;

  @ApiProperty({ description: 'Number of pieces' })
  numberOfPieces: number;

  @ApiProperty({ description: 'Number of pallets' })
  numberOfPallets: number;

  // Additional fields from database
  @ApiProperty({ description: 'Length in meters' })
  length: number;

  @ApiProperty({ description: 'Width in meters' })
  width: number;

  @ApiProperty({ description: 'Height in meters' })
  height: number;

  @ApiProperty({ description: 'Stackable height in meters' })
  stackableHeight: number;

  @ApiProperty({ description: 'Is stackable' })
  isStackable: boolean;

  @ApiProperty({ description: 'Minimum temperature in Celsius' })
  temperatureMin: number;

  @ApiProperty({ description: 'Maximum temperature in Celsius' })
  temperatureMax: number;

  @ApiProperty({ description: 'Requires humidity control' })
  requiresHumidityControl: boolean;

  @ApiProperty({ description: 'Requires forklift' })
  requiresForklift: boolean;

  @ApiProperty({ description: 'Requires crane' })
  requiresCrane: boolean;

  @ApiProperty({ description: 'Requires loading dock' })
  requiresLoadingDock: boolean;

  @ApiProperty({ description: 'Loading time estimate in hours' })
  loadingTimeEstimate: number;

  @ApiProperty({ description: 'Unloading time estimate in hours' })
  unloadingTimeEstimate: number;

  @ApiProperty({ description: 'Hazmat class' })
  hazmatClass: string;

  @ApiProperty({ description: 'Hazmat number' })
  hazmatNumber: string;

  @ApiProperty({ description: 'Maximum transit time in hours' })
  maxTransitTime: number;

  @ApiProperty({ description: 'Packaging type' })
  packagingType: string;

  @ApiProperty({ description: 'Requires GPS monitoring' })
  requiresGpsMonitoring: boolean;

  @ApiProperty({ description: 'Requires temperature monitoring' })
  requiresTemperatureMonitoring: boolean;

  @ApiProperty({ description: 'Insurance value' })
  insuranceValue: number;

  @ApiProperty({ description: 'Requires low clearance route' })
  requiresLowClearanceRoute: boolean;

  @ApiProperty({ description: 'Maximum clearance height in meters' })
  maxClearanceHeight: number;

  @ApiProperty({ description: 'Requires escort vehicle' })
  requiresEscortVehicle: boolean;

  @ApiProperty({ description: 'Special handling instructions' })
  specialHandlingInstructions: string;

  @ApiProperty({ description: 'Loading instructions' })
  loadingInstructions: string;

  @ApiProperty({ description: 'Unloading instructions' })
  unloadingInstructions: string;

  @ApiProperty({ description: 'Emergency contact information' })
  emergencyContactInfo: string;

  @ApiProperty({ description: 'Truck requirements' })
  truckRequirements: any;

  @ApiProperty({ description: 'Carrier preferences' })
  carrierPreferences: any;

  @ApiProperty({ description: 'Cost preferences' })
  costPreferences: any;

  @ApiProperty({ description: 'Requires pre-shipment inspection' })
  requiresPreShipmentInspection: boolean;

  @ApiProperty({ description: 'Requires delivery inspection' })
  requiresDeliveryInspection: boolean;

  @ApiProperty({ description: 'Requires photographic documentation' })
  requiresPhotographicDocumentation: boolean;

  @ApiProperty({ description: 'Metadata for additional properties', required: false })
  metadata?: Record<string, any>;
}
