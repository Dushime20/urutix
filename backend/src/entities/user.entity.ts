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
}

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

@Entity('users')
@Index(['tenantId', 'email'], { unique: true, where: 'deleted_at IS NULL' })
@Index(['role', 'status'])
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone?: string;

  @Column()
  passwordHash: string;

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
  @OneToOne('UserProfile', 'user', { cascade: true })
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

  // Auction tracking relationships
  @OneToMany(() => AuctionView, (view) => view.viewer)
  auctionViews: AuctionView[];

  @OneToMany(() => AuctionWatch, (watch) => watch.watcher)
  auctionWatches: AuctionWatch[];

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
