import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Load } from './load.entity';
import { Bid } from './bid.entity';
import { AuctionView } from './auction-view.entity';
import { AuctionWatch } from './auction-watch.entity';

export enum AuctionStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
}

export enum AuctionType {
  REVERSE = 'REVERSE', // Cargo owner sets max price, truck owners bid down
  FORWARD = 'FORWARD', // Truck owners compete for premium loads
  DUTCH = 'DUTCH', // Price decreases until first bid
  SEALED = 'SEALED', // Private bids with blind selection
}

@Entity('auctions')
@Index(['loadId', 'status'])
@Index(['auctionStart', 'auctionEnd'])
export class Auction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loadId: string;

  @Column({
    type: 'enum',
    enum: AuctionType,
    default: AuctionType.REVERSE,
  })
  auctionType: AuctionType;

  @Column({
    type: 'enum',
    enum: AuctionStatus,
    default: AuctionStatus.SCHEDULED,
  })
  status: AuctionStatus;

  @Column('timestamp with time zone')
  auctionStart: Date;

  @Column('timestamp with time zone')
  auctionEnd: Date;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  reservePrice?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minimumBidIncrement?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maximumBidAmount?: number;

  // Professional Auction Type Fields
  
  // REVERSE AUCTION: Target price (shipper's goal)
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  targetPrice?: number;

  // REVERSE AUCTION: Maximum budget (hidden ceiling)
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  maxBudget?: number;

  // FORWARD/DUTCH AUCTION: Starting price
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  startingPrice?: number;

  // ALL TYPES: Market reference price
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  marketRate?: number;

  // DUTCH AUCTION: Drop interval in seconds
  @Column('int', { nullable: true })
  dropInterval?: number;

  // DUTCH AUCTION: Amount to drop each interval
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  dropAmount?: number;

  // SEALED BID: Bid visibility control
  @Column('varchar', { length: 50, nullable: true, default: 'HIDDEN' })
  bidVisibility?: string; // 'HIDDEN' | 'VISIBLE_AFTER_DEADLINE' | 'VISIBLE'

  // SEALED BID: Allow bid revision before deadline
  @Column('boolean', { default: false })
  allowBidRevision?: boolean;

  // SEALED BID: Winner selection criteria
  @Column('varchar', { length: 50, nullable: true, default: 'LOWEST_BID' })
  selectionCriteria?: string; // 'LOWEST_BID' | 'BEST_VALUE' | 'WEIGHTED_SCORE'

  // ALL TYPES: Auto-extend auction on late bids
  @Column('boolean', { default: false })
  autoExtend?: boolean;

  // REVERSE AUCTION: Minimum bid decrement
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  minimumBidDecrement?: number;

  @Column('int', { default: 0 })
  totalBids: number;

  @Column('int', { default: 0 })
  uniqueBidders: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  currentHighestBid?: number;

  @Column('uuid', { nullable: true })
  winningBidId?: string;

  @Column('uuid', { nullable: true })
  winningBidderId?: string;

  @Column('timestamp with time zone', { nullable: true })
  awardedAt?: Date;

  @Column('jsonb', { default: {} })
  auctionRules: {
    allowCounterOffers?: boolean;
    allowBidModifications?: boolean;
    autoExtendOnBid?: boolean;
    extensionMinutes?: number;
    minimumBidTime?: number;
    maximumBidTime?: number;
    requirePreApproval?: boolean;
    allowAnonymousBids?: boolean;
  };

  @Column('jsonb', { default: {} })
  notificationSettings: {
    notifyOnBid?: boolean;
    notifyOnCounterOffer?: boolean;
    notifyOnAuctionEnd?: boolean;
    notifyOnAward?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  };

  @Column('jsonb', { default: {} })
  analytics: {
    viewCount?: number;
    uniqueViewers?: number;
    averageBidAmount?: number;
    medianBidAmount?: number;
    bidDistribution?: Record<string, number>;
    timeToFirstBid?: number;
    timeToLastBid?: number;
  };

  @Column('text', { nullable: true })
  cancellationReason?: string;

  @Column('uuid', { nullable: true })
  cancelledBy?: string;

  @Column('timestamp with time zone', { nullable: true })
  cancelledAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @OneToOne('Load', 'auction')
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @OneToOne('Bid', 'auction')
  @JoinColumn({ name: 'winningBidId' })
  winningBid: Bid;

  // Tracking relationships
  @OneToMany(() => AuctionView, (view) => view.auction)
  views: AuctionView[];

  @OneToMany(() => AuctionWatch, (watch) => watch.auction)
  watches: AuctionWatch[];
}
