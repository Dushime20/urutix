import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Load } from './load.entity';
import { Truck } from './truck.entity';
import { Tenant } from './tenant.entity';
import { Bid } from './bid.entity';
import { AuctionView } from './auction-view.entity';
import { AuctionWatch } from './auction-watch.entity';
import { BrokerCommission } from './broker-commission.entity';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  CARGO_OWNER = 'CARGO_OWNER',
  CARGO_RECEIVER = 'CARGO_RECEIVER',
  TRUCK_OWNER = 'TRUCK_OWNER',
  DRIVER = 'DRIVER',
  AGENT = 'AGENT',
  LENDER = 'LENDER',
  BROKER = 'BROKER',
  FLEET_MANAGER = 'FLEET_MANAGER',
  FLEET_DISPATCHER = 'FLEET_DISPATCHER',
  FLEET_ACCOUNTANT = 'FLEET_ACCOUNTANT',
  FLEET_SAFETY_OFFICER = 'FLEET_SAFETY_OFFICER',
}

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

@Entity('users')
@Index(['tenantId', 'email', 'role'], { unique: true, where: 'deleted_at IS NULL' })
@Index(['role', 'status'])
@Index(['email']) // Removed unique constraint
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column() // Removed unique: true
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ nullable: true })
  emailVerifiedAt?: Date;

  @Column({ nullable: true })
  phoneVerifiedAt?: Date;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorSecret?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CARGO_OWNER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ nullable: true })
  lockedUntil?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @ManyToOne('Tenant', 'users')
  tenant: Tenant;

  @OneToMany('Load', 'cargoOwner')
  loads: Load[];

  @OneToMany(() => Load, (load) => load.receiver)
  assignedCargos: Load[];

  @Column('uuid', { nullable: true })
  createdByCargoOwnerId?: string; // For receivers: ID of cargo owner who created them

  @ManyToOne(() => User, (user) => user.createdReceivers, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByCargoOwnerId' })
  createdByCargoOwner?: User;

  @OneToMany(() => User, (user) => user.createdByCargoOwner)
  createdReceivers: User[];

  @OneToMany('Bid', 'truckOwner')
  bids: Bid[];

  @OneToMany('Truck', 'owner')
  trucks: Truck[];

  // Broker relationships
  @Column('uuid', { nullable: true })
  brokerTenantId?: string; // ID of tenant this broker works for

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  totalCommissionEarned?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  defaultCommissionRate?: number; // Default commission percentage (e.g., 5.00 for 5%)

  @ManyToOne(() => Tenant, (tenant) => tenant.brokers, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brokerTenantId' })
  brokerTenant?: Tenant;

  @OneToMany(() => Load, (load) => load.broker)
  brokerLoads?: Load[];

  @OneToMany(() => BrokerCommission, (commission) => commission.broker)
  brokerCommissions?: BrokerCommission[];

  // Auction tracking relationships
  @OneToMany(() => AuctionView, (view) => view.viewer)
  auctionViews: AuctionView[];

  @OneToMany('AuctionWatch', (watch: any) => watch.watcher)
  auctionWatches: AuctionWatch[];

  @OneToMany('TenantSubscription', 'userId')
  subscriptions: any[];

  // Rating relationships - commented out until entities are created
  // @OneToMany('UserRating', 'ratedUser')
  // ratingsReceived: any[];

  // @OneToMany('UserRating', 'raterUser')
  // ratingsGiven: any[];

  // Reward relationships - commented out until entities are created
  // @OneToMany('UserReward', 'user')
  // rewards: any[];

  // Score relationships - commented out until entities are created
  // @OneToMany('UserScore', 'user')
  // scores: any[];
}
