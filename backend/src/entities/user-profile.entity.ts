import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum KycStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

@Entity('user_profiles')
@Index(['userId'], { unique: true })
@Index(['tenantId', 'kycStatus'])
@Index(['rating', 'totalTrips'])
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  tenantId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  taxId?: string;

  @Column({ nullable: true })
  businessLicense?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  cityId?: number;

  @Column({ nullable: true })
  postalCode?: string;

  @Column({ nullable: true })
  countryCode?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  websiteUrl?: string;

  @Column('jsonb', { default: {} })
  insuranceInfo: Record<string, any>;

  @Column('jsonb', { default: {} })
  bankAccountInfo: Record<string, any>;

  @Column('jsonb', { default: {} })
  preferences: Record<string, any>;

  @Column({
    type: 'enum',
    enum: KycStatus,
    default: KycStatus.PENDING,
  })
  kycStatus: KycStatus;

  @Column('simple-json', { default: [] })
  kycDocuments: any[];

  @Column({ nullable: true })
  kycVerifiedAt?: Date;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalTrips: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne('User', 'profile')
  @JoinColumn({ name: 'user_id' })
  user: User;
}
