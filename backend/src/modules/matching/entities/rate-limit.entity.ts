import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('rate_limits')
@Index(['tenantId', 'endpoint', 'createdAt'])
@Index(['tenantId', 'createdAt'])
export class RateLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  endpoint: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  userAgent?: string;

  @Column({ type: 'int', default: 1 })
  requestCount: number;

  @Column({ type: 'varchar', length: 20, default: 'SUCCESS' })
  status: 'SUCCESS' | 'RATE_LIMITED' | 'ERROR';

  @Column({ type: 'text', nullable: true })
  metadata?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  blockedUntil?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;
}
