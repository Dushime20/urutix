import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Load } from '../../../entities/load.entity';

export enum MultiModalStatus {
  PLANNING = 'PLANNING',
  BOOKED = 'BOOKED',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED_AT_HUB = 'ARRIVED_AT_HUB',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
}

@Entity('multi_modal_shipments')
export class MultiModalShipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  loadId: string;

  @Column({ unique: true })
  shipmentNumber: string;

  @Column({
    type: 'enum',
    enum: MultiModalStatus,
    default: MultiModalStatus.PLANNING,
  })
  status: MultiModalStatus;

  @Column('timestamp with time zone', { nullable: true })
  estimatedArrival?: Date;

  @Column('timestamp with time zone', { nullable: true })
  actualArrival?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Load)
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @OneToMany(() => MultiModalLeg, (leg) => leg.shipment)
  legs: MultiModalLeg[];
}

export enum TransportMode {
  TRUCK = 'TRUCK',
  RAIL = 'RAIL',
  SEA = 'SEA',
  AIR = 'AIR',
}

export enum LegStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
}

@Entity('multi_modal_legs')
export class MultiModalLeg {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  shipmentId: string;

  @Column({
    type: 'enum',
    enum: TransportMode,
  })
  mode: TransportMode;

  @Column({
    type: 'enum',
    enum: LegStatus,
    default: LegStatus.PENDING,
  })
  status: LegStatus;

  @Column({ nullable: true })
  carrierName?: string;

  @Column({ nullable: true })
  vesselName?: string; // For Sea

  @Column({ nullable: true })
  voyageNumber?: string; // For Sea/Air

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ nullable: true })
  originHub?: string;

  @Column({ nullable: true })
  destinationHub?: string;

  @Column('timestamp with time zone', { nullable: true })
  scheduledDeparture?: Date;

  @Column('timestamp with time zone', { nullable: true })
  scheduledArrival?: Date;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  currentLat?: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  currentLng?: number;

  @ManyToOne(() => MultiModalShipment, (shipment) => shipment.legs)
  @JoinColumn({ name: 'shipmentId' })
  shipment: MultiModalShipment;

  @Column({ type: 'int', default: 0 })
  sequence: number;
}
