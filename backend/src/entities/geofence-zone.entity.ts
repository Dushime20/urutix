import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GeofenceZoneType {
  DELIVERY_ZONE = 'DELIVERY_ZONE',
  RESTRICTED = 'RESTRICTED',
  CUSTOMER_SITE = 'CUSTOMER_SITE',
  DEPOT = 'DEPOT',
  CHECKPOINT = 'CHECKPOINT',
}

@Entity('geofence_zones')
@Index(['tenantId', 'isActive'])
export class GeofenceZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: GeofenceZoneType,
    default: GeofenceZoneType.DELIVERY_ZONE,
  })
  type: GeofenceZoneType;

  // Polygon stored as JSONB array of {lat, lng} points
  @Column('jsonb')
  polygon: Array<{ lat: number; lng: number }>;

  // Center point for quick radius pre-filter
  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  centerLat?: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  centerLng?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  radiusMeters?: number;

  @Column({ default: true })
  alertOnEnter: boolean;

  @Column({ default: true })
  alertOnExit: boolean;

  @Column('uuid', { nullable: true })
  linkedLoadId?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
