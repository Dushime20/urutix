import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Load } from './load.entity';
import { User } from './user.entity';

export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED',
}

export enum AuctionType {
  REVERSE = 'REVERSE', // Cargo owner sets max price, truck owners bid down
  FORWARD = 'FORWARD', // Truck owners compete for premium loads
  DUTCH = 'DUTCH', // Price decreases until first bid
  SEALED = 'SEALED', // Private bids with blind selection
}

@Entity('bids')
@Index(['loadId', 'truckOwnerId', 'status'])
@Index(['createdAt', 'status'])
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loadId: string;

  @Column('uuid')
  truckOwnerId: string;

  @Column('decimal', { precision: 15, scale: 2 })
  bidAmount: number;

  @Column({ length: 3, default: 'USD' })
  bidCurrency: string;

  @Column('timestamp with time zone', { nullable: true })
  proposedPickupDate?: Date;

  @Column('timestamp with time zone', { nullable: true })
  proposedDeliveryDate?: Date;

  @Column({
    type: 'enum',
    enum: BidStatus,
    default: BidStatus.PENDING,
  })
  status: BidStatus;

  @Column('text', { nullable: true })
  bidNotes?: string;

  @Column('jsonb', { default: {} })
  bidDetails: {
    truckSpecifications?: {
      truckId?: string;
      capacityWeight?: number;
      capacityVolume?: number;
      truckType?: string;
      hasRefrigeration?: boolean;
      hasHazmatPermit?: boolean;
    };
    driverInfo?: {
      driverId?: string;
      experience?: number;
      rating?: number;
      certifications?: string[];
    };
    routeOptimization?: {
      estimatedDistance?: number;
      estimatedFuelCost?: number;
      estimatedTime?: number;
    };
    additionalServices?: {
      insurance?: boolean;
      tracking?: boolean;
      loadingAssistance?: boolean;
      unloadingAssistance?: boolean;
    };
  };

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  successProbability?: number;

  @Column('jsonb', { default: {} })
  riskAssessment?: {
    riskScore?: number;
    riskFactors?: string[];
    mitigationStrategies?: string[];
  };

  @Column('jsonb', { default: {} })
  marketContext?: {
    marketRate?: number;
    competitorBids?: number;
    demandLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    supplyLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  };

  @Column({ default: false })
  isAutoBid: boolean;

  @Column({ default: false })
  isCounterOffer: boolean;

  @Column('uuid', { nullable: true })
  parentBidId?: string; // For counter-offers

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  advancePaymentPercentage?: number; // Percentage of transportation fee to be paid before trip starts (0-100)

  @Column({ default: true })
  requireAdvancePayment: boolean; // Whether advance payment is required before trip starts. If false, trip can start without advance payment.

  @Column('timestamp with time zone', { nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne('Load', 'bids')
  @JoinColumn({ name: 'loadId' })
  load: Load;

  @ManyToOne('User', 'bids')
  @JoinColumn({ name: 'truckOwnerId' })
  truckOwner: User;
}
