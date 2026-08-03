export enum PreTripInspectionWorkflowStatus {
  PENDING = 'PENDING',
  TRUCK_INSPECTION_COMPLETED = 'TRUCK_INSPECTION_COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  AWAITING_RESOLUTION = 'AWAITING_RESOLUTION',
  READY_FOR_RE_INSPECTION = 'READY_FOR_RE_INSPECTION',
  AWAITING_CARGO_OWNER_APPROVAL = 'AWAITING_CARGO_OWNER_APPROVAL',
  APPROVED = 'APPROVED',
}

/** Where the multi-step driver workflow should resume. */
export type PreTripResumeStep =
  | 'TRUCK'
  | 'CARGO'
  | 'WAITING'
  | 'BLOCKED'
  | 'READY_TO_START';

export enum CargoInspectionType {
  PRE_TRIP = 'PRE_TRIP',
  DELIVERY = 'DELIVERY',
}

export enum InspectionDecision {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CONDITIONAL = 'CONDITIONAL',
}

export interface TruckInspectionRecord {
  completed: boolean;
  completedAt?: string;
  completedById?: string;
  checklist?: Array<{
    id: string;
    label: string;
    verified: boolean;
    notes?: string;
  }>;
  documents?: Array<{
    id: string;
    url: string;
    type: 'photo' | 'document' | 'signature';
    label?: string;
    uploadedAt: string;
  }>;
  notes?: string;
}

export interface PreTripInspectionMetadata {
  status: PreTripInspectionWorkflowStatus;
  lastInspectionId?: string;
  lastDriverUserId?: string;
  approvedAt?: string;
  approvedById?: string;
  approvalNotes?: string;
  submittedForApprovalAt?: string;
  currentAttempt?: number;
  lastFailedAt?: string;
  resolutionNotes?: string;
  readyForReInspectionAt?: string;
  resolvedById?: string;
  resolvedAt?: string;
  /** Persisted truck/vehicle pre-trip checklist — never cleared on cargo re-inspection. */
  truckInspection?: TruckInspectionRecord;
}

export interface PreTripInspectionIssue {
  id: string;
  type:
    | 'WEIGHT_MISMATCH'
    | 'MISSING_PACKAGES'
    | 'DAMAGED_CARGO'
    | 'INCORRECT_DOCUMENTATION'
    | 'BROKEN_SEAL'
    | 'UNSAFE_PACKAGING'
    | 'WRONG_CARGO'
    | 'LABEL_MISMATCH'
    | 'HAZARDOUS_LEAKAGE'
    | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location?: string;
  actionRequired?: string;
  resolved: boolean;
  resolutionNotes?: string;
}

export const PRE_TRIP_INSPECTION_BLOCKED_MESSAGE =
  'This shipment cannot proceed until the driver completes the pre-trip inspection and the assigned Cargo Owner or Broker gives approval to start shipping.';

export function getPreTripInspectionMetadata(
  metadata?: Record<string, any>,
): PreTripInspectionMetadata {
  const stored = metadata?.preTripInspection as
    | PreTripInspectionMetadata
    | undefined;
  const inspectionStatus = metadata?.inspectionStatus;

  if (
    stored?.status === PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION ||
    inspectionStatus === 'READY_FOR_RE_INSPECTION' ||
    inspectionStatus === PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION
  ) {
    return {
      ...(stored || {}),
      status: PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION,
      truckInspection: stored?.truckInspection,
    };
  }

  if (stored?.status) {
    const result = stored as PreTripInspectionMetadata;
    if (result.status === PreTripInspectionWorkflowStatus.FAILED) {
      return {
        ...result,
        status: PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION,
      };
    }
    return result;
  }

  // Backward compatibility with legacy metadata.inspectionStatus
  if (inspectionStatus === 'COMPLETED') {
    const legacyResult = metadata?.inspectionResult;
    if (legacyResult?.status === 'PASSED') {
      return { status: PreTripInspectionWorkflowStatus.APPROVED };
    }
    if (legacyResult?.status === 'FAILED') {
      return { status: PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION };
    }
    return { status: PreTripInspectionWorkflowStatus.APPROVED };
  }

  if (inspectionStatus === 'FAILED') {
    return { status: PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION };
  }

  if (inspectionStatus === 'IN_PROGRESS') {
    return { status: PreTripInspectionWorkflowStatus.IN_PROGRESS };
  }

  if (inspectionStatus === 'TRUCK_INSPECTION_COMPLETED') {
    return {
      status: PreTripInspectionWorkflowStatus.TRUCK_INSPECTION_COMPLETED,
      truckInspection: stored?.truckInspection,
    };
  }

  return { status: PreTripInspectionWorkflowStatus.PENDING };
}

