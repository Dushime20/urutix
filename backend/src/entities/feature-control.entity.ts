import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FeatureControlScope {
  PLATFORM = 'PLATFORM',
  TENANT = 'TENANT',
}

/**
 * Platform / tenant feature kill-switches keyed by permission code (resource:action).
 * Absence of a row means ENABLED (fail-open only for missing config; explicit OFF denies).
 */
@Entity('feature_controls')
@Index(['permissionCode', 'scope', 'tenantId'], { unique: true })
@Index(['permissionCode'])
@Index(['scope'])
export class FeatureControl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Permission UUID when the code maps to an existing permissions row */
  @Column({ name: 'permission_id', type: 'uuid', nullable: true })
  permissionId: string | null;

  /** Canonical code e.g. bids:create */
  @Column({ name: 'permission_code', type: 'varchar', length: 150 })
  permissionCode: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: FeatureControlScope.PLATFORM,
  })
  scope: FeatureControlScope;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
