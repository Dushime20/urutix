export enum RouteType {
  HIGHWAY = 'highway',
  CITY = 'city',
  RURAL = 'rural',
  MIXED = 'mixed',
}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RouteTruck } from './route-truck.entity';

export enum RouteStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Entity('routes')
@Index(['tenantId', 'name'], { unique: true, where: 'deleted_at IS NULL' })
@Index(['tenantId', 'status', 'isActive'])
@Index(['routeType', 'distance'])
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  origin: string;

  @Column({ length: 100 })
  destination: string;

  // ── Exact geo-coordinates for origin ──────────────────────────────────────
  @Column('decimal', { precision: 10, scale: 7, nullable: true, name: 'origin_lat' })
  originLat?: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true, name: 'origin_lng' })
  originLng?: number;

  @Column({ length: 255, nullable: true, name: 'origin_address' })
  originAddress?: string;

  // ── Exact geo-coordinates for destination ─────────────────────────────────
  @Column('decimal', { precision: 10, scale: 7, nullable: true, name: 'destination_lat' })
  destinationLat?: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true, name: 'destination_lng' })
  destinationLng?: number;

  @Column({ length: 255, nullable: true, name: 'destination_address' })
  destinationAddress?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  distance: number; // in kilometers

  @Column('integer')
  estimatedTime: number; // in hours

  @Column({
    type: 'enum',
    enum: RouteType,
    default: RouteType.HIGHWAY,
  })
  routeType: RouteType;

  @Column({
    type: 'enum',
    enum: RouteStatus,
    default: RouteStatus.ACTIVE,
  })
  status: RouteStatus;

  @Column('jsonb', { default: [] })
  assignedTrucks: string[];

  @Column('jsonb', { default: [] })
  assignedDrivers: string[];

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'uuid', nullable: true, name: 'created_by' })
  createdBy?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @OneToMany(() => RouteTruck, (routeTruck) => routeTruck.route)
  routeTrucks: RouteTruck[];
}
