// ─── Dispute Types ─────────────────────────────────────────────────────────────

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'INVESTIGATING'
  | 'AWAITING_INFORMATION'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CLOSED'
  | 'REOPENED';

export type DisputeCategory =
  | 'PAYMENT_ISSUE'
  | 'DELIVERY_DELAY'
  | 'CARGO_DAMAGE'
  | 'CARGO_LOSS'
  | 'ROUTE_VIOLATION'
  | 'CONTRACT_VIOLATION'
  | 'DRIVER_MISCONDUCT'
  | 'VEHICLE_DAMAGE'
  | 'LOADING_DELAY'
  | 'UNLOADING_DELAY'
  | 'DOCUMENTATION_ISSUE'
  | 'FRAUD_SUSPECTED'
  | 'TRUCK_BREAKDOWN'
  | 'AUCTION_ISSUE'
  | 'BROKER_COMPLAINT'
  | 'LENDER_COMPLAINT'
  | 'IDENTITY_VERIFICATION'
  | 'INSURANCE_CLAIM'
  | 'ACCOUNT_SUSPENSION'
  | 'TECHNICAL_PROBLEM'
  | 'BILLING_ISSUE'
  | 'SUBSCRIPTION_ISSUE'
  | 'FEATURE_REQUEST'
  | 'SECURITY_CONCERN'
  | 'OTHER';

export type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DisputeDecision =
  | 'FAVOR_COMPLAINANT'
  | 'FAVOR_RESPONDENT'
  | 'MUTUAL_SETTLEMENT';

export type SupportAssigneeRole =
  | 'SUPPORT_OFFICER'
  | 'OPERATIONS_MANAGER'
  | 'FINANCE_OFFICER'
  | 'COMPLIANCE_OFFICER'
  | 'LEGAL_OFFICER'
  | 'ADMIN';

export type EscalationReason =
  | 'SLA_BREACH'
  | 'CRITICAL_UNRESPONDED'
  | 'MULTIPLE_REOPENS'
  | 'FRAUD_DETECTED'
  | 'PAYMENT_DISPUTE_THRESHOLD'
  | 'MANUAL';

export interface DisputeUser {
  id: string;
  email: string;
  role?: string;
  profile?: { firstName?: string; lastName?: string };
}

export interface Dispute {
  id: string;
  tenantId: string;
  referenceNumber: string;
  ticketNumber?: string;
  title: string;
  description: string;
  category: DisputeCategory;
  priority: DisputePriority;
  status: DisputeStatus;
  complainantUserId: string;
  respondentUserId?: string;
  assignedToUserId?: string;
  assignedRole?: SupportAssigneeRole;
  assignedAt?: string;
  tripId?: string;
  shipmentId?: string;
  truckId?: string;
  contractId?: string;
  invoiceId?: string;
  auctionId?: string;
  paymentId?: string;
  driverId?: string;
  brokerId?: string;
  lenderId?: string;
  location?: string;
  incidentDate?: string;
  additionalNotes?: string;
  slaFirstResponseDue?: string;
  slaResolutionDue?: string;
  firstResponseAt?: string;
  slaFirstResponseBreached: boolean;
  slaResolutionBreached: boolean;
  reopenCount: number;
  escalationLevel: number;
  escalationReason?: EscalationReason;
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  resolvedAt?: string;
  complainant?: DisputeUser;
  respondent?: DisputeUser;
  assignedTo?: DisputeUser;
  trip?: { id: string; tripNumber?: string; status?: string };
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  sender?: DisputeUser;
}

export interface DisputeAttachment {
  id: string;
  disputeId: string;
  uploadedBy: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  createdAt: string;
  uploader?: DisputeUser;
}

export interface DisputeResolution {
  id: string;
  disputeId: string;
  resolvedBy: string;
  decision: DisputeDecision;
  resolutionSummary: string;
  adminNotes?: string;
  resolvedAt: string;
  resolver?: DisputeUser;
}

export interface DisputeTimeline {
  type: 'audit' | 'message';
  data: any;
  timestamp: string;
}

export interface DisputeAssignment {
  id: string;
  disputeId: string;
  assignedByUserId: string;
  assignedToUserId: string;
  assignedRole?: SupportAssigneeRole;
  notes?: string;
  createdAt: string;
  assignedBy?: DisputeUser;
  assignedTo?: DisputeUser;
}

export interface DisputeAnalytics {
  total: number;
  open: number;
  underReview: number;
  assigned: number;
  investigating: number;
  waitingForUser: number;
  escalated: number;
  resolved: number;
  closed: number;
  rejected: number;
  reopened: number;
  avgResolutionTimeHours: number;
  avgFirstResponseTimeMinutes: number;
  slaCompliancePercent: number;
  slaBreached: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  monthlyTrend: Record<string, number>;
}

