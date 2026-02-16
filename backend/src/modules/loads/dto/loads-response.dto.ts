import { ApiProperty } from '@nestjs/swagger';
import {
  Load,
  LoadStatus,
  CargoType,
  UrgencyLevel,
} from '../../../entities/load.entity';
import { EnrichedLocation } from '../../locations/osm-location-enrichment.service';

export class LoadResponseDto {
  @ApiProperty({
    description: 'Load ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Load title',
    example: 'Electronics Shipment to NYC',
  })
  title: string;

  @ApiProperty({
    description: 'Load description',
    example: 'Fragile electronics requiring careful handling',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Load weight in kg',
    example: 1500,
  })
  weight: number;

  @ApiProperty({
    description: 'Load volume in cubic meters',
    example: 25.5,
    required: false,
  })
  volume?: number;

  @ApiProperty({
    description: 'Cargo type',
    enum: CargoType,
    example: CargoType.FRAGILE,
  })
  cargoType: CargoType;

  @ApiProperty({
    description: 'Load status',
    enum: LoadStatus,
    example: LoadStatus.DRAFT,
  })
  status: LoadStatus;

  @ApiProperty({
    description: 'Load value in USD',
    example: 25000,
  })
  loadValue: number;

  @ApiProperty({
    description: 'Offered price for transportation',
    example: 3500,
    required: false,
  })
  offeredPrice?: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currencyCode: string;

  @ApiProperty({
    description: 'Pickup date',
    example: '2024-01-15T10:00:00Z',
  })
  pickupDate: Date;

  @ApiProperty({
    description: 'Delivery date',
    example: '2024-01-17T14:00:00Z',
  })
  deliveryDate: Date;

  @ApiProperty({
    description: 'Urgency level',
    enum: UrgencyLevel,
    example: UrgencyLevel.HIGH,
  })
  urgencyLevel: UrgencyLevel;

  @ApiProperty({
    description: 'Whether cargo is time critical',
    example: true,
  })
  isTimeCritical: boolean;

  @ApiProperty({
    description: 'Whether cargo is fragile',
    example: true,
  })
  isFragile: boolean;

  @ApiProperty({
    description: 'Whether cargo is hazardous',
    example: false,
  })
  isHazardous: boolean;

  @ApiProperty({
    description: 'Whether cargo requires refrigeration',
    example: false,
  })
  requiresRefrigeration: boolean;

  @ApiProperty({
    description: 'Cargo length in meters',
    example: 2.5,
    required: false,
  })
  length?: number;

  @ApiProperty({
    description: 'Cargo width in meters',
    example: 1.8,
    required: false,
  })
  width?: number;

  @ApiProperty({
    description: 'Cargo height in meters',
    example: 1.2,
    required: false,
  })
  height?: number;

  @ApiProperty({
    description: 'Requires GPS monitoring',
    example: true,
    required: false,
  })
  requiresGpsMonitoring?: boolean;

  @ApiProperty({
    description: 'Requires temperature monitoring',
    example: false,
    required: false,
  })
  requiresTemperatureMonitoring?: boolean;

  @ApiProperty({
    description: 'Requires low clearance route',
    example: false,
    required: false,
  })
  requiresLowClearanceRoute?: boolean;

  @ApiProperty({
    description: 'Requires escort vehicle',
    example: false,
    required: false,
  })
  requiresEscortVehicle?: boolean;

  @ApiProperty({
    description: 'Requires pre-shipment inspection',
    example: false,
    required: false,
  })
  requiresPreShipmentInspection?: boolean;

  @ApiProperty({
    description: 'Requires delivery inspection',
    example: false,
    required: false,
  })
  requiresDeliveryInspection?: boolean;

  @ApiProperty({
    description: 'Requires photographic documentation',
    example: false,
    required: false,
  })
  requiresPhotographicDocumentation?: boolean;

  @ApiProperty({
    description: 'Loading instructions',
    example: 'Use forklift, handle with care',
    required: false,
  })
  loadingInstructions?: string;

  @ApiProperty({
    description: 'Unloading instructions',
    example: 'Dock door 3, check temperature',
    required: false,
  })
  unloadingInstructions?: string;

  @ApiProperty({
    description: 'Insurance value',
    example: 50000,
    required: false,
  })
  insuranceValue?: number;

  @ApiProperty({
    description: 'Emergency contact information',
    example: 'John Doe: +1234567890',
    required: false,
  })
  emergencyContactInfo?: string;

  @ApiProperty({
    description: 'Maximum clearance height in meters',
    example: 4.2,
    required: false,
  })
  maxClearanceHeight?: number;

  @ApiProperty({
    description: 'Published date',
    example: '2024-01-15T10:00:00Z',
    required: false,
  })
  publishedAt?: Date;

  @ApiProperty({
    description: 'Created date',
    example: '2024-01-15T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated date',
    example: '2024-01-15T10:00:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Cargo owner information',
    required: false,
  })
  cargoOwner?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
  };

  @ApiProperty({
    description: 'Broker information',
    required: false,
  })
  broker?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
  };

  @ApiProperty({
    description: 'Broker ID',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  brokerId?: string;

  @ApiProperty({
    description: 'Broker commission rate (percentage)',
    required: false,
    example: 5.0,
  })
  brokerCommissionRate?: number;

  @ApiProperty({
    description: 'Broker commission amount',
    required: false,
    example: 1250.0,
  })
  brokerCommissionAmount?: number;

  @ApiProperty({
    description: 'Receiver ID',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  receiverId?: string;

  @ApiProperty({
    description: 'Receiver information',
    required: false,
  })
  receiver?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };

  @ApiProperty({
    description: 'Pickup location information',
    required: false,
  })
  pickupLocation?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      type: string;
      coordinates: number[];
    };
  };

  @ApiProperty({
    description: 'Delivery location information',
    required: false,
  })
  deliveryLocation?: {
    id: string;
    name: string;
    address: string;
    coordinates: {
      type: string;
      coordinates: number[];
    };
  };

  @ApiProperty({
    description: 'Enriched location data with additional intelligence',
    required: false,
    type: 'array',
  })
  enrichedLocations?: EnrichedLocation[];
}

export class LoadsPaginatedResponseDto {
  @ApiProperty({
    description: 'Array of loads',
    type: [LoadResponseDto],
  })
  items: LoadResponseDto[];

  @ApiProperty({
    description: 'Total number of loads',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrev: boolean;
}

export class LoadsStatisticsDto {
  @ApiProperty({
    description: 'Total number of loads',
    example: 100,
  })
  totalLoads: number;

  @ApiProperty({
    description: 'Loads by status',
    example: {
      draft: 20,
      published: 30,
      assigned: 15,
      inTransit: 25,
      delivered: 10,
    },
  })
  byStatus: {
    draft: number;
    published: number;
    assigned: number;
    inTransit: number;
    delivered: number;
  };

  @ApiProperty({
    description: 'Total value of all loads',
    example: 2500000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Average value per load',
    example: 25000,
  })
  averageValue: number;
}
