import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TrainingType {
  DEFENSIVE_DRIVING = 'defensive_driving',
  HAZMAT = 'hazmat',
  FIRST_AID = 'first_aid',
  EMERGENCY_PROCEDURES = 'emergency_procedures',
  REGULATIONS = 'regulations',
  TECHNOLOGY = 'technology',
}

export enum TrainingFrequency {
  ONCE = 'once',
  ANNUALLY = 'annually',
  BIANNUALLY = 'biannually',
  QUARTERLY = 'quarterly',
}

export enum TrainingStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  OVERDUE = 'overdue',
}

@Entity('safety_trainings')
@Index(['tenantId', 'nextDue'])
@Index(['driverId', 'status'])
@Index(['status', 'nextDue'])
export class SafetyTraining {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({
    type: 'enum',
    enum: TrainingType,
  })
  type: TrainingType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  duration: number; // hours

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({
    type: 'enum',
    enum: TrainingFrequency,
    nullable: true,
  })
  frequency: TrainingFrequency;

  @Column({ type: 'timestamp', nullable: true })
  lastCompleted: Date;

  @Column({ type: 'timestamp' })
  nextDue: Date;

  @Column({
    type: 'enum',
    enum: TrainingStatus,
    default: TrainingStatus.PENDING,
  })
  status: TrainingStatus;

  @Column({ type: 'uuid', nullable: true })
  driverId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  driverName: string;

  @Column({ type: 'varchar', length: 255 })
  instructor: string;

  @Column({ type: 'int', nullable: true })
  score: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  certificate: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDate: Date; // When the training is scheduled to occur

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