// ─── Label helpers ──────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<DisputeCategory, string> = {
  PAYMENT_ISSUE:        'Payment Issue',
  DELIVERY_DELAY:       'Late Delivery',
  CARGO_DAMAGE:         'Cargo Damage',
  CARGO_LOSS:           'Cargo Loss',
  ROUTE_VIOLATION:      'Route Violation',
  CONTRACT_VIOLATION:   'Contract Dispute',
  DRIVER_MISCONDUCT:    'Driver Misconduct',
  VEHICLE_DAMAGE:       'Vehicle Damage',
  LOADING_DELAY:        'Loading Delay',
  UNLOADING_DELAY:      'Unloading Delay',
  DOCUMENTATION_ISSUE:  'Document Issue',
  FRAUD_SUSPECTED:      'Fraud',
  TRUCK_BREAKDOWN:      'Truck Breakdown',
  AUCTION_ISSUE:        'Auction Issue',
  BROKER_COMPLAINT:     'Broker Complaint',
  LENDER_COMPLAINT:     'Lender Complaint',
  IDENTITY_VERIFICATION:'Identity Verification',
  INSURANCE_CLAIM:      'Insurance Claim',
  ACCOUNT_SUSPENSION:   'Account Suspension',
  TECHNICAL_PROBLEM:    'Technical Problem',
  BILLING_ISSUE:        'Billing Issue',
  SUBSCRIPTION_ISSUE:   'Subscription Issue',
  FEATURE_REQUEST:      'Feature Request',
  SECURITY_CONCERN:     'Security Concern',
  OTHER:                'Other',
};

export const PRIORITY_LABELS: Record<DisputePriority, string> = {
  LOW:      'Low',
  MEDIUM:   'Medium',
  HIGH:     'High',
  CRITICAL: 'Critical',
};

export const STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN:                 'Open',
  UNDER_REVIEW:         'Under Review',
  ASSIGNED:             'Assigned',
  INVESTIGATING:        'Investigating',
  AWAITING_INFORMATION: 'Waiting for User',
  ESCALATED:            'Escalated',
  RESOLVED:             'Resolved',
  REJECTED:             'Rejected',
  CLOSED:               'Closed',
  REOPENED:             'Reopened',
};

export const DECISION_LABELS: Record<DisputeDecision, string> = {
  FAVOR_COMPLAINANT: 'Favor Reporter',
  FAVOR_RESPONDENT:  'Favor Respondent',
  MUTUAL_SETTLEMENT: 'Mutual Settlement',
};

export const ASSIGNEE_ROLE_LABELS: Record<SupportAssigneeRole, string> = {
  SUPPORT_OFFICER:    'Support Officer',
  OPERATIONS_MANAGER: 'Operations Manager',
  FINANCE_OFFICER:    'Finance Officer',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  LEGAL_OFFICER:      'Legal Officer',
  ADMIN:              'Admin',
};

export const ESCALATION_REASON_LABELS: Record<EscalationReason, string> = {
  SLA_BREACH:                  'SLA Breach',
  CRITICAL_UNRESPONDED:        'Critical Unanswered',
  MULTIPLE_REOPENS:            'Multiple Reopens',
  FRAUD_DETECTED:              'Fraud Detected',
  PAYMENT_DISPUTE_THRESHOLD:   'Payment Dispute Threshold',
  MANUAL:                      'Manual Escalation',
};

export function getStatusColor(status: DisputeStatus): string {
  const map: Record<DisputeStatus, string> = {
    OPEN:                 'bg-blue-50 text-blue-700 border-blue-200',
    UNDER_REVIEW:         'bg-amber-50 text-amber-700 border-amber-200',
    ASSIGNED:             'bg-cyan-50 text-cyan-700 border-cyan-200',
    INVESTIGATING:        'bg-violet-50 text-violet-700 border-violet-200',
    AWAITING_INFORMATION: 'bg-purple-50 text-purple-700 border-purple-200',
    ESCALATED:            'bg-orange-50 text-orange-700 border-orange-200',
    RESOLVED:             'bg-green-50 text-green-700 border-green-200',
    REJECTED:             'bg-red-50 text-red-700 border-red-200',
    CLOSED:               'bg-gray-100 text-gray-600 border-gray-200',
    REOPENED:             'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return map[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';
}

export function getPriorityColor(priority: DisputePriority): string {
  const map: Record<DisputePriority, string> = {
    LOW:      'bg-gray-50 text-gray-500 border-gray-200',
    MEDIUM:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    HIGH:     'bg-orange-50 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[priority] ?? 'bg-gray-50 text-gray-500 border-gray-200';
}

export function getPriorityDot(priority: DisputePriority): string {
  const map: Record<DisputePriority, string> = {
    LOW:      'bg-gray-400',
    MEDIUM:   'bg-yellow-500',
    HIGH:     'bg-orange-500',
    CRITICAL: 'bg-red-500',
  };
  return map[priority] ?? 'bg-gray-400';
}

export function getUserDisplayName(user?: DisputeUser | null): string {
  if (!user) return 'Unknown';
  const { firstName, lastName } = user.profile ?? {};
  if (firstName || lastName) return `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return user.email ?? 'Unknown';
}

export function formatRelativeTime(date: string): string {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getSlaStatus(dispute: Dispute): 'ok' | 'warning' | 'breached' {
  if (dispute.slaResolutionBreached || dispute.slaFirstResponseBreached) return 'breached';
  const now = Date.now();
  const resDue = dispute.slaResolutionDue ? new Date(dispute.slaResolutionDue).getTime() : null;
  const frDue  = dispute.slaFirstResponseDue ? new Date(dispute.slaFirstResponseDue).getTime() : null;
  const warningThreshold = 0.8; // 80% of SLA used
  if (resDue && !['RESOLVED','CLOSED'].includes(dispute.status)) {
    const created = new Date(dispute.createdAt).getTime();
    const total = resDue - created;
    const elapsed = now - created;
    if (elapsed / total > warningThreshold) return 'warning';
  }
  if (frDue && !dispute.firstResponseAt) {
    const created = new Date(dispute.createdAt).getTime();
    const total = frDue - created;
    const elapsed = now - created;
    if (elapsed / total > warningThreshold) return 'warning';
  }
  return 'ok';
}
