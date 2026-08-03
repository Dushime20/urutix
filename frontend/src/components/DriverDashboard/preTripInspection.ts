export type PreTripInspectionWorkflowStatus =
  | 'PENDING'
  | 'TRUCK_INSPECTION_COMPLETED'
  | 'IN_PROGRESS'
  | 'FAILED'
  | 'AWAITING_RESOLUTION'
  | 'READY_FOR_RE_INSPECTION'
  | 'AWAITING_CARGO_OWNER_APPROVAL'
  | 'APPROVED';

export type PreTripResumeStep =
  | 'TRUCK'
  | 'CARGO'
  | 'WAITING'
  | 'BLOCKED'
  | 'READY_TO_START';

export const PRE_TRIP_INSPECTION_BLOCKED_MESSAGE =
  'This shipment cannot proceed until the driver completes the pre-trip inspection and the assigned Cargo Owner or Broker gives approval to start shipping.';

export function getPreTripStatusFromLoad(load: any): PreTripInspectionWorkflowStatus {
  const workflow =
    load?.preTripInspection?.status ||
    load?.metadata?.preTripInspection?.status ||
    load?.workflowStatus;
  if (workflow) return workflow;

  const inspectionStatus = load?.metadata?.inspectionStatus;
  if (inspectionStatus === 'READY_FOR_RE_INSPECTION') {
    return 'READY_FOR_RE_INSPECTION';
  }
  if (inspectionStatus === 'TRUCK_INSPECTION_COMPLETED') {
    return 'TRUCK_INSPECTION_COMPLETED';
  }
  if (inspectionStatus === 'IN_PROGRESS') {
    return 'IN_PROGRESS';
  }

  if (load?.metadata?.inspectionStatus === 'COMPLETED') {
    const result = load?.metadata?.inspectionResult?.status;
    if (result === 'FAILED') return 'FAILED';
    return 'APPROVED';
  }

  if (inspectionStatus === 'FAILED') {
    return 'AWAITING_RESOLUTION';
  }

  return 'PENDING';
}

export function getTruckInspectionFromLoad(load: any): {
  completed: boolean;
  completedAt?: string;
  checklist?: Array<{ id: string; label: string; verified: boolean }>;
} | null {
  const truck =
    load?.preTripInspection?.truckInspection ||
    load?.truckInspection ||
    load?.metadata?.preTripInspection?.truckInspection;
  if (!truck) return null;
  return truck;
}

export function isTruckInspectionCompleted(loadOrStatus: any): boolean {
  if (typeof loadOrStatus === 'object' && loadOrStatus !== null) {
    if (loadOrStatus.truckInspectionCompleted === true) return true;
    if (loadOrStatus.preTripInspection?.truckInspectionCompleted === true) return true;
    const truck = getTruckInspectionFromLoad(loadOrStatus);
    if (truck?.completed) return true;
    const status = getPreTripStatusFromLoad(loadOrStatus);
    return (
      status === 'TRUCK_INSPECTION_COMPLETED' ||
      status === 'IN_PROGRESS' ||
      status === 'AWAITING_CARGO_OWNER_APPROVAL' ||
      status === 'AWAITING_RESOLUTION' ||
      status === 'READY_FOR_RE_INSPECTION' ||
      status === 'APPROVED' ||
      status === 'FAILED'
    );
  }
  return false;
}

export function resolveResumeStep(
  status: PreTripInspectionWorkflowStatus,
  options?: { truckCompleted?: boolean; currentAttempt?: number },
): PreTripResumeStep {
  switch (status) {
    case 'APPROVED':
      return 'READY_TO_START';
    case 'AWAITING_CARGO_OWNER_APPROVAL':
      return 'WAITING';
    case 'AWAITING_RESOLUTION':
    case 'FAILED':
      return 'BLOCKED';
    case 'READY_FOR_RE_INSPECTION':
      return 'CARGO';
    case 'TRUCK_INSPECTION_COMPLETED':
    case 'IN_PROGRESS':
      return 'CARGO';
    case 'PENDING':
    default:
      return options?.truckCompleted ? 'CARGO' : 'TRUCK';
  }
}

export function canProceedWithLoad(status: PreTripInspectionWorkflowStatus): boolean {
  return status === 'APPROVED';
}

export function canOpenCargoInspection(status: PreTripInspectionWorkflowStatus): boolean {
  return [
    'TRUCK_INSPECTION_COMPLETED',
    'IN_PROGRESS',
    'READY_FOR_RE_INSPECTION',
  ].includes(status);
}

export function getInspectionStatusLabel(
  status: PreTripInspectionWorkflowStatus,
  options?: { currentAttempt?: number },
): string {
  switch (status) {
    case 'PENDING':
      return 'Draft';
    case 'TRUCK_INSPECTION_COMPLETED':
      return 'Truck Inspection Completed';
    case 'IN_PROGRESS':
      return 'Cargo Inspection In Progress';
    case 'FAILED':
      return 'Issue Reported';
    case 'AWAITING_RESOLUTION':
      return 'Awaiting Resolution';
    case 'READY_FOR_RE_INSPECTION':
      return 'Ready for Re-Inspection';
    case 'AWAITING_CARGO_OWNER_APPROVAL':
      return (options?.currentAttempt ?? 1) > 1
        ? 'Pending Final Approval'
        : 'Waiting for Approval';
    case 'APPROVED':
      return 'Inspection Approved — Ready to Start Trip';
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
    case 'AWAITING_CARGO_OWNER_APPROVAL':
      return 'text-violet-600 bg-violet-50 border-violet-100';
    case 'TRUCK_INSPECTION_COMPLETED':
      return 'text-sky-600 bg-sky-50 border-sky-100';
    case 'IN_PROGRESS':
      return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    case 'PENDING':
    default:
      return 'text-amber-600 bg-amber-50 border-amber-100';
  }
}

/** Primary CTA label for driver inspection lists / hubs. */
export function getInspectionActionLabel(
  status: PreTripInspectionWorkflowStatus,
): string {
  switch (status) {
    case 'PENDING':
      return 'Continue Inspection';
    case 'TRUCK_INSPECTION_COMPLETED':
    case 'IN_PROGRESS':
      return 'Continue Cargo Inspection';
    case 'READY_FOR_RE_INSPECTION':
      return 'Re-Inspect Cargo';
    case 'AWAITING_CARGO_OWNER_APPROVAL':
      return 'View Submitted Inspection';
    case 'APPROVED':
      return 'Start Trip';
    case 'AWAITING_RESOLUTION':
    case 'FAILED':
      return 'View Submitted Inspection';
    default:
      return 'Continue Inspection';
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
