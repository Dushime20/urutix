import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RatingType {
  TRANSPORTER = 'transporter',
  FINANCING_COMMUNITY = 'financing_community',
  PLATFORM = 'platform',
}

export enum RatingCategory {
  RELIABILITY = 'reliability',
  PAYMENT_PUNCTUALITY = 'payment_punctuality',
  COMMUNICATION = 'communication',
  CARGO_CONDITION = 'cargo_condition',
  PROFESSIONALISM = 'professionalism',
  OVERALL = 'overall',
}

@Entity('user_ratings')
export class UserRating {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ratedUserId: string; // The cargo owner being rated

  @Column()
  raterUserId: string; // The transporter or financing community doing the rating

  @Column({
    type: 'enum',
    enum: RatingType,
  })
  ratingType: RatingType;

  @Column({
    type: 'enum',
    enum: RatingCategory,
  })
  category: RatingCategory;

  @Column('decimal', { precision: 3, scale: 2 })
  rating: number; // 1.00 to 5.00

  @Column('text', { nullable: true })
  comment: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional rating data

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations - commented out until User entity relationships are uncommented
  // @ManyToOne('User', 'ratingsReceived')
  // ratedUser: any;

  // @ManyToOne('User', 'ratingsGiven')
  // raterUser: any;
}
