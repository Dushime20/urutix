import { DisputeCategory } from '../../entities/dispute-v2.entity';

export type TicketKind = 'issue' | 'support' | 'dispute';

export const SUPPORT_CATEGORIES: DisputeCategory[] = [
  DisputeCategory.TECHNICAL_PROBLEM,
  DisputeCategory.FEATURE_REQUEST,
  DisputeCategory.IDENTITY_VERIFICATION,
  DisputeCategory.ACCOUNT_SUSPENSION,
  DisputeCategory.SECURITY_CONCERN,
  DisputeCategory.OTHER,
];

export const DISPUTE_CATEGORIES: DisputeCategory[] = [
  DisputeCategory.CONTRACT_VIOLATION,
  DisputeCategory.DRIVER_MISCONDUCT,
  DisputeCategory.FRAUD_SUSPECTED,
  DisputeCategory.BROKER_COMPLAINT,
  DisputeCategory.LENDER_COMPLAINT,
  DisputeCategory.INSURANCE_CLAIM,
];

export function categoriesForKind(kind: TicketKind): DisputeCategory[] {
  if (kind === 'support') return SUPPORT_CATEGORIES;
  if (kind === 'dispute') return DISPUTE_CATEGORIES;
  return (Object.values(DisputeCategory) as DisputeCategory[]).filter(
    (c) => !SUPPORT_CATEGORIES.includes(c) && !DISPUTE_CATEGORIES.includes(c),
  );
}

export function isTicketKind(value: string | undefined | null): value is TicketKind {
  return value === 'issue' || value === 'support' || value === 'dispute';
}
