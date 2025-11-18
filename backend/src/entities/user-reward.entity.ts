import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RewardType {
  TRANSACTION_BONUS = 'transaction_bonus',
  VOLUME_BONUS = 'volume_bonus',
  LOYALTY_POINTS = 'loyalty_points',
  CASHBACK = 'cashback',
  DISCOUNT = 'discount',
  PREMIUM_FEATURES = 'premium_features',
}

export enum RewardStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
}

@Entity('user_rewards')
export class UserReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: RewardType,
  })
  type: RewardType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('varchar', { length: 3, default: 'KES' })
  currency: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: RewardStatus,
    default: RewardStatus.PENDING,
  })
  status: RewardStatus;

  @Column('date', { nullable: true })
  validFrom: Date;

  @Column('date', { nullable: true })
  validUntil: Date;

  @Column('jsonb', { nullable: true })
  criteria: Record<string, any>; // Criteria that triggered this reward

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional reward data

  @Column('date', { nullable: true })
  redeemedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations - commented out until User entity relationships are uncommented
  // @ManyToOne('User', 'rewards')
  // user: any;
}
