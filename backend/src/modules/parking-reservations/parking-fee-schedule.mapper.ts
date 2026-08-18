import {
  ParkingFeeSchedule,
  ParkingFeeScheduleStatus,
  ParkingFacilityConfig,
  ParkingLateFeeType,
  ParkingPaymentDueType,
  ParkingPaymentFrequency,
  ParkingReservationFeeApplication,
  ParkingReservationFeeType,
} from '../../entities/parking-reservation.entity';
import { calculateParkingFeeQuote, toDateString, toMoneyNumber } from './parking-reservation.workflow';
import { UpdateParkingFeesDto } from './dto/parking-reservation.dto';

const TRACKED_FIELDS = [
  'currency',
  'monthlyRatePerSpace',
  'reservationFeeType',
  'reservationFeeValue',
  'reservationFeeApplication',
  'taxEnabled',
  'taxName',
  'taxPercent',
  'paymentFrequency',
  'paymentDueType',
  'paymentDueDays',
  'effectiveFrom',
  'effectiveUntil',
] as const;

export function scheduleToQuoteInput(
  schedule: Pick<
    ParkingFeeSchedule,
    | 'monthlyRatePerSpace'
    | 'reservationFeeValue'
    | 'reservationFeeType'
    | 'reservationFeeApplication'
    | 'taxPercent'
    | 'taxEnabled'
    | 'taxName'
    | 'currency'
  >,
  spaces: number,
  months: number,
) {
  return {
    spaces,
    months,
    monthlyRatePerSpace: toMoneyNumber(schedule.monthlyRatePerSpace),
    reservationFee: toMoneyNumber(schedule.reservationFeeValue),
    reservationFeeType: schedule.reservationFeeType,
    reservationFeeApplication: schedule.reservationFeeApplication,
    taxPercent: toMoneyNumber(schedule.taxPercent),
    taxEnabled: schedule.taxEnabled,
    taxName: schedule.taxName,
    currency: (schedule.currency || 'USD').toUpperCase(),
  };
}

export function quoteFromSchedule(schedule: ParkingFeeSchedule, spaces: number, months: number) {
  return calculateParkingFeeQuote(scheduleToQuoteInput(schedule, spaces, months));
}

export function toFeeScheduleView(schedule: ParkingFeeSchedule, facility?: ParkingFacilityConfig) {
  return {
    id: schedule.id,
    name: schedule.name,
    description: schedule.description || '',
    parkingFacilityId: schedule.parkingFacilityId,
    facilityName: facility?.facilityName || schedule.facility?.facilityName || '',
    city: facility?.city || schedule.facility?.city || '',
    country: facility?.country || schedule.facility?.country || '',
    region: facility?.region || schedule.facility?.region || '',
    totalCapacity: facility?.totalCapacity ?? schedule.facility?.totalCapacity ?? 700,
    allowPastStartDates: facility?.allowPastStartDates ?? schedule.facility?.allowPastStartDates ?? false,
    spaceType: schedule.spaceType,
    vehicleType: schedule.vehicleType,
    currency: (schedule.currency || 'USD').toUpperCase(),
    status: schedule.status,
    version: schedule.version,
    monthlyRatePerSpace: toMoneyNumber(schedule.monthlyRatePerSpace),
    dailyRate: schedule.dailyRate != null ? toMoneyNumber(schedule.dailyRate) : null,
    weeklyRate: schedule.weeklyRate != null ? toMoneyNumber(schedule.weeklyRate) : null,
    longTermRate: schedule.longTermRate != null ? toMoneyNumber(schedule.longTermRate) : null,
    reservationFeeType: schedule.reservationFeeType,
    reservationFeeValue: toMoneyNumber(schedule.reservationFeeValue),
    reservationFee: toMoneyNumber(schedule.reservationFeeValue),
    reservationFeeApplication: schedule.reservationFeeApplication,
    taxEnabled: schedule.taxEnabled,
    taxName: schedule.taxName,
    taxPercent: toMoneyNumber(schedule.taxPercent),
    paymentFrequency: schedule.paymentFrequency,
    paymentDueType: schedule.paymentDueType,
    paymentDueDays: schedule.paymentDueDays,
    gracePeriodDays: schedule.gracePeriodDays,
    lateFeeType: schedule.lateFeeType,
    lateFeeValue: toMoneyNumber(schedule.lateFeeValue),
    autoRenewal: schedule.autoRenewal,
    minContractMonths: schedule.minContractMonths,
    maxContractMonths: schedule.maxContractMonths,
    minSpaces: schedule.minSpaces,
    maxSpaces: schedule.maxSpaces,
    cancellationAllowed: schedule.cancellationAllowed,
    cancellationNoticeDays: schedule.cancellationNoticeDays,
    cancellationFeeType: schedule.cancellationFeeType,
    cancellationFeeValue: toMoneyNumber(schedule.cancellationFeeValue),
    refundEligible: schedule.refundEligible,
    earlyTerminationAllowed: schedule.earlyTerminationAllowed,
    effectiveFrom: schedule.effectiveFrom,
    effectiveUntil: schedule.effectiveUntil || null,
    feeNotes: schedule.feeNotes || '',
    paymentInstructions: schedule.paymentInstructions || '',
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    activatedAt: schedule.activatedAt || null,
    createdByUserId: schedule.createdByUserId || null,
    updatedByUserId: schedule.updatedByUserId || null,
    activatedByUserId: schedule.activatedByUserId || null,
  };
}

