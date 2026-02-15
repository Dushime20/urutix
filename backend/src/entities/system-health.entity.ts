import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  DOWN = 'DOWN',
}

export enum ServiceType {
  DATABASE = 'DATABASE',
  API = 'API',
  CACHE = 'CACHE',
  EMAIL = 'EMAIL',
  STORAGE = 'STORAGE',
  PAYMENT = 'PAYMENT',
  SERVER = 'SERVER',
}

@Entity('system_health_logs')
export class SystemHealthLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ServiceType,
  })
  service: ServiceType;

  @Column({
    type: 'enum',
    enum: HealthStatus,
  })
  status: HealthStatus;

  @Column({ type: 'int', nullable: true, name: 'response_time' })
  responseTime: number; // in milliseconds

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'metric_type' })
  metricType: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'metric_name' })
  metricName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'metric_value' })
  metricValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'threshold_value' })
  thresholdValue: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  severity: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}
