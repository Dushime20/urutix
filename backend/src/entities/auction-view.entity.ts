import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Auction } from './auction.entity';
import { User } from './user.entity';

@Entity('auction_views')
@Index(['auctionId', 'viewerId'], { unique: true })
@Index(['tenantId', 'viewedAt'])
export class AuctionView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'auctionId', type: 'uuid' })
  auctionId: string;

  @Column({ name: 'viewerId', type: 'uuid' })
  viewerId: string;

  @Column({ name: 'tenantId', type: 'uuid' })
  tenantId: string;

  @Column({
    name: 'viewedAt',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  viewedAt: Date;

  @Column({ name: 'ipAddress', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'userAgent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'referrer', type: 'text', nullable: true })
  referrer?: string;

  @Column({ name: 'sessionId', type: 'varchar', length: 255, nullable: true })
  sessionId?: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Auction, (auction) => auction.views)
  @JoinColumn({ name: 'auctionId' })
  auction: Auction;

  @ManyToOne(() => User, (user) => user.auctionViews)
  @JoinColumn({ name: 'viewerId' })
  viewer: User;
}
