import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserRole } from './user.entity';

export enum KycRequirementLevel {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  ENHANCED = 'ENHANCED',
  PREMIUM = 'PREMIUM',
}

@Entity('kyc_role_requirements')
@Index(['role'])
export class KycRoleRequirements {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: KycRequirementLevel,
    name: 'requirement_level',
  })
  requirementLevel: KycRequirementLevel;

  @Column('text', { array: true, name: 'required_documents' })
  requiredDocuments: string[];

  @Column('text', { array: true, default: [], name: 'optional_documents' })
  optionalDocuments: string[];

  @Column('text', { array: true, name: 'verification_steps' })
  verificationSteps: string[];

  @Column({ default: false, name: 'auto_approval_eligible' })
  autoApprovalEligible: boolean;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}