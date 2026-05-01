import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';
import { Load } from './load.entity';
import * as crypto from 'crypto';

@Entity('cargo_owner_analytics')
@Index(['tenantId', 'cargoOwnerId'])
@Index(['tenantId', 'bookingDate'])
@Index(['routeHash'])
@Index(['carrierId'])
@Index(['season'])
export class CargoOwnerAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'cargo_owner_id' })
  cargoOwnerId: string;

  @Column({ type: 'uuid', name: 'load_id' })
  @Index()
  loadId: string;

  // Route Analysis
  @Column({ type: 'varchar', length: 64, name: 'route_hash', nullable: true })
  routeHash?: string;

  @Column({ type: 'varchar', length: 100, name: 'origin_city', nullable: true })
  originCity?: string;

  @Column({ type: 'varchar', length: 100, name: 'destination_city', nullable: true })
  destinationCity?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'distance_km', nullable: true })
  distanceKm?: number;

  // Cargo Details
  @Column({ type: 'varchar', length: 50, name: 'cargo_type', nullable: true })
  cargoType?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cargo_weight_kg', nullable: true })
  cargoWeightKg?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cargo_volume_m3', nullable: true })
  cargoVolumeM3?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cargo_value', nullable: true })
  cargoValue?: number;

  // Financial Analysis
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_cost', nullable: true })
  totalCost?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, name: 'cost_per_km', nullable: true })
  costPerKm?: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, name: 'cost_per_kg', nullable: true })
  costPerKg?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'profit_margin', nullable: true })
  profitMargin?: number;

  // Performance Metrics
  @Column({ type: 'timestamptz', name: 'booking_date', nullable: true })
  @Index()
  bookingDate?: Date;

  @Column({ type: 'timestamptz', name: 'pickup_date', nullable: true })
  pickupDate?: Date;

  @Column({ type: 'timestamptz', name: 'delivery_date', nullable: true })
  deliveryDate?: Date;

  @Column({ type: 'int', name: 'planned_transit_hours', nullable: true })
  plannedTransitHours?: number;

  @Column({ type: 'int', name: 'actual_transit_hours', nullable: true })
  actualTransitHours?: number;

  @Column({ type: 'int', name: 'delay_hours', nullable: true })
  delayHours?: number;

  @Column({ type: 'boolean', name: 'on_time_delivery', default: false })
  onTimeDelivery: boolean;

  @Column({ type: 'boolean', name: 'damage_reported', default: false })
  damageReported: boolean;

  // Carrier Performance
  @Column({ type: 'uuid', name: 'carrier_id', nullable: true })
  carrierId?: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, name: 'carrier_rating', nullable: true })
  carrierRating?: number;

  // Market Context
  @Column({ type: 'varchar', length: 20, nullable: true })
  season?: string;

  @Column({ type: 'jsonb', name: 'market_conditions', default: {} })
  marketConditions: Record<string, any>;

  // Metadata
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cargo_owner_id' })
  cargoOwner: User;

  @ManyToOne(() => Load, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'load_id' })
  load: Load;

  // Hooks to automatically generate route hash
  @BeforeInsert()
  @BeforeUpdate()
  generateRouteHash() {
    if (this.originCity && this.destinationCity) {
      const routeString = `${this.originCity}-${this.destinationCity}`;
      this.routeHash = crypto.createHash('md5').update(routeString).digest('hex');
    }
  }

  // Virtual properties
  get isDelayed(): boolean {
    return this.delayHours !== null && this.delayHours > 0;
  }

  get transitTimeVariance(): number | null {
    if (this.plannedTransitHours === null || this.actualTransitHours === null) {
      return null;
    }
    return this.actualTransitHours - this.plannedTransitHours;
  }

  get transitTimeVariancePercentage(): number | null {
    if (this.plannedTransitHours === null || this.actualTransitHours === null || this.plannedTransitHours === 0) {
      return null;
    }
    return ((this.actualTransitHours - this.plannedTransitHours) / this.plannedTransitHours) * 100;
  }

  get routeKey(): string {
    return `${this.originCity || 'unknown'}-${this.destinationCity || 'unknown'}`;
  }

  get performanceScore(): number {
    let score = 100;
    
    // Deduct points for delays
    if (this.isDelayed) {
      score -= Math.min(50, (this.delayHours || 0) * 2); // Max 50 points deduction
    }
    
    // Deduct points for damage
    if (this.damageReported) {
      score -= 30;
    }
    
    // Bonus for on-time delivery
    if (this.onTimeDelivery) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  get costEfficiencyRating(): 'excellent' | 'good' | 'average' | 'poor' | 'unknown' {
    if (!this.costPerKm) return 'unknown';
    
    // These thresholds would typically be determined by market analysis
    if (this.costPerKm <= 1.0) return 'excellent';
    if (this.costPerKm <= 1.5) return 'good';
    if (this.costPerKm <= 2.0) return 'average';
    return 'poor';
  }

  // Helper methods
  static generateRouteHash(originCity: string, destinationCity: string): string {
    const routeString = `${originCity}-${destinationCity}`;
    return crypto.createHash('md5').update(routeString).digest('hex');
  }

  static getSeason(date: Date): string {
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  // Method to populate from Load entity
  static fromLoad(load: Load, tenantId: string): Partial<CargoOwnerAnalytics> {
    const analytics: Partial<CargoOwnerAnalytics> = {
      tenantId,
      cargoOwnerId: load.cargoOwnerId,
      loadId: load.id,
      cargoType: load.cargoType,
      cargoWeightKg: Number(load.weight),
      cargoVolumeM3: load.volume ? Number(load.volume) : undefined,
      cargoValue: Number(load.loadValue),
      totalCost: load.offeredPrice ? Number(load.offeredPrice) : undefined,
      bookingDate: load.createdAt,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      carrierId: load.assignedCarrierId,
      onTimeDelivery: load.status === 'DELIVERED',
      season: load.createdAt ? CargoOwnerAnalytics.getSeason(load.createdAt) : undefined,
    };

    // Extract origin and destination from locations
    if (load.locations && load.locations.length > 0) {
      const pickup = load.locations.find(loc => loc.type === 'PICKUP');
      const delivery = load.locations.find(loc => loc.type === 'DELIVERY');
      
      if (pickup?.locationData?.city) {
        analytics.originCity = pickup.locationData.city;
      }
      
      if (delivery?.locationData?.city) {
        analytics.destinationCity = delivery.locationData.city;
      }
    }

    // Calculate performance metrics
    if (analytics.pickupDate && analytics.deliveryDate) {
      const transitTimeMs = analytics.deliveryDate.getTime() - analytics.pickupDate.getTime();
      analytics.actualTransitHours = Math.round(transitTimeMs / (1000 * 60 * 60));
    }

    // Calculate cost metrics
    if (analytics.totalCost && analytics.cargoWeightKg && analytics.cargoWeightKg > 0) {
      analytics.costPerKg = analytics.totalCost / analytics.cargoWeightKg;
    }

    return analytics;
  }
}