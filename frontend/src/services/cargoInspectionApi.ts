import api from './api';

export interface InspectionRecord {
  id: string;
  inspectionType: 'PRE_TRIP' | 'DELIVERY';
  status: string;
  decision?: string;
  attemptNumber: number;
  checklist: Array<{
    id: string;
    label: string;
    originalValue?: unknown;
    verified: boolean;
    notes?: string;
    discrepancy?: boolean;
    category?: string;
  }>;
  overallNotes?: string;
  allItemsVerified: boolean;
  verifiedCount: number;
  totalItems: number;
  discrepancyCount: number;
  discrepancies?: Array<{
    itemId: string;
    itemLabel: string;
    originalValue: unknown;
    receivedValue?: unknown;
    notes: string;
  }>;
  issues?: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    location?: string;
    actionRequired?: string;
    resolved: boolean;
    resolutionNotes?: string;
  }>;
  documents?: Array<{
    id: string;
    url: string;
    type: 'photo' | 'document' | 'signature';
    label?: string;
    uploadedAt: string;
  }>;
  verificationData?: Record<string, unknown>;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentInspectionOverview {
  loadId: string;
  loadTitle: string;
  loadReference?: string;
  loadStatus: string;
  updatedAt: string;
  driver?: { id: string; name: string; phone?: string } | null;
  receiver?: { id: string; name?: string; email?: string; phone?: string } | null;
  preTrip: {
    workflowStatus: string;
    approvedAt?: string;
    approvedById?: string;
    approvalNotes?: string;
    submittedForApprovalAt?: string;
    lastFailedAt?: string;
    resolutionNotes?: string;
    readyForReInspectionAt?: string;
    resolvedAt?: string;
    resolvedById?: string;
    currentAttempt: number;
    historyCount: number;
    requiresAction: boolean;
    latestInspection: InspectionRecord | null;
    history: InspectionRecord[];
  };
  postTrip: {
    status: string;
    latestInspection: InspectionRecord | null;
    history: InspectionRecord[];
  };
  requiresAction: boolean;
}

export interface ResolvedIssuePayload {
  issueId: string;
  correctiveAction?: string;
}

export interface MarkReadyForReInspectionPayload {
  resolutionNotes: string;
  resolvedIssues?: ResolvedIssuePayload[];
}

export interface CargoInspectionOverviewResponse {
  success: boolean;
  data: {
    shipments: ShipmentInspectionOverview[];
    summary: {
      total: number;
      preTripPending: number;
      preTripAwaitingAction: number;
      preTripApproved: number;
      postCompleted: number;
      postWithIssues: number;
      requiresAction: number;
    };
  };
}

export const cargoInspectionApi = {
  getOverview: () =>
    api.get<CargoInspectionOverviewResponse>('/loads-v2/my-cargo-inspections'),

  getPreTripHistory: (loadId: string) =>
    api.get(`/loads-v2/${loadId}/pre-trip-inspection/history`),

  markReadyForReInspection: (loadId: string, payload: MarkReadyForReInspectionPayload) =>
    api.patch(`/loads-v2/${loadId}/pre-trip-inspection/ready-for-reinspection`, payload),

  approvePreTripInspection: (loadId: string, approvalNotes?: string) =>
    api.patch(`/loads-v2/${loadId}/pre-trip-inspection/approve`, {
      approvalNotes,
    }),
};
