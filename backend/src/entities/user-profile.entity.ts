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

export enum KycRequirementLevel {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  ENHANCED = 'ENHANCED',
  PREMIUM = 'PREMIUM',
}

@Entity('user_profiles')
@Index(['userId'], { unique: true })
@Index(['tenantId', 'kycStatus'])
@Index(['kycRequirementLevel'])
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

  @Column({
    type: 'enum',
    enum: KycRequirementLevel,
    default: KycRequirementLevel.BASIC,
    name: 'kyc_requirement_level',
  })
  kycRequirementLevel: KycRequirementLevel;

  @Column({ nullable: true, name: 'kyc_submitted_at' })
  kycSubmittedAt?: Date;

  @Column({ nullable: true, name: 'kyc_reviewed_by' })
  kycReviewedBy?: string;

  @Column({ nullable: true, name: 'kyc_notes' })
  kycNotes?: string;

  @Column('jsonb', { default: {}, name: 'kyc_data' })
  kycData: Record<string, any>;

  @Column({ default: false, name: 'identity_verified' })
  identityVerified: boolean;

  @Column({ default: false, name: 'address_verified' })
  addressVerified: boolean;

  @Column({ default: false, name: 'financial_verified' })
  financialVerified: boolean;

  @Column({ default: false, name: 'business_verified' })
  businessVerified: boolean;

  @Column({ default: false, name: 'background_check_completed' })
  backgroundCheckCompleted: boolean;

  @Column({ default: 0, name: 'compliance_score' })
  complianceScore: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  totalTrips: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'userId' })
  user: User;
}
