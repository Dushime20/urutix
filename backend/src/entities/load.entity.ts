import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Location } from './location.entity';
import { Trip } from './trip.entity';
import { Bid } from './bid.entity';
import { Auction } from './auction.entity';
import { Truck } from './truck.entity';

// LoadLocation interface for JSON structure
export interface LoadLocation {
  id: string;
  type: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST';
  sequence: number;
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
  scheduledDate: Date;
  estimatedTime: number; // minutes
  requirements?: {
    requiresForklift?: boolean;
    requiresCrane?: boolean;
    requiresLoadingDock?: boolean;
    hazmatCertified?: boolean;
    temperatureControlled?: boolean;
    securityClearance?: string;
  };
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  actualArrivalTime?: Date;
  actualDepartureTime?: Date;
  notes?: string;
}

export enum LoadStatus {
  DRAFT = 'DRAFT',
  CREATED = 'CREATED',
  PUBLISHED = 'PUBLISHED',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  ASSIGNED = 'ASSIGNED',
  LOADED = 'LOADED', // Driver has accepted and loaded the cargo
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum LoadType {
  FTL = 'FTL',
  LTL = 'LTL',
  REEFER = 'REEFER',
  FLATBED = 'FLATBED',
  TANKER = 'TANKER',
  INTERMODAL = 'INTERMODAL',
  OTHER = 'OTHER',
}

export enum EquipmentType {
  DRY_VAN = 'DRY_VAN',
  REEFER = 'REEFER',
  FLATBED = 'FLATBED',
  TANKER = 'TANKER',
  CONTAINER = 'CONTAINER',
  OTHER = 'OTHER',
}

export enum CargoType {
  GENERAL = 'GENERAL',
  FRAGILE = 'FRAGILE',
  HAZARDOUS = 'HAZARDOUS',
  REFRIGERATED = 'REFRIGERATED',
  LIQUID = 'LIQUID',
  OVERSIZED = 'OVERSIZED',
  VALUABLE = 'VALUABLE',
}

export enum UrgencyLevel {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum Visibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum PaymentTerms {
  PREPAID = 'Prepaid',
  ON_DELIVERY = 'OnDelivery',
  NET_15 = 'Net15',
  NET_30 = 'Net30',
  NET_45 = 'Net45',
  NET_60 = 'Net60',
}

export enum PackagingType {
  PALLETIZED = 'Palletized',
  LOOSE = 'Loose',
  CONTAINERIZED = 'Containerized',
  CRATE = 'Crate',
  DRUM = 'Drum',
  OTHER = 'Other',
}

export enum SpecialRequirements {
  TEMPERATURE_CONTROL = 'TemperatureControl',
  HAZMAT = 'Hazmat',
  FRAGILE = 'Fragile',
  OVERSIZE = 'Oversize',
  HIGH_VALUE = 'HighValue',
}

// Pricing structure interface
export interface Pricing {
  spotRateCurrency?: string;
  spotRateAmount?: number;
  fuelSurchargeCurrency?: string;
  fuelSurchargeAmount?: number;
  accessorials?: Array<{
    code: string;
    description: string;
    amount: number;
  }>;
}

// Address interface for origin/destination
export interface Address {
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  lat?: number;
  lng?: number;
}

// Time window interface
export interface TimeWindow {
  start: Date;
  end: Date;
}

// Cargo interface
export interface Cargo {
  description: string;
  weightKg: number;
  volumeM3?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  valueCurrency?: string;
  valueAmount?: number;
  packagingType?: PackagingType;
  specialRequirements?: SpecialRequirements[];
}

@Entity('loads')
@Index(['tenantId', 'status', 'cargoOwnerId'])
@Index(['status', 'pickupDate', 'deliveryDate'])
@Index(['cargoType', 'urgencyLevel'])
@Index(['tenantId', 'status'])
@Index(['cargoOwnerId'])
@Index(['reference'])
@Index(['visibility'])
@Index(['loadType'])
@Index(['equipmentType'])
export class Load {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  cargoOwnerId: string;

  @Column('uuid', { nullable: true })
  receiverId?: string; // Receiver assigned to this cargo

  @Column('uuid', { nullable: true })
  brokerId?: string; // Broker who created/manages this load

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  brokerCommissionRate?: number; // Commission rate for this specific load (e.g., 5.00 for 5%)

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  brokerCommissionAmount?: number; // Calculated commission amount

  @Column({ nullable: true })
  reference?: string; // Client reference number

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  weight: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  volume?: number;

  @Column({
    type: 'enum',
    enum: LoadType,
    default: LoadType.FTL,
  })
  loadType: LoadType;

  @Column({
    type: 'enum',
    enum: EquipmentType,
    default: EquipmentType.DRY_VAN,
  })
  equipmentType: EquipmentType;

