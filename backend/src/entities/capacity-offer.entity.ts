import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CapacityOfferStatus {
  OPEN = 'OPEN',
  PARTIALLY_BOOKED = 'PARTIALLY_BOOKED',
  FULL = 'FULL',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum CapacityBookingMode {
  INSTANT = 'INSTANT',
  REQUEST = 'REQUEST',
}

export interface CapacityPlace {
  name: string;
  city?: string;
  country?: string;
  countryCode?: string;
  address?: string;
  lat: number;
  lng: number;
}

@Entity('capacity_offers')
@Index(['tenantId', 'ownerId', 'createdAt'])
@Index(['tenantId', 'status', 'departureAt'])
@Index(['truckId', 'status'])
export class CapacityOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  ownerId: string;

  @Column('uuid')
  truckId: string;

  @Column('uuid', { nullable: true })
  tripId?: string | null;

  @Column('jsonb')
  origin: CapacityPlace;

  @Column('jsonb')
  destination: CapacityPlace;

  @Column({ type: 'timestamptz' })
  departureAt: Date;

  @Column({ type: 'timestamptz' })
  arrivalAt: Date;

  @Column('decimal', { precision: 12, scale: 2 })
  nameplateWeightKg: number;

  @Column('decimal', { precision: 12, scale: 2 })
  nameplateVolumeM3: number;

  @Column('decimal', { precision: 12, scale: 2 })
  listedWeightKg: number;

  @Column('decimal', { precision: 12, scale: 2 })
  listedVolumeM3: number;

  @Column('decimal', { precision: 12, scale: 2 })
  remainingWeightKg: number;

  @Column('decimal', { precision: 12, scale: 2 })
  remainingVolumeM3: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  allocatedWeightKg: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  allocatedVolumeM3: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  floorPrice: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  pricePerTonne?: number | null;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  pricePerM3?: number | null;

  @Column({ length: 3, default: 'USD' })
  currencyCode: string;

  @Column('decimal', { precision: 5, scale: 2, default: 8 })
  commissionRate: number;

  @Column('jsonb', { default: ['GENERAL'] })
  compatibleCargoTypes: string[];

  @Column({ default: true })
  generalCargoOnly: boolean;

  @Column({ default: true })
  allowMixing: boolean;

  @Column({ length: 16, default: CapacityBookingMode.INSTANT })
  bookingMode: CapacityBookingMode;

  @Column({ length: 24, default: CapacityOfferStatus.OPEN })
  status: CapacityOfferStatus;

  @Column('text', { nullable: true })
  notes?: string | null;

  @Column('jsonb', { default: [] })
  loadIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
