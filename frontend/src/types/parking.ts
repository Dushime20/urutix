export type ParkingReservationStatus =
  | 'PENDING_REVIEW'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED';

export interface ParkingReservation {
  id: string;
  reservationReference: string;
  companyName: string;
  mcNumber: string;
  usdotNumber: string;
  companyPhone: string;
  email: string;
  driverEmail: string;
  driverFirstName: string;
  driverLastName: string;
  truckSpacesRequested: number;
  contractMonths: number;
  requestedStartDate: string;
  contractEndDate: string;
  status: ParkingReservationStatus;
  customerNotes?: string;
  internalNotes?: string;
  agreementAccepted: boolean;
  signature: string;
  signedAt?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  assignedAt?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  informationRequested?: string;
  informationResponse?: string;
  informationRespondedAt?: string;
  possibleDuplicate?: boolean;
  duplicateOfReferences?: string[];
  createdAt: string;
  updatedAt: string;
  activities?: ParkingReservationActivity[];
  possibleDuplicates?: Array<{
    id: string;
    reservationReference: string;
    status: ParkingReservationStatus;
    createdAt: string;
  }>;
  capacity?: {
    facilityName: string;
    totalCapacity: number;
    reservedSpaces: number;
    remaining: number;
    requested: number;
    sufficient: boolean;
  };
  payment?: ParkingPayment;
  feeQuote?: ParkingFeeQuote;
}

export type ParkingPaymentStatus =
  | 'NOT_APPLICABLE'
  | 'DUE'
  | 'PENDING_VERIFICATION'
  | 'PAID'
  | 'OVERDUE'
  | 'WAIVED'
  | 'CANCELLED'
  | 'REFUNDED';

export type ParkingPaymentMethod = 'CREDIT_TRANSFER' | 'CARD' | 'CASH' | 'MOBILE_MONEY' | 'OTHER';

export interface ParkingFeeLineItem {
  code: string;
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
}

export interface ParkingFeeQuote {
  currency: string;
  occupancyAmount: number;
  reservationFeeAmount: number;
  subtotalAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  lineItems: ParkingFeeLineItem[];
}

export interface ParkingPayment {
  status: ParkingPaymentStatus;
  invoiceNumber?: string | null;
  currency: string;
  occupancyAmount: number;
  reservationFeeAmount: number;
  subtotalAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  dueAt?: string | null;
  paidAt?: string | null;
  paidAmount?: number | null;
  paymentMethod?: ParkingPaymentMethod | null;
  paymentReference?: string | null;
  lineItems?: ParkingFeeLineItem[];
  feeNotes?: string;
  instructions?: string;
}

export interface ParkingFeeSchedule {
  id: string;
  facilityName: string;
  totalCapacity: number;
  allowPastStartDates: boolean;
  currency: string;
  monthlyRatePerSpace: number;
  reservationFee: number;
  taxPercent: number;
  paymentDueDays: number;
  feeNotes?: string;
  paymentInstructions?: string;
}

export interface ParkingReservationActivity {
  id: string;
  action: string;
  actorLabel?: string;
  actorRole?: string;
  previousStatus?: ParkingReservationStatus;
  newStatus?: ParkingReservationStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ParkingReservationStats {
  pendingReview: number;
  underReview: number;
  approved: number;
  additionalInformationRequired: number;
  rejected: number;
  cancelled: number;
  todaysRequests: number;
}

export interface ParkingFacility {
  id: string;
  facilityName: string;
  totalCapacity: number;
  allowPastStartDates: boolean;
}

export interface ParkingOfficer {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateParkingReservationPayload {
  companyName: string;
  mcNumber: string;
  usdotNumber: string;
  companyPhone: string;
  email: string;
  driverEmail: string;
  driverFirstName: string;
  driverLastName: string;
  truckSpacesRequested: number;
  contractMonths: number;
  requestedStartDate: string;
  agreementAccepted: boolean;
  signature: string;
  customerNotes?: string;
  idempotencyKey?: string;
  website?: string;
}

export const PARKING_STATUS_LABELS: Record<ParkingReservationStatus, string> = {
  PENDING_REVIEW: 'Pending Review',
  UNDER_REVIEW: 'Under Review',
  ADDITIONAL_INFORMATION_REQUIRED: 'Information Required',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  COMPLETED: 'Completed',
};

export const PARKING_ACTIVITY_LABELS: Record<string, string> = {
  RESERVATION_CREATED: 'Reservation submitted',
  RESERVATION_ASSIGNED: 'Assigned',
  RESERVATION_REASSIGNED: 'Reassigned',
  REVIEW_STARTED: 'Review started',
  INFORMATION_REQUESTED: 'Information requested',
  INFORMATION_RECEIVED: 'Customer responded',
  RESERVATION_APPROVED: 'Reservation approved',
  RESERVATION_REJECTED: 'Reservation rejected',
  RESERVATION_CANCELLED: 'Reservation cancelled',
  NOTE_ADDED: 'Internal note added',
  STATUS_CHANGED: 'Status changed',
  PAYMENT_REQUESTED: 'Payment requested',
  PAYMENT_SUBMITTED: 'Payment confirmation submitted',
  PAYMENT_RECEIVED: 'Payment received',
  PAYMENT_WAIVED: 'Fees waived',
};

export const PARKING_PAYMENT_LABELS: Record<ParkingPaymentStatus, string> = {
  NOT_APPLICABLE: 'No fees due',
  DUE: 'Payment due',
  PENDING_VERIFICATION: 'Payment pending verification',
  PAID: 'Paid',
  OVERDUE: 'Payment overdue',
  WAIVED: 'Fees waived',
  CANCELLED: 'Payment cancelled',
  REFUNDED: 'Refunded',
};

export const PARKING_PAYMENT_METHOD_LABELS: Record<ParkingPaymentMethod, string> = {
  CREDIT_TRANSFER: 'Bank transfer',
  CARD: 'Card',
  CASH: 'Cash',
  MOBILE_MONEY: 'Mobile money',
  OTHER: 'Other',
};

export function formatParkingMoney(amount?: number | null, currency = 'USD'): string {
  const value = Number(amount);
  const code = (currency || 'USD').toUpperCase();
  if (!Number.isFinite(value)) return `${code} 0.00`;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

export function isParkingPaymentOpen(status?: ParkingPaymentStatus): boolean {
  return status === 'DUE' || status === 'OVERDUE' || status === 'PENDING_VERIFICATION';
}
