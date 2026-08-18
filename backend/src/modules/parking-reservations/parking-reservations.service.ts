import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';
import { MobileMoneyPaymentService } from '../payments/services/mobile-money-payment.service';
import {
  ParkingFacilityConfig,
  ParkingFeeSchedule,
  ParkingFeeScheduleStatus,
  ParkingReservation,
  ParkingReservationActivity,
  ParkingReservationActivityAction,
  ParkingReservationPaymentMethod,
  ParkingReservationPaymentStatus,
  ParkingReservationStatus,
} from '../../entities/parking-reservation.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import {
  AddParkingNoteDto,
  AssignParkingReservationDto,
  CancelParkingReservationDto,
  CreateParkingReservationDto,
  GuestInformationResponseDto,
  GuestIshemaPayDto,
  GuestIshemaPayStatusDto,
  GuestParkingPaymentDto,
  LookupParkingReservationDto,
  ParkingReservationFilterDto,
  PreviewParkingQuoteDto,
  RejectParkingReservationDto,
  RequestInformationDto,
  SubmitParkingPaymentDto,
  UpdateParkingFacilityDto,
  UpdateParkingFeesDto,
  WaiveParkingPaymentDto,
} from './dto/parking-reservation.dto';
import {
  addMonths,
  calculateParkingFeeQuote,
  canTransition,
  effectivePaymentStatus,
  feeSchedulePeriodsOverlap,
  formatReservationReference,
  hasSufficientCapacity,
  invoiceNumberFor,
  isValidIso4217Currency,
  isValidMcNumber,
  isValidPhone,
  isValidUsdotNumber,
  normalizeMcNumber,
  normalizeUsdotNumber,
  periodsOverlap,
  resolvePaymentDueAt,
  startOfTodayUtc,
  toDateString,
  toMoneyNumber,
  toUtcDateOnly,
  validateContractLimits,
} from './parking-reservation.workflow';
import {
  applyFeeScheduleDto,
  newDraftFromFacility,
  quoteFromSchedule,
  snapshotFromSchedule,
  syncFacilityFromSchedule,
  toFeeScheduleView,
} from './parking-fee-schedule.mapper';

const STAFF_ROLES = new Set<string>([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.PARKING_RESERVATION_MANAGER,
]);

const PLATFORM_STAFF_ROLES = new Set<string>([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PARKING_RESERVATION_MANAGER,
]);

type AuthUser = {
  id?: string;
  userId?: string;
  tenantId?: string;
  role?: string;
  email?: string;
};

@Injectable()
export class ParkingReservationsService {
  private readonly logger = new Logger(ParkingReservationsService.name);

  constructor(
    @InjectRepository(ParkingReservation)
    private readonly reservationRepo: Repository<ParkingReservation>,
    @InjectRepository(ParkingReservationActivity)
    private readonly activityRepo: Repository<ParkingReservationActivity>,
    @InjectRepository(ParkingFacilityConfig)
    private readonly facilityRepo: Repository<ParkingFacilityConfig>,
    @InjectRepository(ParkingFeeSchedule)
    private readonly feeScheduleRepo: Repository<ParkingFeeSchedule>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly mobileMoneyPaymentService: MobileMoneyPaymentService,
  ) {}

  private actorId(user?: AuthUser | null): string | undefined {
    return user?.userId || user?.id;
  }

  private isStaff(role?: string): boolean {
    return !!role && STAFF_ROLES.has(role);
  }

  private isPlatformStaff(role?: string): boolean {
    return !!role && PLATFORM_STAFF_ROLES.has(role);
  }

