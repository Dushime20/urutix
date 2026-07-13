import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Persistent, immutable audit trail for all payment state changes and actions.
 * Records are append-only — never updated or soft-deleted.
 */
@Entity('payment_audit_logs')
@Index(['paymentId', 'createdAt'])
@Index(['tenantId', 'createdAt'])
@Index(['actorId', 'createdAt'])
@Index(['action', 'createdAt'])
export class PaymentAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The payment this audit record relates to. Not a FK — must survive payment deletion. */
  @Column('uuid')
  paymentId: string;

  @Column('uuid')
  tenantId: string;

  /** The user who triggered the action, or null for system/automated actions. */
  @Column('uuid', { nullable: true })
  actorId?: string;

  /**
   * Action label — e.g. CREATE_PAYMENT, PROCESS_PAYMENT, PAYMENT_FAILED,
   * STATUS_UPDATED, FRAUD_DETECTED, ESCROW_HELD, ESCROW_RELEASED, REFUND_CREATED.
   */
  @Column({ length: 100 })
  action: string;

  /** Payment status before this action. Null for CREATE. */
  @Column({ length: 50, nullable: true })
  previousStatus?: string;

  /** Payment status after this action. */
  @Column({ length: 50, nullable: true })
  currentStatus?: string;

  /** Arbitrary structured context — provider response, error codes, amounts, etc. */
  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  /** Client IP address, captured from the originating request when available. */
  @Column({ nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  createdAt: Date;
}
