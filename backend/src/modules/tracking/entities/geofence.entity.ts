import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum GeofenceType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  RESTRICTED = 'RESTRICTED',
  CUSTOM = 'CUSTOM',
}

@Entity('geofences')
@Index(['type', 'isActive'])
@Index(['latitude', 'longitude'])
export class Geofence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: GeofenceType,
    default: GeofenceType.CUSTOM,
  })
  type: GeofenceType;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column('decimal', { precision: 8, scale: 2 })
  radius: number; // Radius in meters

  @Column('jsonb', { nullable: true })
  polygon?: Array<{ lat: number; lng: number }>; // For complex shapes

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  settings: {
    alertOnEntry?: boolean;
    alertOnExit?: boolean;
    speedLimit?: number;
    restrictedHours?: { start: string; end: string };
  };

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
