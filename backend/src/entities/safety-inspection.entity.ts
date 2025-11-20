import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum InspectionType {
  PRE_TRIP = 'pre_trip',
  POST_TRIP = 'post_trip',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
  RANDOM = 'random',
}

export enum InspectionStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  CONDITIONAL = 'conditional',
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
}

@Entity('safety_inspections')
@Index(['tenantId', 'inspectionDate'])
@Index(['truckId', 'status'])
@Index(['driverId', 'status'])
export class SafetyInspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: InspectionType,
  })
  type: InspectionType;

  @Column({ type: 'varchar', length: 255 })
  inspector: string;

  @Column({ type: 'timestamp' })
  inspectionDate: Date;

  @Column({ type: 'uuid', nullable: true })
  truckId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  truckPlate: string;

  @Column({ type: 'uuid', nullable: true })
  driverId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  driverName: string;

  @Column({
    type: 'enum',
    enum: InspectionStatus,
  })
  status: InspectionStatus;

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', default: 100 })
  maxScore: number;

  @Column({ type: 'json', nullable: true })
  items: any[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  nextInspectionDate: Date;

  @Column({
    type: 'enum',
    enum: ComplianceStatus,
    default: ComplianceStatus.COMPLIANT,
  })
  complianceStatus: ComplianceStatus;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}

