// ─── Dispute Types ─────────────────────────────────────────────────────────────

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
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
  | 'OTHER';

export type DisputePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DisputeDecision =
  | 'FAVOR_COMPLAINANT'
  | 'FAVOR_RESPONDENT'
  | 'MUTUAL_SETTLEMENT';

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
  title: string;
  description: string;
  category: DisputeCategory;
  priority: DisputePriority;
  status: DisputeStatus;
  complainantUserId: string;
  respondentUserId?: string;
  tripId?: string;
  shipmentId?: string;
  truckId?: string;
  contractId?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  resolvedAt?: string;
  complainant?: DisputeUser;
  respondent?: DisputeUser;
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

export interface DisputeAnalytics {
  total: number;
  open: number;
  underReview: number;
  resolved: number;
  closed: number;
  escalated: number;
  rejected: number;
  avgResolutionTimeHours: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

// ─── Label helpers ─────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<DisputeCategory, string> = {
  PAYMENT_ISSUE:       'Payment Issue',
  DELIVERY_DELAY:      'Delivery Delay',
  CARGO_DAMAGE:        'Cargo Damage',
  CARGO_LOSS:          'Cargo Loss',
  ROUTE_VIOLATION:     'Route Violation',
  CONTRACT_VIOLATION:  'Contract Violation',
  DRIVER_MISCONDUCT:   'Driver Misconduct',
  VEHICLE_DAMAGE:      'Vehicle Damage',
  LOADING_DELAY:       'Loading Delay',
  UNLOADING_DELAY:     'Unloading Delay',
  DOCUMENTATION_ISSUE: 'Documentation Issue',
  FRAUD_SUSPECTED:     'Fraud Suspected',
  OTHER:               'Other',
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
  AWAITING_INFORMATION: 'Awaiting Info',
  ESCALATED:            'Escalated',
  RESOLVED:             'Resolved',
  REJECTED:             'Rejected',
  CLOSED:               'Closed',
  REOPENED:             'Reopened',
};

export const DECISION_LABELS: Record<DisputeDecision, string> = {
  FAVOR_COMPLAINANT: 'Favor Complainant',
  FAVOR_RESPONDENT:  'Favor Respondent',
  MUTUAL_SETTLEMENT: 'Mutual Settlement',
};

export function getStatusColor(status: DisputeStatus): string {
  const map: Record<DisputeStatus, string> = {
    OPEN:                 'bg-blue-50 text-blue-700 border-blue-200',
    UNDER_REVIEW:         'bg-amber-50 text-amber-700 border-amber-200',
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

export function getUserDisplayName(user?: DisputeUser | null): string {
  if (!user) return 'Unknown';
  const { firstName, lastName } = user.profile ?? {};
  if (firstName || lastName) return `${firstName ?? ''} ${lastName ?? ''}`.trim();
  return user.email ?? 'Unknown';
}

export function formatRelativeTime(date: string): string {
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
