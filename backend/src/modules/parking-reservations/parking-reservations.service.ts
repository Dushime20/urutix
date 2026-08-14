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
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Tenant } from '../../entities/tenant.entity';
import {
  ParkingFacilityConfig,
  ParkingReservation,
  ParkingReservationActivity,
  ParkingReservationActivityAction,
  ParkingReservationStatus,
} from '../../entities/parking-reservation.entity';
import {
  AddParkingNoteDto,
  AssignParkingReservationDto,
  CancelParkingReservationDto,
  CreateParkingReservationDto,
  GuestInformationResponseDto,
  LookupParkingReservationDto,
  ParkingReservationFilterDto,
  RejectParkingReservationDto,
  RequestInformationDto,
  UpdateParkingFacilityDto,
} from './dto/parking-reservation.dto';
import {
  addMonths,
  canTransition,
  formatReservationReference,
  hasSufficientCapacity,
  isValidMcNumber,
  isValidPhone,
  isValidUsdotNumber,
  normalizeMcNumber,
  normalizeUsdotNumber,
  periodsOverlap,
  startOfTodayUtc,
  toDateString,
  toUtcDateOnly,
} from './parking-reservation.workflow';

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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
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
        return { created: false, reservation: this.toPublicView(existing), possibleDuplicate: existing.possibleDuplicate };
      }
    }

    const tenantId = await this.resolveTenantId(user);
    const facility = await this.getFacility(tenantId);
    const start = this.validateBusinessFields(dto, facility.allowPastStartDates);
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
      });
      const saved = await manager.save(ParkingReservation, entity);
      await manager.save(
        ParkingReservationActivity,
        manager.create(ParkingReservationActivity, {
          reservationId: saved.id,
          action: ParkingReservationActivityAction.RESERVATION_CREATED,
          actorUserId: this.actorId(user),
          actorRole: user?.role || 'GUEST',
          actorLabel: user?.email || dto.email,
          newStatus: ParkingReservationStatus.PENDING_REVIEW,
          metadata: {
            companyName: saved.companyName,
            truckSpacesRequested: saved.truckSpacesRequested,
            possibleDuplicate: saved.possibleDuplicate,
          },
        }),
      );
      return saved;
    });

    this.eventEmitter.emit('parking.reservation.created', {
      reservation,
      actorId: this.actorId(user),
    });

    return {
      created: true,
      reservation: this.toPublicView(reservation),
      possibleDuplicate: reservation.possibleDuplicate,
    };
  }

  async lookup(dto: LookupParkingReservationDto) {
    const reservation = await this.reservationRepo.findOne({
      where: {
        reservationReference: dto.reservationReference.trim().toUpperCase(),
        email: dto.email.trim().toLowerCase(),
      },
    });
    if (!reservation) {
      throw new NotFoundException('No reservation was found for that reference and email.');
    }
    return this.toPublicView(reservation);
  }

  async guestRespond(dto: GuestInformationResponseDto) {
    const reservation = await this.reservationRepo.findOne({
      where: {
        reservationReference: dto.reservationReference.trim().toUpperCase(),
        email: dto.email.trim().toLowerCase(),
      },
    });
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
    const mapper = this.isStaff(user.role) ? this.toOfficerListView : this.toPublicView;
    return {
      items: items.map((item) => mapper.call(this, item)),
      total,
      page,
      limit,
    };
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

    if (this.isStaff(user.role)) {
      return {
        ...this.toOfficerDetailView(reservation),
        activities: activities.map((a) => this.toActivityView(a)),
        possibleDuplicates: duplicates.map((d) => ({
          id: d.id,
          reservationReference: d.reservationReference,
          status: d.status,
          createdAt: d.createdAt,
        })),
        capacity,
      };
    }

    return {
      ...this.toPublicView(reservation),
      activities: activities
        .filter((a) => a.action !== ParkingReservationActivityAction.NOTE_ADDED)
        .map((a) => this.toPublicActivityView(a)),
    };
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
    this.emitChanged(reservation, user, 'review_started');
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
    this.eventEmitter.emit('parking.reservation.assigned', {
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
    this.eventEmitter.emit('parking.reservation.approved', {
      reservation,
      actorId: this.actorId(user),
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
    this.eventEmitter.emit('parking.reservation.rejected', {
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
    this.eventEmitter.emit('parking.reservation.information_requested', {
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

  async cancel(id: string, dto: CancelParkingReservationDto, user: AuthUser) {
    const reservation = await this.loadManaged(id, user);
    this.assertTransition(reservation, ParkingReservationStatus.CANCELLED);
    const previous = reservation.status;
    reservation.status = ParkingReservationStatus.CANCELLED;
    reservation.cancellationReason = dto.reason;
    reservation.cancelledByUserId = this.actorId(user);
    reservation.cancelledAt = new Date();
    await this.reservationRepo.save(reservation);
    await this.addActivity(reservation, ParkingReservationActivityAction.RESERVATION_CANCELLED, user, {
      previousStatus: previous,
      newStatus: ParkingReservationStatus.CANCELLED,
      metadata: { reason: dto.reason },
    });
    this.eventEmitter.emit('parking.reservation.cancelled', {
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
      .where('u.role IN (:...roles)', {
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
      'Contact',
      'Spaces',
      'Duration',
      'Requested Date',
      'Submitted',
      'Status',
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
          row.truckSpacesRequested,
          row.contractMonths,
          row.requestedStartDate,
          row.createdAt,
          row.status,
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
    this.emitChanged(reservation, user, 'review_started');
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
    this.eventEmitter.emit('parking.reservation.information_received', {
      reservation,
      actorId: this.actorId(user),
    });
    return this.toPublicView(reservation);
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
    if (user.email && reservation.email === user.email.toLowerCase()) return;
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

  private emitChanged(reservation: ParkingReservation, user: AuthUser, event: string) {
    this.eventEmitter.emit('parking.reservation.changed', {
      reservation,
      actorId: this.actorId(user),
      event,
    });
  }

  private officerName(user?: User | null) {
    if (!user) return null;
    const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(' ').trim();
    return name || user.email;
  }

  toPublicView(reservation: ParkingReservation) {
    return {
      id: reservation.id,
      reservationReference: reservation.reservationReference,
      companyName: reservation.companyName,
      mcNumber: reservation.mcNumber,
      usdotNumber: reservation.usdotNumber,
      companyPhone: reservation.companyPhone,
      email: reservation.email,
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
    };
  }

  private toOfficerDetailView(reservation: ParkingReservation) {
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