export function snapshotFromSchedule(
  schedule: ParkingFeeSchedule,
  quote: ReturnType<typeof calculateParkingFeeQuote>,
) {
  return {
    ...quote,
    feeScheduleId: schedule.id,
    feeScheduleVersion: schedule.version,
    monthlyRatePerSpace: toMoneyNumber(schedule.monthlyRatePerSpace),
    reservationFee: toMoneyNumber(schedule.reservationFeeValue),
    reservationFeeType: schedule.reservationFeeType,
    reservationFeeApplication: schedule.reservationFeeApplication,
    taxEnabled: schedule.taxEnabled,
    taxName: schedule.taxName,
    feeNotes: schedule.feeNotes || '',
    paymentInstructions: schedule.paymentInstructions || '',
    paymentDueDays: schedule.paymentDueDays,
    paymentDueType: schedule.paymentDueType,
    paymentFrequency: schedule.paymentFrequency,
    gracePeriodDays: schedule.gracePeriodDays,
    lateFeeType: schedule.lateFeeType,
    lateFeeValue: toMoneyNumber(schedule.lateFeeValue),
    autoRenewal: schedule.autoRenewal,
    cancellationAllowed: schedule.cancellationAllowed,
    cancellationNoticeDays: schedule.cancellationNoticeDays,
    cancellationFeeType: schedule.cancellationFeeType,
    cancellationFeeValue: toMoneyNumber(schedule.cancellationFeeValue),
    refundEligible: schedule.refundEligible,
    earlyTerminationAllowed: schedule.earlyTerminationAllowed,
    minSpaces: schedule.minSpaces,
    maxSpaces: schedule.maxSpaces,
    minContractMonths: schedule.minContractMonths,
    maxContractMonths: schedule.maxContractMonths,
  };
}

export function applyFeeScheduleDto(schedule: ParkingFeeSchedule, dto: UpdateParkingFeesDto) {
  const previous: Record<string, unknown> = {};
  const next: Record<string, unknown> = {};
  const assign = <K extends keyof ParkingFeeSchedule>(key: K, value: ParkingFeeSchedule[K]) => {
    if (TRACKED_FIELDS.includes(key as (typeof TRACKED_FIELDS)[number])) {
      previous[key as string] = schedule[key];
      next[key as string] = value;
    }
    schedule[key] = value;
  };

  if (dto.name != null) schedule.name = dto.name;
  if (dto.description != null) schedule.description = dto.description;
  if (dto.spaceType != null) schedule.spaceType = dto.spaceType;
  if (dto.vehicleType != null) schedule.vehicleType = dto.vehicleType;
  if (dto.currency) assign('currency', dto.currency);
  if (dto.monthlyRatePerSpace != null) assign('monthlyRatePerSpace', dto.monthlyRatePerSpace as any);
  if (dto.dailyRate != null) schedule.dailyRate = dto.dailyRate;
  if (dto.weeklyRate != null) schedule.weeklyRate = dto.weeklyRate;
  if (dto.longTermRate != null) schedule.longTermRate = dto.longTermRate;
  if (dto.reservationFeeType) assign('reservationFeeType', dto.reservationFeeType);
  if (dto.reservationFeeValue != null) assign('reservationFeeValue', dto.reservationFeeValue as any);
  else if (dto.reservationFee != null) assign('reservationFeeValue', dto.reservationFee as any);
  if (dto.reservationFeeApplication) assign('reservationFeeApplication', dto.reservationFeeApplication);
  if (dto.taxEnabled != null) assign('taxEnabled', dto.taxEnabled);
  if (dto.taxName) assign('taxName', dto.taxName);
  if (dto.taxPercent != null) {
    assign('taxPercent', dto.taxPercent as any);
    if (dto.taxEnabled == null) schedule.taxEnabled = dto.taxPercent > 0;
  }
  if (dto.paymentFrequency) assign('paymentFrequency', dto.paymentFrequency);
  if (dto.paymentDueType) assign('paymentDueType', dto.paymentDueType);
  if (dto.paymentDueDays != null) assign('paymentDueDays', dto.paymentDueDays);
  if (dto.gracePeriodDays != null) schedule.gracePeriodDays = dto.gracePeriodDays;
  if (dto.lateFeeType) schedule.lateFeeType = dto.lateFeeType;
  if (dto.lateFeeValue != null) schedule.lateFeeValue = dto.lateFeeValue;
  if (dto.autoRenewal != null) schedule.autoRenewal = dto.autoRenewal;
  if (dto.minContractMonths != null) schedule.minContractMonths = dto.minContractMonths;
  if (dto.maxContractMonths != null) schedule.maxContractMonths = dto.maxContractMonths;
  if (dto.minSpaces != null) schedule.minSpaces = dto.minSpaces;
  if (dto.maxSpaces != null) schedule.maxSpaces = dto.maxSpaces;
  if (dto.cancellationAllowed != null) schedule.cancellationAllowed = dto.cancellationAllowed;
  if (dto.cancellationNoticeDays != null) schedule.cancellationNoticeDays = dto.cancellationNoticeDays;
  if (dto.cancellationFeeType) schedule.cancellationFeeType = dto.cancellationFeeType;
  if (dto.cancellationFeeValue != null) schedule.cancellationFeeValue = dto.cancellationFeeValue;
  if (dto.refundEligible != null) schedule.refundEligible = dto.refundEligible;
  if (dto.earlyTerminationAllowed != null) schedule.earlyTerminationAllowed = dto.earlyTerminationAllowed;
  if (dto.effectiveFrom) assign('effectiveFrom', dto.effectiveFrom.slice(0, 10));
  if (dto.effectiveUntil !== undefined) {
    assign('effectiveUntil', dto.effectiveUntil ? dto.effectiveUntil.slice(0, 10) : (null as any));
  }
  if (dto.feeNotes != null) schedule.feeNotes = dto.feeNotes;
  if (dto.paymentInstructions != null) schedule.paymentInstructions = dto.paymentInstructions;
  return { previous, next };
}