  @Column({
    type: 'enum',
    enum: CargoType,
    default: CargoType.GENERAL,
  })
  cargoType: CargoType;

  @Column({
    type: 'enum',
    enum: Visibility,
    default: Visibility.PUBLIC,
  })
  visibility: Visibility;

  @Column('int', { default: 1 })
  unitsRequired: number;

  @Column('jsonb', { default: [] })
  locations: LoadLocation[];

  // Origin and destination as separate fields for easier querying
  @Column('jsonb', { nullable: true })
  origin?: Address;

  @Column('jsonb', { nullable: true })
  destination?: Address;

  @Column('jsonb', { nullable: true })
  pickupWindow?: TimeWindow;

  @Column('jsonb', { nullable: true })
  deliveryWindow?: TimeWindow;

  @Column('timestamp with time zone', { nullable: true })
  pickupDate: Date;

  @Column('timestamp with time zone', { nullable: true })
  deliveryDate: Date;

  @Column({
    type: 'enum',
    enum: LoadStatus,
    default: LoadStatus.DRAFT,
  })
  status: LoadStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  loadValue: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  offeredPrice?: number;

  @Column({ length: 3, default: 'USD' })
  currencyCode: string;

  // Pricing structure
  @Column('jsonb', { nullable: true })
  pricing?: Pricing;

  @Column({
    type: 'enum',
    enum: PaymentTerms,
    default: PaymentTerms.NET_30,
  })
  paymentTerms: PaymentTerms;

  // Invited carriers for private loads
  @Column('simple-array', { nullable: true })
  invitedCarriers?: string[];

  @Column({ default: false })
  isFragile: boolean;

  @Column({ default: false })
  isHazardous: boolean;

  @Column({ default: false })
  requiresRefrigeration: boolean;

  @Column('jsonb', { default: {} })
  contactInfo: Record<string, any>;

  @Column({ default: true })
  autoMatchEnabled: boolean;

  @Column('jsonb', { default: {} })
  matchingCriteria: Record<string, any>;

  @Column({ nullable: true })
  publishedAt?: Date;

  @Column('uuid', { nullable: true })
  assignedTruckId?: string;

  @Column('uuid', { nullable: true })
  assignedCarrierId?: string;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column('int', { default: 0 })
  viewCount: number;

  // Enhanced cargo fields - Dimensional specifications
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  length?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  width?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  height?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  stackableHeight?: number;

  @Column({ default: false })
  isStackable: boolean;

  // Temperature & Environmental requirements
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  temperatureMin?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  temperatureMax?: number;

  @Column({ default: false })
  requiresHumidityControl: boolean;

  // Loading & Unloading requirements
  @Column({ default: false })
  requiresForklift: boolean;

  @Column({ default: false })
  requiresCrane: boolean;

  @Column({ default: false })
  requiresLoadingDock: boolean;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  loadingTimeEstimate?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  unloadingTimeEstimate?: number;

  // Hazmat & Regulatory compliance
  @Column({ length: 50, nullable: true })
  hazmatClass?: string;

  @Column({ length: 20, nullable: true })
  hazmatNumber?: string;

  // Urgency & Time sensitivity
  @Column({
    type: 'enum',
    enum: UrgencyLevel,
    default: UrgencyLevel.NORMAL,
  })
  urgencyLevel: UrgencyLevel;

  @Column({ default: false })
  isTimeCritical: boolean;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maxTransitTime?: number;

  // Packaging & Handling details
  @Column({
    type: 'enum',
    enum: PackagingType,
    default: PackagingType.PALLETIZED,
  })
  packagingType: PackagingType;

  @Column({ default: 0 })
  numberOfPieces: number;

  @Column({ default: 0 })
  numberOfPallets: number;

  // Security & Insurance requirements
  @Column({ default: false })
  requiresGpsMonitoring: boolean;

  @Column({ default: false })
  requiresTemperatureMonitoring: boolean;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  insuranceValue?: number;

  // Route & Access requirements
  @Column({ default: false })
  requiresLowClearanceRoute: boolean;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maxClearanceHeight?: number;

  @Column({ default: false })
  requiresEscortVehicle: boolean;

  // Special handling instructions
  @Column('text', { nullable: true })
  specialHandlingInstructions?: string;

  @Column('text', { nullable: true })
  loadingInstructions?: string;

  @Column('text', { nullable: true })
  unloadingInstructions?: string;

  @Column('text', { nullable: true })
  emergencyContactInfo?: string;

