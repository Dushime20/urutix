export enum PreTripInspectionWorkflowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
  AWAITING_RESOLUTION = 'AWAITING_RESOLUTION',
  READY_FOR_RE_INSPECTION = 'READY_FOR_RE_INSPECTION',
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
  currentAttempt?: number;
  lastFailedAt?: string;
  resolutionNotes?: string;
  readyForReInspectionAt?: string;
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
  'This shipment cannot proceed because the Pre-Trip Inspection has not been approved. Please wait for the Cargo Owner or Broker to resolve the reported issues.';

export function getPreTripInspectionMetadata(
  metadata?: Record<string, any>,
): PreTripInspectionMetadata {
  const stored = metadata?.preTripInspection;
  if (stored?.status) {
    return stored as PreTripInspectionMetadata;
  }

  // Backward compatibility with legacy metadata.inspectionStatus
  if (metadata?.inspectionStatus === 'COMPLETED') {
    const legacyResult = metadata?.inspectionResult;
    if (legacyResult?.status === 'PASSED') {
      return { status: PreTripInspectionWorkflowStatus.APPROVED };
    }
    if (legacyResult?.status === 'FAILED') {
      return { status: PreTripInspectionWorkflowStatus.FAILED };
    }
    return { status: PreTripInspectionWorkflowStatus.APPROVED };
  }

  return { status: PreTripInspectionWorkflowStatus.PENDING };
}

export function isPreTripInspectionApproved(
  metadata?: Record<string, any>,
): boolean {
  return (
    getPreTripInspectionMetadata(metadata).status ===
    PreTripInspectionWorkflowStatus.APPROVED
  );
}
