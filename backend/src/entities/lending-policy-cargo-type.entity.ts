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
import { Lender } from './lender.entity';

export enum CargoCategory {
  GENERAL = 'general',
  FRAGILE = 'fragile',
  HAZARDOUS = 'hazardous',
  REFRIGERATED = 'refrigerated',
  LIQUID = 'liquid',
  OVERSIZED = 'oversized',
  VALUABLE = 'valuable',
  PERISHABLE = 'perishable',
  CHEMICALS = 'chemicals',
  MACHINERY = 'machinery',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('lending_policy_cargo_types')
@Index(['lender_id', 'is_active'])
@Index(['cargo_category', 'is_active'])
export class LendingPolicyCargoType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lender_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: CargoCategory,
  })
  cargo_category: CargoCategory;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cargo_type: string;

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.MEDIUM,
  })
  risk_level: RiskLevel;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  risk_multiplier: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  max_loan_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  interest_rate_adjustment: number;

  @Column({ type: 'boolean', default: false })
  insurance_required: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  minimum_insurance_coverage: number;

  @Column({ type: 'jsonb', nullable: true })
  required_certifications: string[];

  @Column({ type: 'jsonb', nullable: true })
  special_conditions: string[];

  @Column({ type: 'jsonb', nullable: true })
  prohibited_routes: string[];

  @Column({ type: 'jsonb', nullable: true })
  required_equipment: string[];

  @Column({ type: 'int', nullable: true })
  max_transit_days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  collateral_requirement_multiplier: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'uuid', nullable: true })
  created_by: string;

  @Column({ type: 'uuid', nullable: true })
  updated_by: string;

  @ManyToOne(() => Lender, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lender_id' })
  lender: Lender;
}