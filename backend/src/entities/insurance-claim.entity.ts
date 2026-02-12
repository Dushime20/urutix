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
import { InsurancePolicy } from './insurance-policy.entity';
import { Truck } from './truck.entity';

export enum ClaimStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  APPROVED = 'approved',
  DENIED = 'denied',
  CLOSED = 'closed',
  UNDER_REVIEW = 'under_review',
}

export enum ClaimType {
  COLLISION = 'collision',
  CARGO_DAMAGE = 'cargo_damage',
  THEFT = 'theft',
  WEATHER = 'weather',
  LIABILITY = 'liability',
  MEDICAL = 'medical',
  ROADSIDE = 'roadside',
  OTHER = 'other',
}

export enum ClaimPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('insurance_claims')
export class InsuranceClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  claimNumber: string;

  @Column({ type: 'uuid' })
  policyId: string;

  @ManyToOne(() => InsurancePolicy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policyId' })
  policy: InsurancePolicy;

  @Column({ type: 'uuid' })
  truckId: string;

  @ManyToOne(() => Truck, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @Column({
    type: 'enum',
    enum: ClaimType,
  })
  claimType: ClaimType;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  incidentDate: Date;

  @Column({ type: 'date' })
  reportedDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  estimatedAmount: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  approvedAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  paidAmount: number;

  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.PENDING,
  })
  @Index()
  status: ClaimStatus;

  @Column({
    type: 'enum',
    enum: ClaimPriority,
    default: ClaimPriority.MEDIUM,
  })
  priority: ClaimPriority;

  @Column('json', { nullable: true })
  adjuster: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };

  @Column('json', { nullable: true })
  notes: Array<{
    content: string;
    author: string;
    timestamp: Date;
    isInternal: boolean;
  }>;

  @Column('json', { nullable: true })
  documents: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;

  @Column('json', { nullable: true })
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };

  @Column('json', { nullable: true })
  witnesses: Array<{
    name: string;
    contact: string;
    statement: string;
  }>;

  @Column('json', { nullable: true })
  policeReport: {
    reportNumber: string;
    department: string;
    officer: string;
    date: Date;
  };

  @Column('json', { nullable: true })
  repairEstimates: Array<{
    vendor: string;
    amount: number;
    description: string;
    date: Date;
  }>;

  @Column('json', { nullable: true })
  timeline: Array<{
    action: string;
    description: string;
    date: Date;
    performedBy: string;
  }>;

  @Column('json', { nullable: true })
  settlement: {
    date: Date;
    method: string;
    reference: string;
  };

  @Column('json', { nullable: true })
  appeal: {
    filed: boolean;
    date: Date;
    reason: string;
    status: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties (calculated fields)
  get claimAge(): number {
    const now = new Date();
    const reported = new Date(this.reportedDate);
    const diffTime = now.getTime() - reported.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysSinceIncident(): number {
    const now = new Date();
    const incident = new Date(this.incidentDate);
    const diffTime = now.getTime() - incident.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Methods
  addNote(content: string, author: string, isInternal: boolean = false): void {
    if (!this.notes) this.notes = [];
    this.notes.push({
      content,
      author,
      isInternal,
      timestamp: new Date(),
    });
  }

  addTimelineEntry(
    action: string,
    description: string,
    performedBy: string,
  ): void {
    if (!this.timeline) this.timeline = [];
    this.timeline.push({
      action,
      description,
      performedBy,
      date: new Date(),
    });
  }

  updateStatus(newStatus: ClaimStatus, notes: string = ''): void {
    this.status = newStatus;
    if (notes) {
      this.addNote(`Status changed to ${newStatus}: ${notes}`, 'System', true);
    }
    this.addTimelineEntry(
      'Status Update',
      `Status changed to ${newStatus}`,
      'System',
    );
  }

  assignAdjuster(adjusterData: any): void {
    this.adjuster = adjusterData;
    this.addTimelineEntry(
      'Adjuster Assignment',
      `Assigned to ${adjusterData.name}`,
      'System',
    );
  }

  getProcessingTime(): number | null {
    if (
      this.status === ClaimStatus.CLOSED ||
      this.status === ClaimStatus.DENIED
    ) {
      const closedDate = this.updatedAt;
      const reportedDate = this.reportedDate;
      const diffTime = closedDate.getTime() - reportedDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
  }
}