export function newDraftFromFacility(facility: ParkingFacilityConfig, userId?: string): Partial<ParkingFeeSchedule> {
  return {
    parkingFacilityId: facility.id,
    name: `${facility.facilityName || 'Nova Parking 365'} monthly`,
    description: '',
    spaceType: 'TRUCK_SPACE',
    vehicleType: 'TRUCK',
    currency: (facility.currency || 'USD').toUpperCase(),
    status: ParkingFeeScheduleStatus.DRAFT,
    version: 1,
    monthlyRatePerSpace: toMoneyNumber(facility.monthlyRatePerSpace),
    reservationFeeType: ParkingReservationFeeType.FIXED,
    reservationFeeValue: toMoneyNumber(facility.reservationFee),
    reservationFeeApplication: ParkingReservationFeeApplication.PER_RESERVATION,
    taxEnabled: toMoneyNumber(facility.taxPercent) > 0,
    taxName: 'VAT',
    taxPercent: toMoneyNumber(facility.taxPercent),
    paymentFrequency: ParkingPaymentFrequency.ONE_TIME,
    paymentDueType: ParkingPaymentDueType.DAYS_AFTER_INVOICE,
    paymentDueDays: facility.paymentDueDays || 7,
    gracePeriodDays: 0,
    lateFeeType: ParkingLateFeeType.NONE,
    lateFeeValue: 0,
    autoRenewal: false,
    minContractMonths: 1,
    maxContractMonths: 12,
    minSpaces: 1,
    maxSpaces: Math.max(1, facility.totalCapacity || 100),
    cancellationAllowed: true,
    cancellationNoticeDays: 0,
    cancellationFeeType: ParkingLateFeeType.NONE,
    cancellationFeeValue: 0,
    refundEligible: false,
    earlyTerminationAllowed: true,
    effectiveFrom: toDateString(new Date()),
    feeNotes: facility.feeNotes || '',
    paymentInstructions: facility.paymentInstructions || '',
    createdByUserId: userId,
    updatedByUserId: userId,
  };
}

export function syncFacilityFromSchedule(facility: ParkingFacilityConfig, schedule: ParkingFeeSchedule) {
  facility.currency = (schedule.currency || 'USD').toUpperCase();
  facility.monthlyRatePerSpace = toMoneyNumber(schedule.monthlyRatePerSpace);
  facility.reservationFee = toMoneyNumber(schedule.reservationFeeValue);
  facility.taxPercent = toMoneyNumber(schedule.taxPercent);
  facility.paymentDueDays = Math.min(90, Math.max(1, schedule.paymentDueDays || 7));
  facility.feeNotes = schedule.feeNotes;
  facility.paymentInstructions = schedule.paymentInstructions;
}