export function isTruckInspectionCompleted(
  workflow: PreTripInspectionMetadata,
): boolean {
  return Boolean(workflow.truckInspection?.completed);
}

/**
 * Resolve which step the driver workflow should open on.
 * - Approved → Start Trip only (never re-run truck/cargo)
 * - Ready for re-inspection → Cargo only (never re-run truck)
 * - Truck done + pending cargo → Cargo
 * - Otherwise → Truck first
 */
export function resolvePreTripResumeStep(
  workflow: PreTripInspectionMetadata,
): PreTripResumeStep {
  switch (workflow.status) {
    case PreTripInspectionWorkflowStatus.APPROVED:
      return 'READY_TO_START';
    case PreTripInspectionWorkflowStatus.AWAITING_CARGO_OWNER_APPROVAL:
      return 'WAITING';
    case PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION:
    case PreTripInspectionWorkflowStatus.FAILED:
      return 'BLOCKED';
    case PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION:
      return 'CARGO';
    case PreTripInspectionWorkflowStatus.TRUCK_INSPECTION_COMPLETED:
    case PreTripInspectionWorkflowStatus.IN_PROGRESS:
      return isTruckInspectionCompleted(workflow) ||
        workflow.status ===
          PreTripInspectionWorkflowStatus.TRUCK_INSPECTION_COMPLETED
        ? 'CARGO'
        : 'TRUCK';
    case PreTripInspectionWorkflowStatus.PENDING:
    default:
      return isTruckInspectionCompleted(workflow) ? 'CARGO' : 'TRUCK';
  }
}

export function getPreTripDisplayLabel(
  status: PreTripInspectionWorkflowStatus,
  options?: { currentAttempt?: number },
): string {
  switch (status) {
    case PreTripInspectionWorkflowStatus.PENDING:
      return 'Draft';
    case PreTripInspectionWorkflowStatus.TRUCK_INSPECTION_COMPLETED:
      return 'Truck Inspection Completed';
    case PreTripInspectionWorkflowStatus.IN_PROGRESS:
      return 'Cargo Inspection In Progress';
    case PreTripInspectionWorkflowStatus.FAILED:
    case PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION:
      return 'Issue Reported — Awaiting Resolution';
    case PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION:
      return 'Ready for Re-Inspection';
    case PreTripInspectionWorkflowStatus.AWAITING_CARGO_OWNER_APPROVAL:
      return (options?.currentAttempt ?? 1) > 1
        ? 'Pending Final Approval'
        : 'Waiting for Approval';
    case PreTripInspectionWorkflowStatus.APPROVED:
      return 'Inspection Approved — Ready to Start Trip';
    default:
      return status;
  }
}

export function requiresPreTripOwnerResolution(
  status: PreTripInspectionWorkflowStatus,
): boolean {
  return (
    status === PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION ||
    status === PreTripInspectionWorkflowStatus.FAILED
  );
}

export function isPreTripInspectionApproved(
  metadata?: Record<string, any>,
): boolean {
  return (
    getPreTripInspectionMetadata(metadata).status ===
    PreTripInspectionWorkflowStatus.APPROVED
  );
}

export function canDriverPerformCargoInspection(
  status: PreTripInspectionWorkflowStatus,
): boolean {
  return [
    PreTripInspectionWorkflowStatus.TRUCK_INSPECTION_COMPLETED,
    PreTripInspectionWorkflowStatus.IN_PROGRESS,
    PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION,
  ].includes(status);
}
