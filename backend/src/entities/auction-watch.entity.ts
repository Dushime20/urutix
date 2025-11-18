import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { Auction } from './auction.entity';
import { User } from './user.entity';

@Entity('auction_watches')
@Index(['auctionId', 'watcherId'], { unique: true })
@Index(['tenantId', 'isActive'])
export class AuctionWatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'auctionId', type: 'uuid' })
  auctionId: string;

  @Column({ name: 'watcherId', type: 'uuid' })
  watcherId: string;

  @Column({ name: 'tenantId', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    name: 'notificationPreferences',
    type: 'jsonb',
    default: { email: true, push: true, sms: false },
  })
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relationships
  @ManyToOne(() => Auction, (auction) => auction.watches)
  @JoinColumn({ name: 'auctionId' })
  auction: Auction;

  @ManyToOne(() => User, (user) => user.auctionWatches)
  @JoinColumn({ name: 'watcherId' })
  watcher: User;
}
