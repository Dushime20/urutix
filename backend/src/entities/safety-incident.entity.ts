import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum IncidentType {
  ACCIDENT = 'accident',
  NEAR_MISS = 'near_miss',
  INJURY = 'injury',
  PROPERTY_DAMAGE = 'property_damage',
  TRAFFIC_VIOLATION = 'traffic_violation',
}

export enum IncidentSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical',
}

export enum IncidentStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('safety_incidents')
@Index(['tenantId', 'date'])
@Index(['driverId', 'status'])
@Index(['truckId', 'status'])
export class SafetyIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: IncidentType,
  })
  type: IncidentType;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
  })
  severity: IncidentSeverity;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'varchar', length: 500 })
  location: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'uuid', nullable: true })
  driverId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  driverName: string;

  @Column({ type: 'uuid', nullable: true })
  truckId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  truckPlate: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  weatherConditions: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  roadConditions: string;

  @Column({ type: 'text', nullable: true })
  injuries: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  propertyDamage: number;

  @Column({ type: 'boolean', default: false })
  policeReport: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reportNumber: string;

  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED,
  })
  status: IncidentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string;

  @Column({ type: 'json', nullable: true })
  correctiveActions: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'boolean', default: false })
  insuranceClaim: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  claimNumber: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
