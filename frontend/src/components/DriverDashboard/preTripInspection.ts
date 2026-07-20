export type PreTripInspectionWorkflowStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'FAILED'
  | 'AWAITING_RESOLUTION'
  | 'READY_FOR_RE_INSPECTION'
  | 'APPROVED';

export const PRE_TRIP_INSPECTION_BLOCKED_MESSAGE =
  'This shipment cannot proceed because the Pre-Trip Inspection has not been approved. Please wait for the Cargo Owner or Broker to resolve the reported issues.';

export function getPreTripStatusFromLoad(load: any): PreTripInspectionWorkflowStatus {
  const workflow = load?.preTripInspection?.status || load?.metadata?.preTripInspection?.status;
  if (workflow) return workflow;

  if (load?.metadata?.inspectionStatus === 'COMPLETED') {
    const result = load?.metadata?.inspectionResult?.status;
    if (result === 'FAILED') return 'FAILED';
    return 'APPROVED';
  }

  return 'PENDING';
}

export function canProceedWithLoad(status: PreTripInspectionWorkflowStatus): boolean {
  return status === 'APPROVED';
}

export function getInspectionStatusLabel(status: PreTripInspectionWorkflowStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending Inspection';
    case 'IN_PROGRESS':
      return 'Inspection In Progress';
    case 'FAILED':
      return 'Failed';
    case 'AWAITING_RESOLUTION':
      return 'Awaiting Resolution';
    case 'READY_FOR_RE_INSPECTION':
      return 'Ready for Re-Inspection';
    case 'APPROVED':
      return 'Approved';
    default:
      return status;
  }
}

export function getInspectionStatusStyles(status: PreTripInspectionWorkflowStatus): string {
  switch (status) {
    case 'APPROVED':
      return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    case 'FAILED':
    case 'AWAITING_RESOLUTION':
      return 'text-rose-600 bg-rose-50 border-rose-100';
    case 'READY_FOR_RE_INSPECTION':
      return 'text-blue-600 bg-blue-50 border-blue-100';
    case 'IN_PROGRESS':
      return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    case 'PENDING':
    default:
      return 'text-amber-600 bg-amber-50 border-amber-100';
  }
}

export interface SubmitPreTripInspectionPayload {
  decision: 'PASSED' | 'FAILED' | 'CONDITIONAL';
  notes: string;
  checklist?: Array<{
    id: string;
    label: string;
    verified: boolean;
    notes?: string;
    discrepancy?: boolean;
  }>;
  verification?: {
    identityVerified?: boolean;
    quantityVerified?: boolean;
    actualQuantity?: number;
    weightVerified?: boolean;
    actualWeight?: number;
    dimensionsVerified?: boolean;
    actualDimensions?: { length?: number; width?: number; height?: number };
    packagingVerified?: boolean;
    conditionVerified?: boolean;
    documentationVerified?: boolean;
    sealVerified?: boolean;
    sealNumber?: string;
  };
  issues?: Array<{
    type: string;
    severity: string;
    description: string;
    location?: string;
    actionRequired?: string;
  }>;
  photos?: string[];
  documents?: Array<{
    id: string;
    url: string;
    type: 'photo' | 'document' | 'signature';
    label?: string;
    uploadedAt: string;
  }>;
}
