import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * LoanNumberSequence — atomic per-tenant-per-year counter for loan_number generation.
 *
 * WHY THIS EXISTS:
 * The previous COUNT(*)-based approach in LendingService.generateLoanNumber() had a
 * classic TOCTOU (time-of-check / time-of-use) race condition: two concurrent requests
 * for the same tenant could both read the same count, compute the same LN-YYYY-NNNNNN,
 * and then both attempt to INSERT — triggering a duplicate key violation on the unique
 * constraint UQ_4382ec13ee491f4b516b8549d26 (loan_number column).
 *
 * HOW IT FIXES IT:
 * PostgreSQL's INSERT ... ON CONFLICT DO UPDATE (upsert) is evaluated atomically at
 * the statement level. Only one writer can increment last_seq at a time for a given
 * (tenant_id, year) row — the database serialises concurrent writes internally,
 * eliminating the race window entirely without application-level locking.
 *
 * TypeORM synchronize will create this table automatically on docker build.
 */
@Entity('loan_number_sequences')
export class LoanNumberSequence {
  /** Tenant that owns this counter */
  @PrimaryColumn({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  /** Calendar year the counter resets for (e.g. 2026) */
  @PrimaryColumn({ type: 'int', name: 'year' })
  year: number;

  /**
   * Last sequence value issued. Incremented atomically via upsert.
   * The next loan number for this tenant+year will be last_seq + 1.
   */
  @Column({ type: 'int', name: 'last_seq', default: 0 })
  lastSeq: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
