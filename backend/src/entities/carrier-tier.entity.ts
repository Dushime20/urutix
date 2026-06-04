import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CarrierTierLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

@Entity('carrier_tiers')
@Index(['truckOwnerId', 'tenantId'], { unique: true })
@Index(['tier', 'tenantId'])
export class CarrierTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  truckOwnerId: string;

  @Column('uuid')
  tenantId: string;

  @Column({
    type: 'enum',
    enum: CarrierTierLevel,
    default: CarrierTierLevel.BRONZE,
  })
  tier: CarrierTierLevel;

  @Column({
    type: 'enum',
    enum: CarrierTierLevel,
    nullable: true,
  })
  previousTier?: CarrierTierLevel;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  onTimeRate: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  damageRate: number;

  @Column({ default: 0 })
  totalTrips: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  averageRating: number;

  @Column({ nullable: true })
  calculatedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