  // Advanced matching criteria
  @Column('jsonb', { default: {} })
  truckRequirements: {
    minCapacityWeight?: number;
    minCapacityVolume?: number;
    requiredTruckTypes?: string[];
    requiredFeatures?: string[];
    maxTruckAge?: number;
    minDriverExperience?: number;
    requiredCertifications?: string[];
    minInsuranceCoverage?: number;
  };

  @Column('jsonb', { default: {} })
  carrierPreferences: {
    preferredCarriers?: string[];
    excludedCarriers?: string[];
    minCarrierRating?: number;
    maxDistance?: number;
    maxHoursToAvailability?: number;
  };

  @Column('jsonb', { default: {} })
  costPreferences: {
    maxBudget?: number;
    preferredPaymentTerms?: string;
    requiresInsurance?: boolean;
    requiresTracking?: boolean;
  };

  // Quality & Inspection requirements
  @Column({ default: false })
  requiresPreShipmentInspection: boolean;

  @Column({ default: false })
  requiresDeliveryInspection: boolean;

  @Column({ default: false })
  requiresPhotographicDocumentation: boolean;

  // Metadata for additional properties
  @Column('jsonb', { default: {} })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne('User', 'loads')
  @JoinColumn({ name: 'cargoOwnerId' })
  cargoOwner: User;

  @ManyToOne('User', 'assignedCargos')
  @JoinColumn({ name: 'receiverId' })
  receiver?: User;

  @ManyToOne(() => User, (user) => user.brokerLoads, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brokerId' })
  broker?: User;

  @ManyToOne(() => Truck, { nullable: true })
  @JoinColumn({ name: 'assignedTruckId' })
  assignedTruck?: Truck;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedCarrierId' }) // Re-using carrier id for driver in some contexts, or add assignedDriverId
  assignedDriver?: User;

  @OneToMany('Trip', 'load')
  trips: Trip[];

  @OneToMany('Bid', 'load')
  bids: Bid[];

  @OneToOne('Auction', 'load')
  auction: Auction;

  // Helper methods for location management
  get pickupLocation(): LoadLocation | undefined {
    return this.locations?.find((loc) => loc.type === 'PICKUP');
  }

  get deliveryLocation(): LoadLocation | undefined {
    return this.locations?.find((loc) => loc.type === 'DELIVERY');
  }

  get pickupDateFromLocations(): Date | undefined {
    return this.pickupLocation?.scheduledDate;
  }

  get deliveryDateFromLocations(): Date | undefined {
    return this.deliveryLocation?.scheduledDate;
  }

  // Sync dates with locations when locations change
  syncDatesWithLocations(): void {
    if (this.pickupLocation) {
      this.pickupDate = this.pickupLocation.scheduledDate;
    }
    if (this.deliveryLocation) {
      this.deliveryDate = this.deliveryLocation.scheduledDate;
    }
  }

  getRouteLocations(): LoadLocation[] {
    return this.locations?.sort((a, b) => a.sequence - b.sequence) || [];
  }

  addLocation(location: LoadLocation): void {
    if (!this.locations) {
      this.locations = [];
    }
    this.locations.push(location);
    // Re-sort by sequence
    this.locations.sort((a, b) => a.sequence - b.sequence);
    // Sync dates with locations
    this.syncDatesWithLocations();
  }

  updateLocation(locationId: string, updates: Partial<LoadLocation>): boolean {
    const location = this.locations?.find((loc) => loc.id === locationId);
    if (location) {
      Object.assign(location, updates);
      return true;
    }
    return false;
  }

  removeLocation(locationId: string): boolean {
    const index = this.locations?.findIndex((loc) => loc.id === locationId);
    if (index !== undefined && index >= 0) {
      this.locations.splice(index, 1);
      return true;
    }
    return false;
  }

  // Workflow methods
  canPublish(): boolean {
    return (
      this.status === LoadStatus.DRAFT &&
      !!this.pickupLocation &&
      !!this.deliveryLocation &&
      !!this.pickupDate &&
      !!this.deliveryDate
    );
  }

  canAssign(): boolean {
    return (
      this.status === LoadStatus.CREATED ||
      this.status === LoadStatus.PUBLISHED ||
      this.status === LoadStatus.PENDING_CONFIRMATION
    );
  }

  canStart(): boolean {
    return (
      this.status === LoadStatus.ASSIGNED &&
      !!this.assignedTruckId &&
      !!this.assignedCarrierId
    );
  }

  canDeliver(): boolean {
    return this.status === LoadStatus.IN_TRANSIT;
  }

  canCancel(): boolean {
    return [
      LoadStatus.DRAFT,
      LoadStatus.CREATED,
      LoadStatus.PUBLISHED,
      LoadStatus.PENDING_CONFIRMATION,
    ].includes(this.status);
  }

  canRepost(): boolean {
    return this.status === LoadStatus.CANCELLED;
  }
}
