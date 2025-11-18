import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('locations')
@Index(['tenantId', 'cityId', 'isActive'])
@Index(['locationType', 'locationCategory'])
@Index(['city', 'state', 'country'])
export class Location {
  // Add latitude and longitude getters for compatibility
  get latitude(): number | undefined {
    if (
      this.coordinates &&
      typeof this.coordinates === 'object' &&
      'coordinates' in this.coordinates
    ) {
      // GeoJSON Point: { type: 'Point', coordinates: [lng, lat] }
      // TypeORM may store as { coordinates: [lng, lat], ... }
      // Try both
      const coords =
        (this.coordinates as any).coordinates || (this.coordinates as any);
      if (Array.isArray(coords) && coords.length === 2) {
        return coords[1];
      }
    }
    return undefined;
  }

  get longitude(): number | undefined {
    if (
      this.coordinates &&
      typeof this.coordinates === 'object' &&
      'coordinates' in this.coordinates
    ) {
      const coords =
        (this.coordinates as any).coordinates || (this.coordinates as any);
      if (Array.isArray(coords) && coords.length === 2) {
        return coords[0];
      }
    }
    return undefined;
  }

  // Enhanced location information getters
  get fullAddress(): string {
    const parts = [
      this.address,
      this.city,
      this.state,
      this.postalCode,
      this.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  get locationIdentifier(): string {
    return `${this.name} - ${this.city}, ${this.state}`;
  }

  get isOperational(): boolean {
    return this.isActive && this.locationType !== 'INACTIVE';
  }

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column()
  name: string;

  @Column('text')
  address: string;

  @Column({ nullable: true })
  cityId?: number;

  @Column({ nullable: true })
  postalCode?: string;

  // Enhanced location fields
  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  region?: string;

  @Column({ nullable: true })
  district?: string;

  @Column({ nullable: true })
  neighborhood?: string;

  @Column({ nullable: true })
  landmark?: string;

  @Column({ nullable: true })
  locationCategory?: string; // INDUSTRIAL, COMMERCIAL, RESIDENTIAL, WAREHOUSE, PORT, AIRPORT, etc.

  @Column({ nullable: true })
  locationSubCategory?: string; // FACTORY, OFFICE, SHOPPING_CENTER, etc.

  @Column({ nullable: true })
  businessHours?: string; // "Mon-Fri 8AM-6PM, Sat 9AM-3PM"

  @Column({ nullable: true })
  timezone?: string; // "Africa/Nairobi"

  @Column({ nullable: true })
  accessType?: string; // "TRUCK_ACCESSIBLE", "FORKLIFT_REQUIRED", "CRANE_REQUIRED", "DOCKS_AVAILABLE"

  @Column({ nullable: true })
  parkingAvailable?: boolean;

  @Column({ nullable: true })
  securityLevel?: string; // "PUBLIC", "RESTRICTED", "SECURED", "HIGH_SECURITY"

  @Column({ nullable: true })
  loadingDockCount?: number;

  @Column({ nullable: true })
  maxTruckHeight?: number; // in meters

  @Column({ nullable: true })
  maxTruckWeight?: number; // in tons

  @Column({ nullable: true })
  specialInstructions?: string;

  @Column('geometry', {
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  coordinates: object;

  @Column({ default: 'GENERAL' })
  locationType: string;

  @Column('jsonb', { default: {} })
  contactInfo: Record<string, any>;

  @Column('jsonb', { default: {} })
  operatingHours: Record<string, any>;

  @Column('jsonb', { default: {} })
  facilities: Record<string, any>;

  @Column({ nullable: true })
  accessInstructions?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
