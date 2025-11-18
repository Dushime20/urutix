import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ScoreCategory {
  FINANCIAL_HEALTH = 'financial_health',
  TRANSACTION_HISTORY = 'transaction_history',
  PAYMENT_BEHAVIOR = 'payment_behavior',
  CARGO_QUALITY = 'cargo_quality',
  COMMUNICATION_SCORE = 'communication_score',
  RELIABILITY_SCORE = 'reliability_score',
  OVERALL_CREDIT_SCORE = 'overall_credit_score',
}

export enum ScoreAlgorithm {
  FINANCIAL_ANALYSIS = 'financial_analysis',
  BEHAVIORAL_PATTERN = 'behavioral_pattern',
  RISK_ASSESSMENT = 'risk_assessment',
  COMPREHENSIVE = 'comprehensive',
}

@Entity('user_scores')
export class UserScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: ScoreCategory,
  })
  category: ScoreCategory;

  @Column('decimal', { precision: 5, scale: 2 })
  score: number; // 0.00 to 1000.00

  @Column('decimal', { precision: 5, scale: 2 })
  normalizedScore: number; // 0.00 to 100.00

  @Column({
    type: 'enum',
    enum: ScoreAlgorithm,
  })
  algorithm: ScoreAlgorithm;

  @Column('jsonb')
  factors: Record<string, any>; // Factors that contributed to the score

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>; // Additional scoring data

  @Column('text', { nullable: true })
  explanation: string; // AI explanation of the score

  @Column('boolean', { default: false })
  isActive: boolean; // Whether this is the current active score

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations - commented out until User entity relationships are uncommented
  // @ManyToOne('User', 'scores')
  // user: any;
}
