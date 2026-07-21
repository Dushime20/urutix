export enum PreTripInspectionWorkflowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  AWAITING_RESOLUTION = 'AWAITING_RESOLUTION',
  READY_FOR_RE_INSPECTION = 'READY_FOR_RE_INSPECTION',
  AWAITING_CARGO_OWNER_APPROVAL = 'AWAITING_CARGO_OWNER_APPROVAL',
  APPROVED = 'APPROVED',
}

export enum CargoInspectionType {
  PRE_TRIP = 'PRE_TRIP',
  DELIVERY = 'DELIVERY',
}

export enum InspectionDecision {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CONDITIONAL = 'CONDITIONAL',
}

export interface PreTripInspectionMetadata {
  status: PreTripInspectionWorkflowStatus;
  lastInspectionId?: string;
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

  return { status: PreTripInspectionWorkflowStatus.PENDING };
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
