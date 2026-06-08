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
import { CustomsInspection } from './customs-inspection.entity';
import { User } from './user.entity';

export enum ComplianceResponseStatus {
  SUBMITTED   = 'SUBMITTED',   // Cargo owner submitted — awaiting officer review
  REVIEWED    = 'REVIEWED',    // Officer has reviewed it
  ACCEPTED    = 'ACCEPTED',    // Officer accepted — will clear/proceed
  REJECTED    = 'REJECTED',    // Officer rejected — still non-compliant
}

@Entity('customs_compliance_responses')
@Index(['inspectionId'])
@Index(['submittedById'])
@Index(['status'])
export class CustomsComplianceResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  inspectionId: string;

  @ManyToOne(() => CustomsInspection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inspectionId' })
  inspection: CustomsInspection;

  /** The cargo owner who submitted this response */
  @Column('uuid')
  submittedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'submittedById' })
  submittedBy?: User;

  /** Free-text explanation from cargo owner */
  @Column('text')
  notes: string;

  /**
   * IDs of documents already uploaded via the /documents endpoint
   * and linked to the relevant cargo/trip entity.
   * Officer can fetch these to verify.
   */
  @Column('jsonb', { default: [] })
  documentIds: string[];

  @Column({
    type: 'enum',
    enum: ComplianceResponseStatus,
    default: ComplianceResponseStatus.SUBMITTED,
  })
  status: ComplianceResponseStatus;

  /** The officer who reviewed this response */
  @Column('uuid', { nullable: true })
  reviewedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy?: User;

  /** Officer's review notes */
  @Column('text', { nullable: true })
  reviewNotes?: string;

  @Column('timestamp', { nullable: true })
  reviewedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