  private hashIp(ip?: string): string | undefined {
    if (!ip) return undefined;
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 64);
  }

  private validateBusinessFields(dto: CreateParkingReservationDto, allowPast: boolean) {
    if (!dto.agreementAccepted) {
      throw new BadRequestException('You must accept the reservation agreement to continue.');
    }
    if (!isValidMcNumber(dto.mcNumber)) {
      throw new BadRequestException('Enter a valid MC number.');
    }
    if (!isValidUsdotNumber(dto.usdotNumber)) {
      throw new BadRequestException('Enter a valid USDOT number.');
    }
    if (!isValidPhone(dto.companyPhone)) {
      throw new BadRequestException('Enter a valid company phone number.');
    }
    const start = toUtcDateOnly(dto.requestedStartDate);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Enter a valid requested start date.');
    }
    if (!allowPast && start < startOfTodayUtc()) {
      throw new BadRequestException('The requested start date cannot be in the past.');
    }
    if (!Number.isInteger(dto.truckSpacesRequested) || dto.truckSpacesRequested < 1) {
      throw new BadRequestException('Number of truck spaces must be at least 1.');
    }
    if (!Number.isInteger(dto.contractMonths) || dto.contractMonths < 1) {
      throw new BadRequestException('Contract duration must be at least 1 month.');
    }
    return start;
  }

  async getFacility(tenantId?: string | null): Promise<ParkingFacilityConfig> {
    if (tenantId) {
      const scoped = await this.facilityRepo.findOne({ where: { tenantId } });
      if (scoped) return scoped;
    }
    const fallback = await this.facilityRepo.findOne({ where: { isDefault: true } });
    if (fallback) return fallback;
    const created = this.facilityRepo.create({
      facilityName: 'Nova Parking 365',
      totalCapacity: 700,
      allowPastStartDates: false,
      isDefault: true,
    });
    return this.facilityRepo.save(created);
  }

  async updateFacility(dto: UpdateParkingFacilityDto, user: AuthUser): Promise<ParkingFacilityConfig> {
    if (!this.isStaff(user.role)) {
      throw new ForbiddenException("You don't have permission to perform this action.");
    }
    const facility = await this.getFacility(user.tenantId);
    if (dto.totalCapacity != null) facility.totalCapacity = dto.totalCapacity;
    if (dto.facilityName) facility.facilityName = dto.facilityName;
    if (dto.allowPastStartDates != null) facility.allowPastStartDates = dto.allowPastStartDates;
    return this.facilityRepo.save(facility);
  }

  toFeeScheduleView(schedule: ParkingFeeSchedule, facility?: ParkingFacilityConfig) {
    return toFeeScheduleView(schedule, facility);
  }

  private async listSchedulesForFacility(facilityId: string) {
    return this.feeScheduleRepo.find({
      where: { parkingFacilityId: facilityId },
      order: { version: 'DESC', createdAt: 'DESC' },
    });
  }

  private async findWorkingSchedule(facility: ParkingFacilityConfig) {
    const schedules = await this.listSchedulesForFacility(facility.id);
    return (
      schedules.find((item) => item.status === ParkingFeeScheduleStatus.DRAFT) ||
      schedules.find((item) => item.status === ParkingFeeScheduleStatus.ACTIVE) ||
      schedules.find((item) => item.status === ParkingFeeScheduleStatus.SCHEDULED) ||
      schedules[0] ||
      null
    );
  }

  private async findApplicableSchedule(params: {
    facility: ParkingFacilityConfig;
    startDate: Date | string;
    spaceType?: string;
    vehicleType?: string;
    requireActive?: boolean;
  }) {
    const start = toDateString(params.startDate instanceof Date ? params.startDate : toUtcDateOnly(params.startDate));
    const spaceType = params.spaceType || 'TRUCK_SPACE';
    const vehicleType = params.vehicleType || 'TRUCK';
    const schedules = await this.feeScheduleRepo.find({
      where: { parkingFacilityId: params.facility.id, spaceType, vehicleType },
      order: { version: 'DESC' },
    });
    const applicable = schedules.find((item) => {
      const live = this.liveStatus(item);
      if (live !== ParkingFeeScheduleStatus.ACTIVE && live !== ParkingFeeScheduleStatus.SCHEDULED) return false;
      if (params.requireActive !== false && live !== ParkingFeeScheduleStatus.ACTIVE) return false;
      const from = item.effectiveFrom;
      const until = item.effectiveUntil;
      return from <= start && (!until || until >= start);
    });
    if (applicable) return applicable;
    return (
      schedules.find((item) => this.liveStatus(item) === ParkingFeeScheduleStatus.ACTIVE) ||
      null
    );
  }

  private liveStatus(schedule: ParkingFeeSchedule): ParkingFeeScheduleStatus {
    const today = toDateString(new Date());
    if (
      (schedule.status === ParkingFeeScheduleStatus.ACTIVE || schedule.status === ParkingFeeScheduleStatus.SCHEDULED) &&
      schedule.effectiveUntil &&
      schedule.effectiveUntil < today
    ) {
      return ParkingFeeScheduleStatus.EXPIRED;
    }
    if (schedule.status === ParkingFeeScheduleStatus.SCHEDULED && schedule.effectiveFrom <= today) {
      return ParkingFeeScheduleStatus.ACTIVE;
    }
    return schedule.status;
  }

  async getFeeSchedule(user: AuthUser) {
    this.assertStaff(user);
    const facility = await this.getFacility(user.tenantId);
    const schedules = await this.listSchedulesForFacility(facility.id);
    const working = await this.findWorkingSchedule(facility);
    const view = working
      ? toFeeScheduleView(working, facility)
      : toFeeScheduleView(
          this.feeScheduleRepo.create(newDraftFromFacility(facility, this.actorId(user))) as ParkingFeeSchedule,
          facility,
        );
    return {
      ...view,
      schedules: schedules.map((item) => ({
        id: item.id,
        name: item.name,
        status: this.liveStatus(item),
        version: item.version,
        currency: item.currency,
        effectiveFrom: item.effectiveFrom,
        effectiveUntil: item.effectiveUntil || null,
        monthlyRatePerSpace: toMoneyNumber(item.monthlyRatePerSpace),
      })),
    };
  }

  async listFeeSchedules(user: AuthUser) {
    this.assertStaff(user);
    const facility = await this.getFacility(user.tenantId);
    const schedules = await this.listSchedulesForFacility(facility.id);
    return schedules.map((item) => toFeeScheduleView(item, facility));
  }

  async getFeeScheduleById(id: string, user: AuthUser) {
    this.assertStaff(user);
    const facility = await this.getFacility(user.tenantId);
    const schedule = await this.feeScheduleRepo.findOne({ where: { id } });
    if (!schedule || schedule.parkingFacilityId !== facility.id) {
      throw new NotFoundException('Fee schedule not found.');
    }
    return toFeeScheduleView(schedule, facility);
  }

  async updateFeeSchedule(dto: UpdateParkingFeesDto, user: AuthUser) {
    this.assertStaff(user);
    this.assertFeeScheduleDto(dto);
    const facility = await this.getFacility(user.tenantId);
    let working: ParkingFeeSchedule | null = null;
    if (dto.id) {
      working = await this.feeScheduleRepo.findOne({ where: { id: dto.id } });
      if (!working || working.parkingFacilityId !== facility.id) {
        throw new NotFoundException('Fee schedule not found.');
      }
    }
    const shouldFork =
      !working ||
      working.status === ParkingFeeScheduleStatus.ACTIVE ||
      working.status === ParkingFeeScheduleStatus.SCHEDULED ||
      working.status === ParkingFeeScheduleStatus.ARCHIVED ||
      working.status === ParkingFeeScheduleStatus.EXPIRED;
    if (shouldFork) {
      const source = working || undefined;
      const maxVersion = (await this.listSchedulesForFacility(facility.id)).reduce((max, item) => Math.max(max, item.version), 0);
      working = this.feeScheduleRepo.create({
        ...(source
          ? { ...source, id: undefined as any, createdAt: undefined as any, updatedAt: undefined as any, activatedAt: undefined, activatedByUserId: undefined }
          : newDraftFromFacility(facility, this.actorId(user))),
        parkingFacilityId: facility.id,
        status: ParkingFeeScheduleStatus.DRAFT,
        version: maxVersion + 1,
        createdByUserId: this.actorId(user),
      });
      delete (working as any).id;
    }
    const { previous, next } = applyFeeScheduleDto(working!, dto);
    this.assertFeeScheduleEntity(working!);
    working!.updatedByUserId = this.actorId(user);
    working!.changeLog = [
      ...(working!.changeLog || []),
      { at: new Date().toISOString(), by: this.actorId(user), previous, next },
    ];
    const saved = await this.feeScheduleRepo.save(working!);
    await this.auditFeeChange(user, facility, 'UPDATE', previous, next, saved.id);
    return toFeeScheduleView(saved, facility);
  }

  async activateFeeSchedule(id: string, user: AuthUser) {
    this.assertStaff(user);
    const facility = await this.getFacility(user.tenantId);
    const schedule = await this.feeScheduleRepo.findOne({ where: { id } });
    if (!schedule || schedule.parkingFacilityId !== facility.id) {
      throw new NotFoundException('Fee schedule not found.');
    }
    if (toMoneyNumber(schedule.monthlyRatePerSpace) <= 0) {
      throw new BadRequestException('Monthly rate per truck space must be greater than 0 before activation.');
    }
    this.assertFeeScheduleEntity(schedule);
    const others = await this.feeScheduleRepo.find({
      where: {
        parkingFacilityId: schedule.parkingFacilityId,
        spaceType: schedule.spaceType,
        vehicleType: schedule.vehicleType,
      },
    });
    for (const item of others) {
      if (item.id === schedule.id) continue;
      const status = this.liveStatus(item);
      if (status !== ParkingFeeScheduleStatus.ACTIVE && status !== ParkingFeeScheduleStatus.SCHEDULED) continue;
      if (!feeSchedulePeriodsOverlap(schedule.effectiveFrom, schedule.effectiveUntil, item.effectiveFrom, item.effectiveUntil)) {
        continue;
      }
      item.status = ParkingFeeScheduleStatus.ARCHIVED;
      item.updatedByUserId = this.actorId(user);
      await this.feeScheduleRepo.save(item);
    }
    const today = toDateString(new Date());
    const nextStatus =
      schedule.effectiveFrom > today ? ParkingFeeScheduleStatus.SCHEDULED : ParkingFeeScheduleStatus.ACTIVE;
    const previous = { status: schedule.status };
    schedule.status = nextStatus;
    schedule.activatedByUserId = this.actorId(user);
    schedule.activatedAt = new Date();
    schedule.updatedByUserId = this.actorId(user);
    const saved = await this.feeScheduleRepo.save(schedule);
    if (nextStatus === ParkingFeeScheduleStatus.ACTIVE) {
      syncFacilityFromSchedule(facility, saved);
      await this.facilityRepo.save(facility);
    }
    await this.auditFeeChange(user, facility, 'ACTIVATE', previous, { status: nextStatus }, saved.id);
    return toFeeScheduleView(saved, facility);
  }

  async archiveFeeSchedule(id: string, user: AuthUser) {
    this.assertStaff(user);
    const facility = await this.getFacility(user.tenantId);
    const schedule = await this.feeScheduleRepo.findOne({ where: { id } });
    if (!schedule || schedule.parkingFacilityId !== facility.id) {
      throw new NotFoundException('Fee schedule not found.');
    }
    const previous = { status: schedule.status };
    schedule.status = ParkingFeeScheduleStatus.ARCHIVED;
    schedule.updatedByUserId = this.actorId(user);
    const saved = await this.feeScheduleRepo.save(schedule);
    await this.auditFeeChange(user, facility, 'ARCHIVE', previous, { status: ParkingFeeScheduleStatus.ARCHIVED }, schedule.id);
    return toFeeScheduleView(saved, facility);
  }

  async previewFeeQuote(dto: PreviewParkingQuoteDto, user?: AuthUser | null) {
    const facility = dto.facilityId
      ? await this.facilityRepo.findOne({ where: { id: dto.facilityId } })
      : await this.getFacility(user?.tenantId);
    if (!facility) throw new NotFoundException('Parking facility not found.');
    const start = dto.reservationStartDate || toDateString(new Date());
    const schedule = dto.scheduleId
      ? await this.feeScheduleRepo.findOne({ where: { id: dto.scheduleId } })
      : await this.findApplicableSchedule({
          facility,
          startDate: start,
          spaceType: dto.spaceType,
          vehicleType: dto.vehicleType,
        }) || await this.findWorkingSchedule(facility);
    if (!schedule) {
      throw new BadRequestException('Reservation cannot be completed because no active pricing schedule is available for this parking space.');
    }
    const limitError = validateContractLimits({
      spaces: dto.spaces,
      months: dto.months,
      minSpaces: schedule.minSpaces,
      maxSpaces: schedule.maxSpaces,
      minContractMonths: schedule.minContractMonths,
      maxContractMonths: schedule.maxContractMonths,
    });
    if (limitError) throw new BadRequestException(limitError);
    const quote = quoteFromSchedule(schedule, dto.spaces, dto.months);
    return {
      ...quote,
      feeScheduleId: schedule.id,
      feeScheduleVersion: schedule.version,
      feeNotes: schedule.feeNotes || '',
      paymentInstructions: user ? schedule.paymentInstructions || '' : undefined,
    };
  }

  async getPublicPricing() {
    const facility = await this.getFacility();
    const schedule =
      (await this.findApplicableSchedule({ facility, startDate: new Date() })) ||
      (await this.findWorkingSchedule(facility));
    if (!schedule) {
      return {
        facilityName: facility.facilityName,
        currency: (facility.currency || 'USD').toUpperCase(),
        monthlyRatePerSpace: toMoneyNumber(facility.monthlyRatePerSpace),
        minSpaces: 1,
        maxSpaces: facility.totalCapacity || 100,
        minContractMonths: 1,
        maxContractMonths: 60,
        feeNotes: facility.feeNotes || '',
        hasActiveSchedule: false,
      };
    }
    return {
      facilityName: facility.facilityName,
      currency: (schedule.currency || 'USD').toUpperCase(),
      monthlyRatePerSpace: toMoneyNumber(schedule.monthlyRatePerSpace),
      reservationFeeType: schedule.reservationFeeType,
      reservationFeeValue: toMoneyNumber(schedule.reservationFeeValue),
      reservationFeeApplication: schedule.reservationFeeApplication,
      minSpaces: schedule.minSpaces,
      maxSpaces: schedule.maxSpaces,
      minContractMonths: schedule.minContractMonths,
      maxContractMonths: schedule.maxContractMonths,
      feeNotes: schedule.feeNotes || '',
      taxName: schedule.taxName,
      taxPercent: schedule.taxEnabled ? toMoneyNumber(schedule.taxPercent) : 0,
      taxEnabled: schedule.taxEnabled,
      hasActiveSchedule: this.liveStatus(schedule) === ParkingFeeScheduleStatus.ACTIVE,
    };
  }

  private assertFeeScheduleDto(dto: UpdateParkingFeesDto) {
    if (dto.currency && !isValidIso4217Currency(dto.currency)) {
      throw new BadRequestException('Currency must be a 3-letter ISO 4217 code.');
    }
    if (dto.minContractMonths != null && dto.maxContractMonths != null && dto.maxContractMonths < dto.minContractMonths) {
      throw new BadRequestException('Maximum contract months must be greater than or equal to minimum months.');
    }
    if (dto.minSpaces != null && dto.maxSpaces != null && dto.maxSpaces < dto.minSpaces) {
      throw new BadRequestException('Maximum truck spaces must be greater than or equal to minimum spaces.');
    }
    if (dto.effectiveFrom && dto.effectiveUntil && dto.effectiveUntil < dto.effectiveFrom) {
      throw new BadRequestException('Effective until must be on or after effective from.');
    }
  }

  private assertFeeScheduleEntity(schedule: ParkingFeeSchedule) {
    if (!isValidIso4217Currency(schedule.currency || '')) {
      throw new BadRequestException('Currency must be a 3-letter ISO 4217 code.');
    }
    if (schedule.maxContractMonths < schedule.minContractMonths) {
      throw new BadRequestException('Maximum contract months must be greater than or equal to minimum months.');
    }
    if (schedule.maxSpaces < schedule.minSpaces) {
      throw new BadRequestException('Maximum truck spaces must be greater than or equal to minimum spaces.');
    }
    if (schedule.effectiveUntil && schedule.effectiveUntil < schedule.effectiveFrom) {
      throw new BadRequestException('Effective until must be on or after effective from.');
    }
    if (schedule.reservationFeeType === 'PERCENTAGE' && toMoneyNumber(schedule.reservationFeeValue) > 100) {
      throw new BadRequestException('Percentage reservation fee must be between 0 and 100.');
    }
  }

  private async assertNoOverlap(schedule: ParkingFeeSchedule) {
    const others = await this.feeScheduleRepo.find({
      where: {
        parkingFacilityId: schedule.parkingFacilityId,
        spaceType: schedule.spaceType,
        vehicleType: schedule.vehicleType,
      },
    });
    const conflict = others.find((item) => {
      if (item.id === schedule.id) return false;
      const status = this.liveStatus(item);
      if (status !== ParkingFeeScheduleStatus.ACTIVE && status !== ParkingFeeScheduleStatus.SCHEDULED) return false;
      return feeSchedulePeriodsOverlap(
        schedule.effectiveFrom,
        schedule.effectiveUntil,
        item.effectiveFrom,
        item.effectiveUntil,
      );
    });
    if (conflict) {
      throw new ConflictException(
        `An ${this.liveStatus(conflict).toLowerCase()} fee schedule already covers this facility, space type, vehicle type, and effective period.`,
      );
    }
  }

  private async auditFeeChange(
    user: AuthUser,
    facility: ParkingFacilityConfig,
    event: string,
    previous: Record<string, unknown>,
    next: Record<string, unknown>,
    scheduleId: string,
  ) {
    const userId = this.actorId(user);
    if (!userId) return;
    try {
      await this.auditLogRepo.save(
        this.auditLogRepo.create({
          userId,
          tenantId: facility.tenantId || user.tenantId || userId,
          action: event === 'UPDATE' ? AuditAction.UPDATE : AuditAction.OTHER,
          description: `Parking fee schedule ${event.toLowerCase()}`,
          metadata: { scheduleId, facilityId: facility.id, previous, next, event },
        }),
      );
    } catch (error) {
      this.logger.warn(`Failed to write parking fee audit log: ${(error as Error).message}`);
    }
  }

  buildFeeQuote(reservation: ParkingReservation, scheduleOrFacility: ParkingFeeSchedule | ParkingFacilityConfig) {
    if ('reservationFeeValue' in scheduleOrFacility) {
      return quoteFromSchedule(scheduleOrFacility, reservation.truckSpacesRequested, reservation.contractMonths);
    }
    return calculateParkingFeeQuote({
      spaces: reservation.truckSpacesRequested,
      months: reservation.contractMonths,
      monthlyRatePerSpace: toMoneyNumber(scheduleOrFacility.monthlyRatePerSpace),
      reservationFee: toMoneyNumber(scheduleOrFacility.reservationFee),
      taxPercent: toMoneyNumber(scheduleOrFacility.taxPercent),
      currency: (scheduleOrFacility.currency || 'USD').toUpperCase(),
    });
  }

  private quoteFromSnapshot(reservation: ParkingReservation) {
    const snapshot = (reservation.feeSnapshot || {}) as Record<string, unknown>;
    if (snapshot.totalAmount == null && reservation.totalAmountDue == null) return null;
    if (snapshot.occupancyAmount == null && reservation.occupancyAmount == null) return null;
    return calculateParkingFeeQuote({
      spaces: reservation.truckSpacesRequested,
      months: reservation.contractMonths,
      monthlyRatePerSpace: toMoneyNumber(
        snapshot.monthlyRatePerSpace ??
          (reservation.truckSpacesRequested * reservation.contractMonths
            ? toMoneyNumber(reservation.occupancyAmount) /
              (reservation.truckSpacesRequested * reservation.contractMonths)
            : 0),
      ),
      reservationFee: toMoneyNumber(snapshot.reservationFee ?? reservation.reservationFeeAmount),
      reservationFeeType: snapshot.reservationFeeType as any,
      reservationFeeApplication: snapshot.reservationFeeApplication as any,
      taxPercent: toMoneyNumber(snapshot.taxPercent ?? reservation.taxPercent),
      taxEnabled: snapshot.taxEnabled as boolean | undefined,
      taxName: (snapshot.taxName as string) || 'VAT',
      currency: (reservation.currency || (snapshot.currency as string) || 'USD').toUpperCase(),
    });
  }

  private async applyApprovalInvoice(reservation: ParkingReservation, user: AuthUser) {
    const facility = await this.getFacility(reservation.tenantId);
    const schedule = reservation.feeScheduleId
      ? await this.feeScheduleRepo.findOne({ where: { id: reservation.feeScheduleId } })
      : null;
    const snapshotQuote = this.quoteFromSnapshot(reservation);
    const quote =
      snapshotQuote ||
      (schedule
        ? this.buildFeeQuote(reservation, schedule)
        : this.buildFeeQuote(reservation, facility));
    reservation.currency = quote.currency;
    reservation.occupancyAmount = quote.occupancyAmount;
    reservation.reservationFeeAmount = quote.reservationFeeAmount;
    reservation.subtotalAmount = quote.subtotalAmount;
    reservation.taxPercent = quote.taxPercent;
    reservation.taxAmount = quote.taxAmount;
    reservation.totalAmountDue = quote.totalAmount;
    reservation.invoiceNumber = invoiceNumberFor(reservation.reservationReference);
    const snapshot = (reservation.feeSnapshot || {}) as Record<string, unknown>;
    reservation.feeSnapshot = {
      ...(schedule ? snapshotFromSchedule(schedule, quote) : { ...quote, monthlyRatePerSpace: quote.monthlyRatePerSpace }),
      ...snapshot,
      ...quote,
    };
    const dueAt = resolvePaymentDueAt({
      paymentDueType: (reservation.feeSnapshot as any).paymentDueType || schedule?.paymentDueType,
      paymentDueDays: Number((reservation.feeSnapshot as any).paymentDueDays ?? schedule?.paymentDueDays ?? facility.paymentDueDays ?? 7),
      invoiceDate: new Date(),
      startDate: reservation.requestedStartDate,
    });
    if (quote.totalAmount > 0) {
      reservation.paymentStatus = ParkingReservationPaymentStatus.DUE;
      reservation.paymentDueAt = dueAt;
      await this.addActivity(reservation, ParkingReservationActivityAction.PAYMENT_REQUESTED, user, {
        metadata: {
          invoiceNumber: reservation.invoiceNumber,
          totalAmount: quote.totalAmount,
          currency: quote.currency,
          paymentStatus: reservation.paymentStatus,
        },
      });
    } else {
      reservation.paymentStatus = ParkingReservationPaymentStatus.NOT_APPLICABLE;
      reservation.paymentDueAt = null as any;
    }
    return quote;
  }

  private async resolveTenantId(user?: AuthUser | null): Promise<string> {
    if (user?.tenantId) return user.tenantId;
    const envTenant = process.env.PARKING_DEFAULT_TENANT_ID;
    if (envTenant) {
      const exists = await this.tenantRepo.findOne({ where: { id: envTenant }, select: ['id'] });
      if (exists) return envTenant;
    }
    const superAdmin = await this.userRepo.findOne({
      where: { role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE },
      order: { createdAt: 'ASC' },
    });
    if (superAdmin?.tenantId) return superAdmin.tenantId;
    const tenant = await this.tenantRepo.findOne({ order: { createdAt: 'ASC' } });
    if (!tenant) {
      throw new BadRequestException('Parking reservations are not available at this time.');
    }
    return tenant.id;
  }

  private async nextReference(manager: EntityManager, year: number): Promise<string> {
    const rows = await manager.query(
      `
      INSERT INTO parking_reservation_sequences (year, "lastNumber")
      VALUES ($1, 1)
      ON CONFLICT (year) DO UPDATE
        SET "lastNumber" = parking_reservation_sequences."lastNumber" + 1
      RETURNING "lastNumber"
      `,
      [year],
    );
    return formatReservationReference(year, Number(rows[0].lastNumber));
  }

  private async findDuplicates(params: {
    tenantId: string;
    companyName: string;
    mcNumber: string;
    usdotNumber: string;
    requestedStartDate: string;
    excludeId?: string;
  }): Promise<ParkingReservation[]> {
    const qb = this.reservationRepo
      .createQueryBuilder('r')
      .where('r.tenantId = :tenantId', { tenantId: params.tenantId })
      .andWhere('LOWER(r.companyName) = LOWER(:companyName)', { companyName: params.companyName })
      .andWhere('r.mcNumber = :mcNumber', { mcNumber: params.mcNumber })
      .andWhere('r.usdotNumber = :usdotNumber', { usdotNumber: params.usdotNumber })
      .andWhere('r.requestedStartDate = :start', { start: params.requestedStartDate })
      .andWhere('r.status NOT IN (:...closed)', {
        closed: [
          ParkingReservationStatus.REJECTED,
          ParkingReservationStatus.CANCELLED,
          ParkingReservationStatus.EXPIRED,
        ],
      });
    if (params.excludeId) {
      qb.andWhere('r.id != :excludeId', { excludeId: params.excludeId });
    }
    return qb.take(10).getMany();
  }

  async create(
    dto: CreateParkingReservationDto,
    user?: AuthUser | null,
    ip?: string,
    idempotencyHeader?: string,
  ) {
    if (dto.website) {
      this.logger.warn('Parking reservation honeypot triggered');
      return {
        success: true,
        message: 'Your truck parking reservation request has been successfully submitted.',
        data: {
          reservationReference: `PR-${new Date().getUTCFullYear()}-000000`,
          status: ParkingReservationStatus.PENDING_REVIEW,
        },
      };
    }

    const idempotencyKey = (idempotencyHeader || dto.idempotencyKey || '').trim() || undefined;
    if (idempotencyKey) {
      const existing = await this.reservationRepo.findOne({ where: { idempotencyKey } });
      if (existing) {
        return { created: false, reservation: this.toPublicView(existing), possibleDuplicate: existing.possibleDuplicate, emailSent: true, emailedTo: [] };
      }
    }

    const tenantId = await this.resolveTenantId(user);
    const facility = await this.getFacility(tenantId);
    const start = this.validateBusinessFields(dto, facility.allowPastStartDates);
    const schedule = await this.findApplicableSchedule({ facility, startDate: start, requireActive: true });
    if (!schedule) {
      throw new BadRequestException(
        'Reservation cannot be completed because no active pricing schedule is available for this parking space.',
      );
    }
    const limitError = validateContractLimits({
      spaces: dto.truckSpacesRequested,
      months: dto.contractMonths,
      minSpaces: schedule.minSpaces,
      maxSpaces: schedule.maxSpaces,
      minContractMonths: schedule.minContractMonths,
      maxContractMonths: schedule.maxContractMonths,
    });
    if (limitError) throw new BadRequestException(limitError);
    const quote = quoteFromSchedule(schedule, dto.truckSpacesRequested, dto.contractMonths);
    const snapshot = snapshotFromSchedule(schedule, quote);
    const end = addMonths(start, dto.contractMonths);
    const mcNumber = normalizeMcNumber(dto.mcNumber);
    const usdotNumber = normalizeUsdotNumber(dto.usdotNumber);
    const startDate = toDateString(start);

    const duplicates = await this.findDuplicates({
      tenantId,
      companyName: dto.companyName,
      mcNumber,
      usdotNumber,
      requestedStartDate: startDate,
    });

    const reservation = await this.dataSource.transaction(async (manager) => {
      const year = start.getUTCFullYear();
      const reservationReference = await this.nextReference(manager, year);
      const entity = manager.create(ParkingReservation, {
        reservationReference,
        tenantId,
        companyName: dto.companyName,
        mcNumber,
        usdotNumber,
        companyPhone: dto.companyPhone.trim(),
        email: dto.email.trim().toLowerCase(),
        driverEmail: dto.driverEmail.trim().toLowerCase(),
        driverFirstName: dto.driverFirstName,
        driverLastName: dto.driverLastName,
        truckSpacesRequested: dto.truckSpacesRequested,
        contractMonths: dto.contractMonths,
        requestedStartDate: startDate,
        contractEndDate: toDateString(end),
        status: ParkingReservationStatus.PENDING_REVIEW,
        customerNotes: dto.customerNotes,
        agreementAccepted: true,
        signature: dto.signature,
        signedAt: new Date(),
        submittedByUserId: this.actorId(user),
        possibleDuplicate: duplicates.length > 0,
        duplicateOfReferences: duplicates.map((d) => d.reservationReference),
        idempotencyKey,
        submitterIpHash: this.hashIp(ip),
        feeScheduleId: schedule.id,
        currency: quote.currency,
        occupancyAmount: quote.occupancyAmount,
        reservationFeeAmount: quote.reservationFeeAmount,
        subtotalAmount: quote.subtotalAmount,
        taxPercent: quote.taxPercent,
        taxAmount: quote.taxAmount,
        totalAmountDue: quote.totalAmount,
        feeSnapshot: snapshot,
      });
      const saved = await manager.save(ParkingReservation, entity);
      await manager.save(
        ParkingReservationActivity,
        manager.create(ParkingReservationActivity, {
          reservationId: saved.id,
          action: ParkingReservationActivityAction.RESERVATION_CREATED,
          actorUserId: this.actorId(user),
          actorRole: user?.role || 'GUEST',
          actorLabel: user?.email || dto.driverEmail || dto.email,
          newStatus: ParkingReservationStatus.PENDING_REVIEW,
          metadata: {
            companyName: saved.companyName,
            truckSpacesRequested: saved.truckSpacesRequested,
            possibleDuplicate: saved.possibleDuplicate,
            feeScheduleId: schedule.id,
            feeScheduleVersion: schedule.version,
            grandTotal: quote.totalAmount,
            currency: quote.currency,
          },
        }),
      );
      return saved;
    });

    const listenerResults = await this.eventEmitter.emitAsync('parking.reservation.created', {
      reservation,
      actorId: this.actorId(user),
    });
    const emailResult = listenerResults.find(
      (result) => result && typeof result === 'object' && 'emailSent' in result,
    ) as { emailSent?: boolean; sentTo?: string[] } | undefined;

    return {
      created: true,
      reservation: this.toPublicView(reservation),
      possibleDuplicate: reservation.possibleDuplicate,
      emailSent: emailResult?.emailSent === true,
      emailedTo: emailResult?.sentTo || [],
    };
  }

  async lookup(dto: LookupParkingReservationDto) {
    const reservation = await this.findByReferenceAndEmail(dto.reservationReference, dto.email);
    if (!reservation) {
      throw new NotFoundException('No reservation was found for that reference and email.');
    }
    return this.toPublicDetailView(reservation);
  }

  async guestRespond(dto: GuestInformationResponseDto) {
    const reservation = await this.findByReferenceAndEmail(dto.reservationReference, dto.email);
    if (!reservation) {
      throw new NotFoundException('No reservation was found for that reference and email.');
    }
    if (reservation.status !== ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED) {
      throw new ConflictException('This reservation is not waiting for additional information.');
    }
    return this.recordInformationResponse(reservation, dto.response, {
      email: dto.email,
      role: 'GUEST',
    });
  }

  async findAll(filter: ParkingReservationFilterDto, user: AuthUser) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const qb = this.reservationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.assignedTo', 'assignedTo')
      .leftJoinAndSelect('assignedTo.profile', 'assignedProfile');

    this.applyVisibility(qb, user);

    if (filter.status) {
      qb.andWhere('r.status = :status', { status: filter.status });
    }
    if (filter.companyName) {
      qb.andWhere('LOWER(r.companyName) LIKE :company', {
        company: `%${filter.companyName.toLowerCase()}%`,
      });
    }
    if (filter.assignedToUserId) {
      qb.andWhere('r.assignedToUserId = :assignedToUserId', {
        assignedToUserId: filter.assignedToUserId,
      });
    }
    if (filter.dateFrom) {
      qb.andWhere('r.requestedStartDate >= :dateFrom', { dateFrom: filter.dateFrom });
    }
    if (filter.dateTo) {
      qb.andWhere('r.requestedStartDate <= :dateTo', { dateTo: filter.dateTo });
    }
    if (filter.search) {
      const term = `%${filter.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('LOWER(r.reservationReference) LIKE :term', { term })
            .orWhere('LOWER(r.companyName) LIKE :term', { term })
            .orWhere('LOWER(r.mcNumber) LIKE :term', { term })
            .orWhere('LOWER(r.usdotNumber) LIKE :term', { term })
            .orWhere('LOWER(r.email) LIKE :term', { term })
            .orWhere('LOWER(r.driverEmail) LIKE :term', { term })
            .orWhere("LOWER(CONCAT(r.driverFirstName, ' ', r.driverLastName)) LIKE :term", { term });
        }),
      );
    }

    const sortable = new Set([
      'createdAt',
      'requestedStartDate',
      'companyName',
      'status',
      'truckSpacesRequested',
      'contractMonths',
      'reservationReference',
    ]);
    const sortBy = sortable.has(filter.sortBy || '') ? filter.sortBy : 'createdAt';
    const sortDir = filter.sortDir === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(`r.${sortBy}`, sortDir);

    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    const activitiesByReservation = await this.loadActivitiesFor(items.map((item) => item.id), !this.isStaff(user.role));
    const mapper = this.isStaff(user.role) ? this.toOfficerListView : this.toPublicView;
    return {
      items: items.map((item) => ({
        ...mapper.call(this, item),
        activities: activitiesByReservation.get(item.id) || [],
      })),
      total,
      page,
      limit,
    };
  }

  private async loadActivitiesFor(ids: string[], publicOnly: boolean) {
    const map = new Map<string, ReturnType<ParkingReservationsService['toActivityView']>[]>();
    if (!ids.length) return map;
    const activities = await this.activityRepo
      .createQueryBuilder('a')
      .where('a.reservationId IN (:...ids)', { ids })
      .orderBy('a.createdAt', 'ASC')
      .getMany();
    for (const activity of activities) {
      if (publicOnly && activity.action === ParkingReservationActivityAction.NOTE_ADDED) continue;
      const view = publicOnly ? this.toPublicActivityView(activity) : this.toActivityView(activity);
      const list = map.get(activity.reservationId) || [];
      list.push(view);
      map.set(activity.reservationId, list);
    }
    return map;
  }

  async getStats(user: AuthUser) {
    this.assertStaff(user);
    const qb = this.reservationRepo.createQueryBuilder('r');
    this.applyVisibility(qb, user);

    const rows = await qb
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.status')
      .getRawMany<{ status: ParkingReservationStatus; count: string }>();

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.status] = Number(row.count);
    }

    const todayStart = startOfTodayUtc();
    const todayQb = this.reservationRepo.createQueryBuilder('r');
    this.applyVisibility(todayQb, user);
    const todaysRequests = await todayQb
      .andWhere('r.createdAt >= :today', { today: todayStart.toISOString() })
      .getCount();

    return {
      pendingReview: counts[ParkingReservationStatus.PENDING_REVIEW] || 0,
      underReview: counts[ParkingReservationStatus.UNDER_REVIEW] || 0,
      approved: counts[ParkingReservationStatus.APPROVED] || 0,
      additionalInformationRequired: counts[ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED] || 0,
      rejected: counts[ParkingReservationStatus.REJECTED] || 0,
      cancelled: counts[ParkingReservationStatus.CANCELLED] || 0,
      todaysRequests,
    };
  }

  async findOne(id: string, user: AuthUser) {
    const reservation = await this.loadReservation(id);
    this.assertCanView(reservation, user);
    const activities = await this.activityRepo.find({
      where: { reservationId: reservation.id },
      order: { createdAt: 'ASC' },
    });
    const duplicates = reservation.possibleDuplicate
      ? await this.findDuplicates({
          tenantId: reservation.tenantId,
          companyName: reservation.companyName,
          mcNumber: reservation.mcNumber,
          usdotNumber: reservation.usdotNumber,
          requestedStartDate: reservation.requestedStartDate,
          excludeId: reservation.id,
        })
      : [];
    const capacity = this.isStaff(user.role)
      ? await this.evaluateCapacity(reservation)
      : undefined;
    const facility = await this.getFacility(reservation.tenantId);
    let feeQuote = this.quoteFromSnapshot(reservation);
    if (!feeQuote && reservation.paymentStatus === ParkingReservationPaymentStatus.NOT_APPLICABLE) {
      const schedule = reservation.feeScheduleId
        ? await this.feeScheduleRepo.findOne({ where: { id: reservation.feeScheduleId } })
        : null;
      feeQuote = this.buildFeeQuote(reservation, schedule || facility);
    }

    if (this.isStaff(user.role)) {
      return {
        ...this.toOfficerDetailView(reservation, facility),
        activities: activities.map((a) => this.toActivityView(a)),
        possibleDuplicates: duplicates.map((d) => ({
          id: d.id,
          reservationReference: d.reservationReference,
          status: d.status,
          createdAt: d.createdAt,
        })),
        capacity,
        feeQuote,
      };
    }

    return this.withPublicActivities(
      this.toPublicView(reservation, { facility, includeInstructions: true }),
      activities,
    );
  }

  async getActivity(id: string, user: AuthUser) {
    const reservation = await this.loadReservation(id);
    this.assertCanView(reservation, user);
    const activities = await this.activityRepo.find({
      where: { reservationId: reservation.id },
      order: { createdAt: 'ASC' },
    });
    if (this.isStaff(user.role)) {
      return activities.map((a) => this.toActivityView(a));
    }
    return activities
      .filter((a) => a.action !== ParkingReservationActivityAction.NOTE_ADDED)
      .map((a) => this.toPublicActivityView(a));
  }

  async startReview(id: string, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    this.assertTransition(reservation, ParkingReservationStatus.UNDER_REVIEW);
    reservation.status = ParkingReservationStatus.UNDER_REVIEW;
    reservation.reviewedByUserId = this.actorId(user);
    reservation.reviewedAt = new Date();
    if (!reservation.assignedToUserId) {
      reservation.assignedToUserId = this.actorId(user);
      reservation.assignedAt = new Date();
      reservation.assignedByUserId = this.actorId(user);
    }
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.REVIEW_STARTED, user, {
      previousStatus: ParkingReservationStatus.PENDING_REVIEW,
      newStatus: ParkingReservationStatus.UNDER_REVIEW,
    });
    await this.emitChanged(reservation, user, 'review_started');
    return this.findOne(id, user);
  }

  async assign(id: string, dto: AssignParkingReservationDto, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    const officer = await this.userRepo.findOne({ where: { id: dto.assignedToUserId } });
    if (!officer || officer.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('The selected officer could not be found.');
    }
    if (!this.isStaff(officer.role)) {
      throw new BadRequestException('Reservations can only be assigned to parking staff.');
    }
    const previousAssignee = reservation.assignedToUserId;
    const isReassign = !!previousAssignee && previousAssignee !== dto.assignedToUserId;
    reservation.assignedToUserId = dto.assignedToUserId;
    reservation.assignedAt = new Date();
    reservation.assignedByUserId = this.actorId(user);
    await this.reservationRepo.save(reservation);
    await this.addActivity(
      reservation,
      isReassign
        ? ParkingReservationActivityAction.RESERVATION_REASSIGNED
        : ParkingReservationActivityAction.RESERVATION_ASSIGNED,
      user,
      {
        metadata: {
          assignedToUserId: dto.assignedToUserId,
          previousAssignee,
        },
      },
    );
    await this.eventEmitter.emitAsync('parking.reservation.assigned', {
      reservation,
      actorId: this.actorId(user),
      assignedToUserId: dto.assignedToUserId,
    });
    return this.findOne(id, user);
  }

  async approve(id: string, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    if (reservation.status === ParkingReservationStatus.APPROVED) {
      throw new ConflictException('This reservation has already been processed and cannot be changed using this action.');
    }
    this.assertTransition(reservation, ParkingReservationStatus.APPROVED);
    const capacity = await this.evaluateCapacity(reservation);
    if (!capacity.sufficient) {
      throw new ConflictException(
        'There is currently insufficient parking capacity for the requested period. Please choose another date or contact the parking team.',
      );
    }
    const previous = reservation.status;
    reservation.status = ParkingReservationStatus.APPROVED;
    reservation.approvedByUserId = this.actorId(user);
    reservation.approvedAt = new Date();
    reservation.reviewedByUserId = this.actorId(user);
    reservation.reviewedAt = new Date();
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.RESERVATION_APPROVED, user, {
      previousStatus: previous,
      newStatus: ParkingReservationStatus.APPROVED,
      metadata: { capacity },
    });
    const quote = await this.applyApprovalInvoice(reservation, user);
    await this.reservationRepo.save(reservation);
    await this.eventEmitter.emitAsync('parking.reservation.approved', {
      reservation,
      actorId: this.actorId(user),
      paymentRequested: reservation.paymentStatus === ParkingReservationPaymentStatus.DUE,
      quote,
    });
    return this.findOne(id, user);
  }

  async reject(id: string, dto: RejectParkingReservationDto, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    if (reservation.status === ParkingReservationStatus.REJECTED) {
      throw new ConflictException('This reservation has already been processed and cannot be changed using this action.');
    }
    this.assertTransition(reservation, ParkingReservationStatus.REJECTED);
    const previous = reservation.status;
    const reason = [dto.reason, dto.additionalExplanation].filter(Boolean).join('\n\n');
    reservation.status = ParkingReservationStatus.REJECTED;
    reservation.rejectionReason = reason;
    reservation.rejectedByUserId = this.actorId(user);
    reservation.rejectedAt = new Date();
    reservation.reviewedByUserId = this.actorId(user);
    reservation.reviewedAt = new Date();
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.RESERVATION_REJECTED, user, {
      previousStatus: previous,
      newStatus: ParkingReservationStatus.REJECTED,
      metadata: { reason: dto.reason },
    });
    await this.eventEmitter.emitAsync('parking.reservation.rejected', {
      reservation,
      actorId: this.actorId(user),
    });
    return this.findOne(id, user);
  }

  async requestInformation(id: string, dto: RequestInformationDto, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    this.assertTransition(reservation, ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED);
    const previous = reservation.status;
    reservation.status = ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED;
    reservation.informationRequested = dto.informationRequired;
    reservation.informationResponse = null as any;
    reservation.informationRespondedAt = null as any;
    reservation.reviewedByUserId = this.actorId(user);
    reservation.reviewedAt = new Date();
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.INFORMATION_REQUESTED, user, {
      previousStatus: previous,
      newStatus: ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED,
      metadata: { informationRequired: dto.informationRequired },
    });
    await this.eventEmitter.emitAsync('parking.reservation.information_requested', {
      reservation,
      actorId: this.actorId(user),
    });
    return this.findOne(id, user);
  }

  async reviewResponse(id: string, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    if (reservation.status !== ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED) {
      throw new ConflictException('This reservation has already been processed and cannot be changed using this action.');
    }
    if (!reservation.informationResponse) {
      throw new BadRequestException('The applicant has not submitted a response yet.');
    }
    return this.startReviewFromInfo(reservation, user);
  }

  async respondAsUser(id: string, response: string, user: AuthUser) {
    const reservation = await this.loadReservation(id);
    this.assertCanView(reservation, user);
    if (reservation.status !== ParkingReservationStatus.ADDITIONAL_INFORMATION_REQUIRED) {
      throw new ConflictException('This reservation is not waiting for additional information.');
    }
    return this.recordInformationResponse(reservation, response, user);
  }

  async guestPay(dto: GuestParkingPaymentDto) {
    const reservation = await this.findByReferenceAndEmail(dto.reservationReference, dto.email);
    if (!reservation) {
      throw new NotFoundException('No reservation was found for that reference and email.');
    }
    return this.submitPayment(
      reservation,
      {
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
        notes: dto.notes,
      },
      { email: dto.email, role: 'GUEST' },
      false,
    );
  }

  async initiateIshemaPayment(
    reservation: ParkingReservation,
    phoneNumber: string,
    user: AuthUser,
  ) {
    if (reservation.status !== ParkingReservationStatus.APPROVED) {
      throw new ConflictException('Pay now is available after the parking team confirms the reservation.');
    }
    const current = effectivePaymentStatus(reservation.paymentStatus, reservation.paymentDueAt);
    if (reservation.paymentStatus === ParkingReservationPaymentStatus.PAID) {
      throw new ConflictException('This reservation has already been paid.');
    }
    if (
      reservation.paymentStatus === ParkingReservationPaymentStatus.NOT_APPLICABLE ||
      reservation.paymentStatus === ParkingReservationPaymentStatus.WAIVED ||
      reservation.paymentStatus === ParkingReservationPaymentStatus.CANCELLED
    ) {
      throw new ConflictException('No parking reservation fees are due for this reservation.');
    }
    if (!['DUE', 'OVERDUE', 'PENDING_VERIFICATION'].includes(current)) {
      throw new ConflictException('This reservation is not awaiting payment.');
    }

    const amount = toMoneyNumber(reservation.totalAmountDue);
    if (amount <= 0) {
      throw new BadRequestException('There is no amount due for this reservation.');
    }

    const platformPhone = this.configService.get<string>('MOBILE_MONEY_ACCOUNT_PHONE');
    if (!platformPhone) {
      throw new BadRequestException('Mobile money collection is not configured.');
    }

    const referenceId = `PARK-${reservation.reservationReference.replace(/[^A-Z0-9]/gi, '')}-${Date.now().toString(36)}`.slice(0, 80);
    const message = `Nova Parking 365 ${reservation.reservationReference}`;
    const response = await this.mobileMoneyPaymentService.createTransaction(
      amount,
      phoneNumber,
      referenceId,
      message,
      [
        {
          percentage: 100,
          phoneNumber: platformPhone,
          receiverMessage: message.slice(0, 160),
        },
      ],
    );
    const status = (response.savedTransaction?.status || response.transaction?.status || 'pending').toLowerCase();
    if (status === 'failed') {
      throw new BadRequestException('Ishema could not start the payment. Check the phone number and try again.');
    }

    reservation.paymentMethod = ParkingReservationPaymentMethod.MOBILE_MONEY;
    reservation.paymentReference = referenceId;
    reservation.paymentStatus = ParkingReservationPaymentStatus.PENDING_VERIFICATION;
    reservation.paymentNotes = `Ishema collection started for ${phoneNumber}`;
    reservation.feeSnapshot = {
      ...(reservation.feeSnapshot || {}),
      ishemaReferenceId: referenceId,
      ishemaPhone: phoneNumber,
    };
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.PAYMENT_SUBMITTED, user, {
      metadata: { paymentMethod: ParkingReservationPaymentMethod.MOBILE_MONEY, paymentReference: referenceId },
    });

    if (status === 'success') {
      await this.markReservationPaidFromIshema(reservation, referenceId, user);
    }

    return {
      reservation: await this.toPublicDetailView(reservation),
      referenceId,
      providerStatus: status,
      amount,
      currency: reservation.currency || 'RWF',
      message:
        status === 'success'
          ? 'Payment confirmed by Ishema. Your reservation is approved.'
          : 'Approve the payment prompt on your phone to complete this reservation.',
    };
  }

  async guestInitiateIshema(dto: GuestIshemaPayDto) {
    const reservation = await this.findByReferenceAndEmail(dto.reservationReference, dto.email);
    if (!reservation) {
      throw new NotFoundException('No reservation was found for that reference and email.');
    }
    return this.initiateIshemaPayment(reservation, dto.phoneNumber, { email: dto.email, role: 'GUEST' });
  }

  async initiateIshemaAsUser(id: string, phoneNumber: string, user: AuthUser) {
    const reservation = await this.loadReservation(id);
    this.assertCanView(reservation, user);
    return this.initiateIshemaPayment(reservation, phoneNumber, user);
  }

  async guestIshemaStatus(dto: GuestIshemaPayStatusDto) {
    const reservation = await this.findByReferenceAndEmail(dto.reservationReference, dto.email);
    if (!reservation) {
      throw new NotFoundException('No reservation was found for that reference and email.');
    }
    return this.refreshIshemaStatus(
      reservation,
      dto.referenceId,
      { email: dto.email, role: 'GUEST' },
    );
  }

  async refreshIshemaStatusAsUser(id: string, referenceId: string | undefined, user: AuthUser) {
    const reservation = await this.loadReservation(id);
    this.assertCanView(reservation, user);
    return this.refreshIshemaStatus(reservation, referenceId, user);
  }

  async confirmFromIshemaWebhook(payload: { referenceId: string; transactionId?: string; paymentId?: string }) {
    const reservation = await this.findByIshemaReference(payload.referenceId);
    if (!reservation) {
      this.logger.warn(`No parking reservation for Ishema reference ${payload.referenceId}`);
      return null;
    }
    return this.markReservationPaidFromIshema(
      reservation,
      payload.referenceId,
      { email: 'Ishema', role: 'SYSTEM' },
    );
  }

  private async refreshIshemaStatus(
    reservation: ParkingReservation,
    referenceId: string | undefined,
    user: AuthUser,
  ) {
    if (reservation.paymentStatus === ParkingReservationPaymentStatus.PAID) {
      return {
        providerStatus: 'success',
        reservation: await this.toPublicDetailView(reservation),
      };
    }
    const ref =
      referenceId ||
      reservation.paymentReference ||
      ((reservation.feeSnapshot || {}) as Record<string, unknown>).ishemaReferenceId;
    if (!ref || typeof ref !== 'string') {
      throw new BadRequestException('No Ishema payment has been started for this reservation.');
    }

    const statusResponse = await this.mobileMoneyPaymentService.checkTransactionStatus(ref);
    const status = (
      statusResponse.savedTransaction?.status ||
      statusResponse.transaction?.status ||
      'pending'
    ).toLowerCase();

    if (status === 'success') {
      await this.markReservationPaidFromIshema(reservation, ref, user);
    } else if (status === 'failed') {
      if (reservation.paymentStatus === ParkingReservationPaymentStatus.PENDING_VERIFICATION) {
        reservation.paymentStatus = ParkingReservationPaymentStatus.DUE;
        await this.reservationRepo.save(reservation);
      }
    }

    return {
      providerStatus: status,
      reservation: await this.toPublicDetailView(reservation),
    };
  }

  private async findByIshemaReference(referenceId: string) {
    return this.reservationRepo
      .createQueryBuilder('r')
      .where('r.paymentReference = :ref', { ref: referenceId })
      .orWhere(`r."feeSnapshot"->>'ishemaReferenceId' = :ref`, { ref: referenceId })
      .getOne();
  }

  private async markReservationPaidFromIshema(
    reservation: ParkingReservation,
    referenceId: string,
    user: AuthUser,
  ) {
    if (reservation.paymentStatus === ParkingReservationPaymentStatus.PAID) {
      if (reservation.status !== ParkingReservationStatus.APPROVED) {
        reservation.status = ParkingReservationStatus.APPROVED;
        reservation.approvedAt = reservation.approvedAt || new Date();
        await this.reservationRepo.save(reservation);
      }
      return this.toPublicDetailView(reservation);
    }

    reservation.paymentStatus = ParkingReservationPaymentStatus.PAID;
    reservation.paidAt = new Date();
    reservation.paidAmount = toMoneyNumber(reservation.totalAmountDue);
    reservation.paymentMethod = ParkingReservationPaymentMethod.MOBILE_MONEY;
    reservation.paymentReference = referenceId;
    if (reservation.status !== ParkingReservationStatus.APPROVED) {
      reservation.status = ParkingReservationStatus.APPROVED;
      reservation.approvedAt = reservation.approvedAt || new Date();
    }
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.PAYMENT_RECEIVED, user, {
      metadata: {
        paymentMethod: ParkingReservationPaymentMethod.MOBILE_MONEY,
        paymentReference: referenceId,
        amount: reservation.paidAmount,
        currency: reservation.currency,
        provider: 'ishema',
      },
    });
    await this.eventEmitter.emitAsync('parking.reservation.payment_received', {
      reservation,
      actorId: this.actorId(user),
    });
    return this.toPublicDetailView(reservation);
  }

  async payAsUser(id: string, dto: SubmitParkingPaymentDto, user: AuthUser) {
    const reservation = await this.loadReservation(id);
    this.assertCanView(reservation, user);
    return this.submitPayment(reservation, dto, user, false);
  }

  async confirmPayment(id: string, dto: SubmitParkingPaymentDto, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    return this.submitPayment(reservation, dto, user, true);
  }

  async waivePayment(id: string, dto: WaiveParkingPaymentDto, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    if (reservation.status !== ParkingReservationStatus.APPROVED) {
      throw new ConflictException('Fees can only be waived for an approved reservation.');
    }
    if (reservation.paymentStatus === ParkingReservationPaymentStatus.PAID) {
      throw new ConflictException('This reservation has already been paid.');
    }
    reservation.paymentStatus = ParkingReservationPaymentStatus.WAIVED;
    reservation.paymentNotes = dto.reason;
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.PAYMENT_WAIVED, user, {
      metadata: { reason: dto.reason },
    });
    await this.eventEmitter.emitAsync('parking.reservation.payment_waived', {
      reservation,
      actorId: this.actorId(user),
    });
    return this.findOne(id, user);
  }

  private async submitPayment(
    reservation: ParkingReservation,
    dto: SubmitParkingPaymentDto,
    user: AuthUser,
    autoConfirm: boolean,
  ) {
    const current = effectivePaymentStatus(reservation.paymentStatus, reservation.paymentDueAt);
    if (reservation.status !== ParkingReservationStatus.APPROVED) {
      throw new ConflictException('Payment can only be submitted for an approved reservation.');
    }
    if (reservation.paymentStatus === ParkingReservationPaymentStatus.PAID) {
      throw new ConflictException('This reservation has already been paid.');
    }
    if (
      reservation.paymentStatus === ParkingReservationPaymentStatus.NOT_APPLICABLE ||
      reservation.paymentStatus === ParkingReservationPaymentStatus.WAIVED ||
      reservation.paymentStatus === ParkingReservationPaymentStatus.CANCELLED
    ) {
      throw new ConflictException('No parking reservation fees are due for this reservation.');
    }
    if (!['DUE', 'OVERDUE', 'PENDING_VERIFICATION'].includes(current)) {
      throw new ConflictException('This reservation is not awaiting payment.');
    }

    reservation.paymentMethod = dto.paymentMethod;
    reservation.paymentReference = dto.paymentReference;
    reservation.paymentNotes = dto.notes;
    reservation.paidAmount = toMoneyNumber(reservation.totalAmountDue);

    if (autoConfirm) {
      reservation.paymentStatus = ParkingReservationPaymentStatus.PAID;
      reservation.paidAt = new Date();
      await this.reservationRepo.save(reservation);
      await this.addActivity(reservation, ParkingReservationActivityAction.PAYMENT_RECEIVED, user, {
        metadata: {
          paymentMethod: dto.paymentMethod,
          paymentReference: dto.paymentReference,
          amount: reservation.paidAmount,
          currency: reservation.currency,
        },
      });
      await this.eventEmitter.emitAsync('parking.reservation.payment_received', {
        reservation,
        actorId: this.actorId(user),
      });
    } else {
      reservation.paymentStatus = ParkingReservationPaymentStatus.PENDING_VERIFICATION;
      await this.reservationRepo.save(reservation);
      await this.addActivity(reservation, ParkingReservationActivityAction.PAYMENT_SUBMITTED, user, {
        metadata: {
          paymentMethod: dto.paymentMethod,
          paymentReference: dto.paymentReference,
        },
      });
      await this.eventEmitter.emitAsync('parking.reservation.payment_submitted', {
        reservation,
        actorId: this.actorId(user),
      });
    }

    if (this.isStaff(user.role)) {
      return this.findOne(reservation.id, user);
    }
    return this.toPublicDetailView(reservation);
  }

  async cancel(id: string, dto: CancelParkingReservationDto, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    const snapshot = (reservation.feeSnapshot || {}) as Record<string, unknown>;
    if (snapshot.cancellationAllowed === false) {
      throw new BadRequestException('Cancellation is not allowed for this reservation under the applicable fee schedule.');
    }
    this.assertTransition(reservation, ParkingReservationStatus.CANCELLED);
    const previous = reservation.status;
    reservation.status = ParkingReservationStatus.CANCELLED;
    reservation.cancellationReason = dto.reason;
    reservation.cancelledByUserId = this.actorId(user);
    reservation.cancelledAt = new Date();
    if (
      reservation.paymentStatus === ParkingReservationPaymentStatus.DUE ||
      reservation.paymentStatus === ParkingReservationPaymentStatus.PENDING_VERIFICATION ||
      reservation.paymentStatus === ParkingReservationPaymentStatus.OVERDUE
    ) {
      reservation.paymentStatus = ParkingReservationPaymentStatus.CANCELLED;
    }
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.RESERVATION_CANCELLED, user, {
      previousStatus: previous,
      newStatus: ParkingReservationStatus.CANCELLED,
      metadata: { reason: dto.reason },
    });
    await this.eventEmitter.emitAsync('parking.reservation.cancelled', {
      reservation,
      actorId: this.actorId(user),
    });
    return this.findOne(id, user);
  }

  async addNote(id: string, dto: AddParkingNoteDto, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    reservation.internalNotes = [reservation.internalNotes, dto.note].filter(Boolean).join('\n\n');
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.NOTE_ADDED, user, {
      metadata: { note: dto.note },
    });
    return this.findOne(id, user);
  }

  async listOfficers(user: AuthUser) {
    this.assertStaff(user);
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.profile', 'profile')
      .where('u.role::text IN (:...roles)', {
        roles: [
          UserRole.PARKING_RESERVATION_MANAGER,
          UserRole.ADMIN,
          UserRole.SUPER_ADMIN,
          UserRole.TENANT_ADMIN,
        ],
      })
      .andWhere('u.status = :status', { status: UserStatus.ACTIVE });
    if (!this.isPlatformStaff(user.role) && user.tenantId) {
      qb.andWhere('u.tenantId = :tenantId', { tenantId: user.tenantId });
    }
    const officers = await qb.orderBy('u.email', 'ASC').getMany();
    return officers.map((officer) => ({
      id: officer.id,
      email: officer.email,
      role: officer.role,
      firstName: officer.profile?.firstName,
      lastName: officer.profile?.lastName,
    }));
  }

  async exportCsv(filter: ParkingReservationFilterDto, user: AuthUser): Promise<string> {
    this.assertStaff(user);
    const result = await this.findAll({ ...filter, page: 1, limit: 100 }, user);
    const header = [
      'Reference',
      'Company',
      'MC Number',
      'USDOT',
      'Company Email',
      'Driver Email',
      'Driver Name',
      'Spaces',
      'Duration',
      'Requested Date',
      'Submitted',
      'Status',
      'Payment Status',
      'Amount Due',
      'Currency',
    ];
    const lines = [header.join(',')];
    for (const row of result.items as any[]) {
      lines.push(
        [
          row.reservationReference,
          row.companyName,
          row.mcNumber,
          row.usdotNumber,
          row.email,
          row.driverEmail || row.email,
          `${row.driverFirstName || ''} ${row.driverLastName || ''}`.trim(),
          row.truckSpacesRequested,
          row.contractMonths,
          row.requestedStartDate,
          row.createdAt,
          row.status,
          row.payment?.status || '',
          row.payment?.totalAmount ?? '',
          row.payment?.currency || '',
        ]
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      );
    }
    return lines.join('\n');
  }

  private async startReviewFromInfo(reservation: ParkingReservation, user: AuthUser) {
    const previous = reservation.status;
    reservation.status = ParkingReservationStatus.UNDER_REVIEW;
    reservation.reviewedByUserId = this.actorId(user);
    reservation.reviewedAt = new Date();
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.REVIEW_STARTED, user, {
      previousStatus: previous,
      newStatus: ParkingReservationStatus.UNDER_REVIEW,
    });
    await this.emitChanged(reservation, user, 'review_started');
    return this.findOne(reservation.id, user);
  }

  private async recordInformationResponse(
    reservation: ParkingReservation,
    response: string,
    user: AuthUser,
  ) {
    const previous = reservation.status;
    reservation.informationResponse = response;
    reservation.informationRespondedAt = new Date();
    reservation.status = ParkingReservationStatus.UNDER_REVIEW;
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.INFORMATION_RECEIVED, user, {
      previousStatus: previous,
      newStatus: ParkingReservationStatus.UNDER_REVIEW,
    });
    await this.eventEmitter.emitAsync('parking.reservation.information_received', {
      reservation,
      actorId: this.actorId(user),
    });
    return this.toPublicDetailView(reservation);
  }

  async evaluateCapacity(reservation: ParkingReservation) {
    const facility = await this.getFacility(reservation.tenantId);
    const start = toUtcDateOnly(reservation.requestedStartDate);
    const end = toUtcDateOnly(reservation.contractEndDate);
    const approved = await this.reservationRepo.find({
      where: { status: ParkingReservationStatus.APPROVED },
    });
    const reservedSpaces = approved
      .filter((item) => item.id !== reservation.id)
      .filter((item) =>
        periodsOverlap(start, end, toUtcDateOnly(item.requestedStartDate), toUtcDateOnly(item.contractEndDate)),
      )
      .reduce((sum, item) => sum + item.truckSpacesRequested, 0);
    const remaining = facility.totalCapacity - reservedSpaces;
    return {
      facilityName: facility.facilityName,
      totalCapacity: facility.totalCapacity,
      reservedSpaces,
      remaining,
      requested: reservation.truckSpacesRequested,
      sufficient: hasSufficientCapacity(
        facility.totalCapacity,
        reservedSpaces,
        reservation.truckSpacesRequested,
      ),
    };
  }

  private applyVisibility(qb: ReturnType<Repository<ParkingReservation>['createQueryBuilder']>, user: AuthUser) {
    if (this.isPlatformStaff(user.role)) {
      return;
    }
    if (user.role === UserRole.TENANT_ADMIN && user.tenantId) {
      qb.andWhere('r.tenantId = :tenantId', { tenantId: user.tenantId });
      return;
    }
    const userId = this.actorId(user);
    qb.andWhere(
      new Brackets((sub) => {
        if (userId) sub.where('r.submittedByUserId = :userId', { userId });
        if (user.email) {
          sub.orWhere('LOWER(r.email) = :email', { email: user.email.toLowerCase() });
          sub.orWhere('LOWER(r.driverEmail) = :email', { email: user.email.toLowerCase() });
        }
      }),
    );
  }

  private async loadReservation(id: string): Promise<ParkingReservation> {
    const reservation = await this.reservationRepo.findOne({
      where: { id },
      relations: ['assignedTo', 'assignedTo.profile', 'reviewedBy', 'reviewedBy.profile', 'submittedBy'],
    });
    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }
    return reservation;
  }

  private async loadManaged(id: string, user: AuthUser): Promise<ParkingReservation> {
    this.assertStaff(user);
    const reservation = await this.loadReservation(id);
    if (user.role === UserRole.TENANT_ADMIN && reservation.tenantId !== user.tenantId) {
      throw new ForbiddenException("You don't have permission to perform this action.");
    }
    return reservation;
  }

  private assertStaff(user: AuthUser) {
    if (!this.isStaff(user.role)) {
      throw new ForbiddenException("You don't have permission to perform this action.");
    }
  }

  private assertCanView(reservation: ParkingReservation, user: AuthUser) {
    if (this.isPlatformStaff(user.role)) return;
    if (user.role === UserRole.TENANT_ADMIN && reservation.tenantId === user.tenantId) return;
    const userId = this.actorId(user);
    if (userId && reservation.submittedByUserId === userId) return;
    if (
      user.email &&
      (reservation.email === user.email.toLowerCase() || reservation.driverEmail === user.email.toLowerCase())
    ) {
      return;
    }
    throw new ForbiddenException("You don't have permission to perform this action.");
  }

  private assertTransition(reservation: ParkingReservation, next: ParkingReservationStatus) {
    if (!canTransition(reservation.status, next)) {
      throw new ConflictException(
        'This reservation has already been processed and cannot be changed using this action.',
      );
    }
  }

  private async addActivity(
    reservation: ParkingReservation,
    action: ParkingReservationActivityAction,
    user: AuthUser,
    extra?: {
      previousStatus?: ParkingReservationStatus;
      newStatus?: ParkingReservationStatus;
      metadata?: Record<string, unknown>;
    },
  ) {
    const activity = this.activityRepo.create({
      reservationId: reservation.id,
      action,
      actorUserId: this.actorId(user),
      actorRole: user.role,
      actorLabel: user.email,
      previousStatus: extra?.previousStatus,
      newStatus: extra?.newStatus,
      metadata: extra?.metadata,
    });
    await this.activityRepo.save(activity);
  }

  private async emitChanged(reservation: ParkingReservation, user: AuthUser, event: string) {
    await this.eventEmitter.emitAsync('parking.reservation.changed', {
      reservation,
      actorId: this.actorId(user),
      event,
    });
  }

  private async findByReferenceAndEmail(reservationReference: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.reservationRepo
      .createQueryBuilder('r')
      .where('r.reservationReference = :ref', { ref: reservationReference.trim().toUpperCase() })
      .andWhere('(LOWER(r.email) = :email OR LOWER(r.driverEmail) = :email)', { email: normalizedEmail })
      .getOne();
  }

  private officerName(user?: User | null) {
    if (!user) return null;
    const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ').trim();
    return name || user.email;
  }

  toPublicView(
    reservation: ParkingReservation,
    options?: { facility?: ParkingFacilityConfig; includeInstructions?: boolean },
  ) {
    return {
      id: reservation.id,
      reservationReference: reservation.reservationReference,
      companyName: reservation.companyName,
      mcNumber: reservation.mcNumber,
      usdotNumber: reservation.usdotNumber,
      companyPhone: reservation.companyPhone,
      email: reservation.email,
      driverEmail: reservation.driverEmail,
      driverFirstName: reservation.driverFirstName,
      driverLastName: reservation.driverLastName,
      truckSpacesRequested: reservation.truckSpacesRequested,
      contractMonths: reservation.contractMonths,
      requestedStartDate: reservation.requestedStartDate,
      contractEndDate: reservation.contractEndDate,
      status: reservation.status,
      customerNotes: reservation.customerNotes,
      agreementAccepted: reservation.agreementAccepted,
      signature: reservation.signature,
      informationRequested: reservation.informationRequested,
      informationResponse: reservation.informationResponse,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      payment: this.toPaymentView(reservation, options),
    };
  }

  private async toPublicDetailView(reservation: ParkingReservation) {
    const activities = await this.activityRepo.find({
      where: { reservationId: reservation.id },
      order: { createdAt: 'ASC' },
    });
    const facility = await this.getFacility(reservation.tenantId);
    return this.withPublicActivities(
      this.toPublicView(reservation, { facility, includeInstructions: true }),
      activities,
    );
  }

  private withPublicActivities(
    view: ReturnType<ParkingReservationsService['toPublicView']>,
    activities: ParkingReservationActivity[],
  ) {
    return {
      ...view,
      activities: activities
        .filter((a) => a.action !== ParkingReservationActivityAction.NOTE_ADDED)
        .map((a) => this.toPublicActivityView(a)),
    };
  }

  private toOfficerListView(reservation: ParkingReservation) {
    return {
      id: reservation.id,
      reservationReference: reservation.reservationReference,
      companyName: reservation.companyName,
      mcNumber: reservation.mcNumber,
      usdotNumber: reservation.usdotNumber,
      email: reservation.email,
      driverEmail: reservation.driverEmail,
      companyPhone: reservation.companyPhone,
      driverFirstName: reservation.driverFirstName,
      driverLastName: reservation.driverLastName,
      truckSpacesRequested: reservation.truckSpacesRequested,
      contractMonths: reservation.contractMonths,
      requestedStartDate: reservation.requestedStartDate,
      contractEndDate: reservation.contractEndDate,
      status: reservation.status,
      assignedToUserId: reservation.assignedToUserId,
      assignedToName: this.officerName(reservation.assignedTo),
      possibleDuplicate: reservation.possibleDuplicate,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
      payment: this.toPaymentView(reservation),
    };
  }

  private toOfficerDetailView(reservation: ParkingReservation, facility?: ParkingFacilityConfig) {
    return {
      ...this.toOfficerListView(reservation),
      customerNotes: reservation.customerNotes,
      internalNotes: reservation.internalNotes,
      agreementAccepted: reservation.agreementAccepted,
      signature: reservation.signature,
      signedAt: reservation.signedAt,
      assignedAt: reservation.assignedAt,
      reviewedByUserId: reservation.reviewedByUserId,
      reviewedByName: this.officerName(reservation.reviewedBy),
      reviewedAt: reservation.reviewedAt,
      approvedAt: reservation.approvedAt,
      rejectedAt: reservation.rejectedAt,
      rejectionReason: reservation.rejectionReason,
      cancellationReason: reservation.cancellationReason,
      cancelledAt: reservation.cancelledAt,
      informationRequested: reservation.informationRequested,
      informationResponse: reservation.informationResponse,
      informationRespondedAt: reservation.informationRespondedAt,
      duplicateOfReferences: reservation.duplicateOfReferences,
      payment: this.toPaymentView(reservation, { facility, includeInstructions: true }),
    };
  }

  private toPaymentView(
    reservation: ParkingReservation,
    options?: { facility?: ParkingFacilityConfig; includeInstructions?: boolean },
  ) {
    const snapshot = (reservation.feeSnapshot || {}) as Record<string, unknown>;
    const status = effectivePaymentStatus(reservation.paymentStatus, reservation.paymentDueAt);
    const payable = status === 'DUE' || status === 'OVERDUE' || status === 'PENDING_VERIFICATION';
    return {
      status,
      invoiceNumber: reservation.invoiceNumber || null,
      currency: reservation.currency || (snapshot.currency as string) || 'USD',
      occupancyAmount: toMoneyNumber(reservation.occupancyAmount),
      reservationFeeAmount: toMoneyNumber(reservation.reservationFeeAmount),
      subtotalAmount: toMoneyNumber(reservation.subtotalAmount),
      taxPercent: toMoneyNumber(reservation.taxPercent),
      taxAmount: toMoneyNumber(reservation.taxAmount),
      totalAmount: toMoneyNumber(reservation.totalAmountDue),
      dueAt: reservation.paymentDueAt || null,
      paidAt: reservation.paidAt || null,
      paidAmount: reservation.paidAmount != null ? toMoneyNumber(reservation.paidAmount) : null,
      paymentMethod: reservation.paymentMethod || null,
      paymentReference: reservation.paymentReference || null,
      lineItems: Array.isArray(snapshot.lineItems) ? snapshot.lineItems : [],
      feeNotes: (snapshot.feeNotes as string) || options?.facility?.feeNotes || '',
      instructions:
        options?.includeInstructions && payable
          ? options.facility?.paymentInstructions || (snapshot.paymentInstructions as string) || ''
          : '',
    };
  }

  private toActivityView(activity: ParkingReservationActivity) {
    return {
      id: activity.id,
      action: activity.action,
      actorUserId: activity.actorUserId,
      actorRole: activity.actorRole,
      actorLabel: activity.actorLabel,
      previousStatus: activity.previousStatus,
      newStatus: activity.newStatus,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
    };
  }

  private toPublicActivityView(activity: ParkingReservationActivity) {
    const { metadata, ...rest } = this.toActivityView(activity);
    const publicMeta = metadata ? { ...metadata } : undefined;
    if (publicMeta && 'note' in publicMeta) delete publicMeta.note;
    return { ...rest, metadata: publicMeta };
  }
}
