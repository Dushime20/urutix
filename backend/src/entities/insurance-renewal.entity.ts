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

export enum RenewalStatus {
  PENDING = 'pending',
  URGENT = 'urgent',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum CustomerDecision {
  ACCEPT = 'accept',
  DECLINE = 'decline',
  MODIFY = 'modify',
  PENDING = 'pending',
}

export enum RenewalDecision {
  RENEWED = 'renewed',
  SWITCHED = 'switched',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

@Entity('insurance_renewals')
export class InsuranceRenewal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  renewalNumber: string;

  @Column({ type: 'uuid' })
  @Index()
  policyId: string;

  @ManyToOne(() => InsurancePolicy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'policyId' })
  policy: InsurancePolicy;

  @Column({ type: 'uuid' })
  @Index()
  truckId: string;

  @ManyToOne(() => Truck, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @Column({ type: 'date' })
  @Index()
  currentPolicyEndDate: Date;

  @Column({ type: 'date' })
  @Index()
  renewalDate: Date;

  @Column({
    type: 'enum',
    enum: RenewalStatus,
    default: RenewalStatus.PENDING,
  })
  @Index()
  status: RenewalStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  currentPremium: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  estimatedPremium: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  finalPremium: number;

  @Column({ default: false })
  autoRenew: boolean;

  @Column('json', { nullable: true })
  coverageChanges: Array<{
    type: string;
    description: string;
    impact: string; // 'increase', 'decrease', 'new', 'removed'
  }>;

  @Column('json')
  renewalTerms: {
    duration: number; // months
    paymentFrequency: 'monthly' | 'quarterly' | 'annually' | 'lump_sum';
    gracePeriod: number; // days
  };

  @Column('json', { nullable: true })
  agent: {
    name: string;
    email: string;
    phone: string;
    notes: string;
  };

  @Column('json', { nullable: true })
  customerResponse: {
    responded: boolean;
    responseDate: Date;
    decision: CustomerDecision;
    notes: string;
    requestedChanges: string[];
  };

  @Column('json', { nullable: true })
  documents: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;

  @Column('json', { nullable: true })
  reminders: Array<{
    type: 'email' | 'sms' | 'push' | 'mail';
    sentDate: Date;
    recipient: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
  }>;

  @Column('json', { nullable: true })
  timeline: Array<{
    action: string;
    description: string;
    date: Date;
    performedBy: string;
    notes: string;
  }>;

  @Column('json', { nullable: true })
  notes: Array<{
    content: string;
    author: string;
    timestamp: Date;
    isInternal: boolean;
  }>;

  @Column('json', { nullable: true })
  riskAssessment: {
    score: number;
    factors: Array<{
      factor: string;
      weight: number;
      score: number;
    }>;
    recommendations: string[];
  };

  @Column('json', { nullable: true })
  competitorQuotes: Array<{
    company: string;
    premium: number;
    coverage: string;
    notes: string;
    quoteDate: Date;
  }>;

  @Column('json', { nullable: true })
  finalDecision: {
    decision: RenewalDecision;
    decisionDate: Date;
    reason: string;
    newPolicyId: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties (calculated fields)
  get daysUntilRenewal(): number {
    const now = new Date();
    const renewal = new Date(this.renewalDate);
    const diffTime = renewal.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get daysUntilExpiration(): number {
    const now = new Date();
    const end = new Date(this.currentPolicyEndDate);
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get premiumChangePercentage(): number | null {
    if (!this.estimatedPremium || !this.currentPremium) return null;
    const change = this.estimatedPremium - this.currentPremium;
    return Math.round((change / this.currentPremium) * 100);
  }

  // Methods
  isUrgent(days: number = 30): boolean {
    return this.daysUntilRenewal <= days && this.daysUntilRenewal >= 0;
  }

  addTimelineEntry(
    action: string,
    description: string,
    performedBy: string,
    notes: string = '',
  ): void {
    if (!this.timeline) this.timeline = [];
    this.timeline.push({
      action,
      description,
      performedBy,
      notes,
      date: new Date(),
    });
  }

  addNote(content: string, author: string, isInternal: boolean = false): void {
    if (!this.notes) this.notes = [];
    this.notes.push({
      content,
      author,
      isInternal,
      timestamp: new Date(),
    });
  }

  sendReminder(type: string, recipient: string): void {
    if (!this.reminders) this.reminders = [];
    this.reminders.push({
      type: type as any,
      recipient,
      sentDate: new Date(),
      status: 'sent',
    });
    this.addTimelineEntry(
      'Reminder Sent',
      `${type} reminder sent to ${recipient}`,
      'System',
    );
  }

  updateStatus(newStatus: RenewalStatus, notes: string = ''): void {
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

  recordCustomerResponse(
    decision: CustomerDecision,
    notes: string = '',
    requestedChanges: string[] = [],
  ): void {
    this.customerResponse = {
      responded: true,
      responseDate: new Date(),
      decision,
      notes,
      requestedChanges,
    };
    this.addTimelineEntry(
      'Customer Response',
      `Customer ${decision} renewal`,
      'Customer',
    );
  }

  calculateRiskScore(): number {
    let totalScore = 0;
    let totalWeight = 0;

    if (this.riskAssessment?.factors) {
      this.riskAssessment.factors.forEach((factor) => {
        totalScore += factor.score * factor.weight;
        totalWeight += factor.weight;
      });
    }

    if (totalWeight > 0) {
      this.riskAssessment.score = Math.round(totalScore / totalWeight);
    }

    return this.riskAssessment?.score || 0;
  }
}
