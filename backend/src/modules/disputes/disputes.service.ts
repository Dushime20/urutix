import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DisputeV2,
  DisputeMessage,
  DisputeAttachment,
  DisputeResolutionRecord,
  DisputeAuditLog,
  DisputeAssignment,
  DisputeEscalation,
  DisputeStatusV2,
  DisputeDecision,
  DisputePriority,
  DisputeCategory,
  EscalationReason,
  SupportAssigneeRole,
} from '../../entities/dispute-v2.entity';
import { User, UserRole } from '../../entities/user.entity';
import {
  CreateDisputeDto,
  UpdateDisputeDto,
  AddCommentDto,
  ResolveDisputeDto,
  ChangeStatusDto,
  DisputeFilterDto,
  AssignDisputeDto,
  EscalateDisputeDto,
} from './dto/dispute.dto';

// ─── SLA definitions (minutes) ───────────────────────────────────────────────
const SLA_CONFIG: Record<DisputePriority, { firstResponse: number; resolution: number }> = {
  [DisputePriority.CRITICAL]: { firstResponse: 15,    resolution: 1440 },   // 15min / 24h
  [DisputePriority.HIGH]:     { firstResponse: 60,    resolution: 2880 },   // 1h / 48h
  [DisputePriority.MEDIUM]:   { firstResponse: 240,   resolution: 7200 },   // 4h / 5 days
  [DisputePriority.LOW]:      { firstResponse: 1440,  resolution: 20160 },  // 24h / 14 days
};

// ─── Auto-priority rules ──────────────────────────────────────────────────────
const CRITICAL_CATEGORIES: DisputeCategory[] = [
  DisputeCategory.FRAUD_SUSPECTED,
  DisputeCategory.SECURITY_CONCERN,
  DisputeCategory.CARGO_LOSS,
  DisputeCategory.PAYMENT_ISSUE,
  DisputeCategory.BILLING_ISSUE,
];

function computeDefaultPriority(category: DisputeCategory): DisputePriority {
  if (CRITICAL_CATEGORIES.includes(category)) return DisputePriority.CRITICAL;
  if ([DisputeCategory.CARGO_DAMAGE, DisputeCategory.TRUCK_BREAKDOWN, DisputeCategory.INSURANCE_CLAIM, DisputeCategory.ACCOUNT_SUSPENSION].includes(category)) return DisputePriority.HIGH;
  if ([DisputeCategory.DELIVERY_DELAY, DisputeCategory.DRIVER_MISCONDUCT, DisputeCategory.BROKER_COMPLAINT, DisputeCategory.LENDER_COMPLAINT, DisputeCategory.CONTRACT_VIOLATION].includes(category)) return DisputePriority.MEDIUM;
  return DisputePriority.LOW;
}

// ─── Permission helpers ───────────────────────────────────────────────────────
const ELEVATED_VIEW_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN];
const RESOLVER_ROLES      = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN];

function canCreateDispute(role: UserRole): boolean {
  return [
    UserRole.CARGO_OWNER, UserRole.TRUCK_OWNER, UserRole.BROKER,
    UserRole.LENDER, UserRole.DRIVER, UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER, UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN,
  ].includes(role);
}
function canResolve(role: UserRole): boolean {
  return RESOLVER_ROLES.includes(role);
}
function hasElevatedView(role: UserRole): boolean {
  return ELEVATED_VIEW_ROLES.includes(role);
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(DisputeV2)
    private disputeRepo: Repository<DisputeV2>,
    @InjectRepository(DisputeMessage)
    private messageRepo: Repository<DisputeMessage>,
    @InjectRepository(DisputeAttachment)
    private attachmentRepo: Repository<DisputeAttachment>,
    @InjectRepository(DisputeResolutionRecord)
    private resolutionRepo: Repository<DisputeResolutionRecord>,
    @InjectRepository(DisputeAuditLog)
    private auditRepo: Repository<DisputeAuditLog>,
    @InjectRepository(DisputeAssignment)
    private assignmentRepo: Repository<DisputeAssignment>,
    @InjectRepository(DisputeEscalation)
    private escalationRepo: Repository<DisputeEscalation>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─── Ticket number ─────────────────────────────────────────────────────────
  private generateRef(): string {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `DIS-${yy}${mm}-${rand}`;
  }

  private async generateTicketNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.disputeRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(6, '0');
    return `SUP-${year}-${seq}`;
  }

  // ─── SLA calculation ───────────────────────────────────────────────────────
  private computeSLA(priority: DisputePriority): { firstResponseDue: Date; resolutionDue: Date } {
    const cfg = SLA_CONFIG[priority];
    const now = Date.now();
    return {
      firstResponseDue: new Date(now + cfg.firstResponse * 60_000),
      resolutionDue: new Date(now + cfg.resolution * 60_000),
    };
  }

  // ─── Audit helper ──────────────────────────────────────────────────────────
  private async addAudit(
    disputeId: string,
    action: string,
    performedBy: string,
    oldValue?: any,
    newValue?: any,
    notes?: string,
    ipAddress?: string,
  ) {
    await this.auditRepo.save(
      this.auditRepo.create({ disputeId, action, performedBy, oldValue, newValue, notes, ipAddress }),
    );
  }

  // ─── Create ────────────────────────────────────────────────────────────────
  async create(dto: CreateDisputeDto, user: User): Promise<DisputeV2> {
    if (!canCreateDispute(user.role)) {
      throw new ForbiddenException('You do not have permission to create support tickets.');
    }

    const priority = dto.priority ?? computeDefaultPriority(dto.category);
    const sla = this.computeSLA(priority);
    const ticketNumber = await this.generateTicketNumber(user.tenantId);

    const dispute = this.disputeRepo.create({
      tenantId: user.tenantId,
      referenceNumber: this.generateRef(),
      ticketNumber,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority,
      status: DisputeStatusV2.OPEN,
      complainantUserId: user.id,
      respondentUserId: dto.respondentUserId,
      tripId: dto.tripId,
      shipmentId: dto.shipmentId,
      truckId: dto.truckId,
      contractId: dto.contractId,
      invoiceId: dto.invoiceId,
      auctionId: dto.auctionId,
      paymentId: dto.paymentId,
      driverId: dto.driverId,
      brokerId: dto.brokerId,
      lenderId: dto.lenderId,
      location: dto.location,
      incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : undefined,
      additionalNotes: dto.additionalNotes,
      slaFirstResponseDue: sla.firstResponseDue,
      slaResolutionDue: sla.resolutionDue,
      slaFirstResponseBreached: false,
      slaResolutionBreached: false,
      reopenCount: 0,
      escalationLevel: 0,
    });

    const saved = await this.disputeRepo.save(dispute);
    await this.addAudit(saved.id, 'TICKET_CREATED', user.id, null, {
      status: DisputeStatusV2.OPEN,
      ticketNumber,
      priority,
    });

    this.eventEmitter.emit('dispute.created', { dispute: saved, createdBy: user });
    return this.findOne(saved.id, user);
  }

  // ─── Find All ──────────────────────────────────────────────────────────────
  async findAll(
    filter: DisputeFilterDto,
    user: User,
  ): Promise<{ disputes: DisputeV2[]; total: number; page: number; limit: number }> {
    const page  = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, filter.limit ?? 20);
    const skip  = (page - 1) * limit;

    const qb = this.disputeRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.complainant', 'complainant')
      .leftJoinAndSelect('complainant.profile', 'complainantProfile')
      .leftJoinAndSelect('d.respondent', 'respondent')
      .leftJoinAndSelect('respondent.profile', 'respondentProfile')
      .leftJoinAndSelect('d.assignedTo', 'assignedTo')
      .leftJoinAndSelect('assignedTo.profile', 'assignedToProfile')
      .leftJoinAndSelect('d.trip', 'trip')
      .where('d.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('d.deleted_at IS NULL');

    if (!hasElevatedView(user.role)) {
      qb.andWhere(
        '(d.complainantUserId = :uid OR d.respondentUserId = :uid)',
        { uid: user.id },
      );
    }

    if (filter.status)           qb.andWhere('d.status = :status', { status: filter.status });
    if (filter.category)         qb.andWhere('d.category = :category', { category: filter.category });
    if (filter.priority)         qb.andWhere('d.priority = :priority', { priority: filter.priority });
    if (filter.assignedToUserId) qb.andWhere('d.assignedToUserId = :auid', { auid: filter.assignedToUserId });
    if (filter.fromDate)         qb.andWhere('d.createdAt >= :from', { from: new Date(filter.fromDate) });
    if (filter.toDate)           qb.andWhere('d.createdAt <= :to', { to: new Date(filter.toDate) });
    if (filter.slaBreached)      qb.andWhere('(d.slaFirstResponseBreached = true OR d.slaResolutionBreached = true)');

    if (filter.search) {
      qb.andWhere(
        '(d.title ILIKE :q OR d.ticketNumber ILIKE :q OR d.referenceNumber ILIKE :q OR d.description ILIKE :q)',
        { q: `%${filter.search}%` },
      );
    }

    qb.orderBy('d.createdAt', 'DESC').skip(skip).take(limit);
    const [disputes, total] = await qb.getManyAndCount();
    return { disputes, total, page, limit };
  }

  // ─── Find One ──────────────────────────────────────────────────────────────
  async findOne(id: string, user: User): Promise<DisputeV2> {
    const dispute = await this.disputeRepo.findOne({
      where: { id, tenantId: user.tenantId },
      relations: [
        'complainant', 'complainant.profile',
        'respondent', 'respondent.profile',
        'assignedTo', 'assignedTo.profile',
        'trip',
      ],
    });
    if (!dispute) throw new NotFoundException('Support ticket not found.');
    if (!hasElevatedView(user.role)) {
      if (dispute.complainantUserId !== user.id && dispute.respondentUserId !== user.id) {
        throw new ForbiddenException('You do not have access to this ticket.');
      }
    }
    return dispute;
  }

  // ─── Update ────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateDisputeDto, user: User): Promise<DisputeV2> {
    const dispute = await this.findOne(id, user);
    if (!hasElevatedView(user.role) && dispute.complainantUserId !== user.id) {
      throw new ForbiddenException('Only the reporter or an admin can edit this ticket.');
    }
    if ([DisputeStatusV2.CLOSED, DisputeStatusV2.RESOLVED].includes(dispute.status)) {
      throw new BadRequestException('Cannot edit a closed or resolved ticket.');
    }
    const old = { title: dispute.title, description: dispute.description, category: dispute.category, priority: dispute.priority };
    Object.assign(dispute, dto);

    // Recalculate SLA if priority changed
    if (dto.priority && dto.priority !== old.priority) {
      const sla = this.computeSLA(dto.priority);
      dispute.slaFirstResponseDue = sla.firstResponseDue;
      dispute.slaResolutionDue    = sla.resolutionDue;
    }

    await this.disputeRepo.save(dispute);
    await this.addAudit(id, 'UPDATED', user.id, old, dto);
    this.eventEmitter.emit('dispute.updated', { dispute, updatedBy: user });
    return this.findOne(id, user);
  }

  // ─── Delete (soft) ─────────────────────────────────────────────────────────
  async remove(id: string, user: User): Promise<void> {
    await this.findOne(id, user);
    if (!hasElevatedView(user.role)) throw new ForbiddenException('Only admins can delete tickets.');
    await this.addAudit(id, 'DELETED', user.id);
    await this.disputeRepo.softDelete(id);
  }

  // ─── Assign ────────────────────────────────────────────────────────────────
  async assign(id: string, dto: AssignDisputeDto, user: User): Promise<DisputeV2> {
    if (!canResolve(user.role)) throw new ForbiddenException('Only admins can assign tickets.');
    const dispute = await this.findOne(id, user);

    // Verify assignee exists within same tenant
    const assignee = await this.userRepo.findOne({ where: { id: dto.assignedToUserId, tenantId: user.tenantId } });
    if (!assignee) throw new NotFoundException('Assignee not found in this tenant.');

    const old = { assignedToUserId: dispute.assignedToUserId, status: dispute.status };
    dispute.assignedToUserId = dto.assignedToUserId;
    dispute.assignedRole     = dto.assignedRole;
    dispute.assignedAt       = new Date();
    if (dispute.status === DisputeStatusV2.OPEN) {
      dispute.status = DisputeStatusV2.ASSIGNED;
    }
    await this.disputeRepo.save(dispute);

    await this.assignmentRepo.save(
      this.assignmentRepo.create({
        disputeId: id,
        assignedByUserId: user.id,
        assignedToUserId: dto.assignedToUserId,
        assignedRole: dto.assignedRole,
        notes: dto.notes,
      }),
    );
    await this.addAudit(id, 'ASSIGNED', user.id, old, {
      assignedToUserId: dto.assignedToUserId,
      assignedRole: dto.assignedRole,
    }, dto.notes);

    this.eventEmitter.emit('dispute.assigned', { dispute, assignedTo: assignee, assignedBy: user });
    return this.findOne(id, user);
  }

  // ─── Escalate ──────────────────────────────────────────────────────────────
  async escalate(id: string, dto: EscalateDisputeDto, user: User): Promise<DisputeV2> {
    if (!canResolve(user.role)) throw new ForbiddenException('Only admins can escalate tickets.');
    const dispute = await this.findOne(id, user);
    if (dispute.status === DisputeStatusV2.CLOSED) {
      throw new BadRequestException('Cannot escalate a closed ticket.');
    }

    const old = { status: dispute.status, escalationLevel: dispute.escalationLevel };
    dispute.status          = DisputeStatusV2.ESCALATED;
    dispute.escalationLevel = (dispute.escalationLevel || 0) + 1;
    dispute.escalationReason  = dto.reason;
    dispute.escalatedAt       = new Date();
    dispute.escalatedByUserId = user.id;
    await this.disputeRepo.save(dispute);

    await this.escalationRepo.save(
      this.escalationRepo.create({
        disputeId: id,
        escalatedByUserId: user.id,
        reason: dto.reason,
        notes: dto.notes,
        escalationLevel: dispute.escalationLevel,
      }),
    );
    await this.addAudit(id, 'ESCALATED', user.id, old, {
      status: DisputeStatusV2.ESCALATED,
      reason: dto.reason,
      level: dispute.escalationLevel,
    }, dto.notes);

    this.eventEmitter.emit('dispute.escalated', { dispute, escalatedBy: user, reason: dto.reason });
    return this.findOne(id, user);
  }

  // ─── Comments ──────────────────────────────────────────────────────────────
  async addComment(id: string, dto: AddCommentDto, user: User): Promise<DisputeMessage> {
    const dispute = await this.findOne(id, user);
    if (dispute.status === DisputeStatusV2.CLOSED) {
      throw new BadRequestException('Cannot comment on a closed ticket.');
    }
    if (dto.isInternal && !hasElevatedView(user.role)) {
      throw new ForbiddenException('Only admins can post internal notes.');
    }

    const msg = await this.messageRepo.save(
      this.messageRepo.create({
        disputeId: id,
        senderId: user.id,
        message: dto.message,
        isInternal: dto.isInternal ?? false,
      }),
    );

    // Track first admin response for SLA
    if (hasElevatedView(user.role) && !dispute.firstResponseAt) {
      dispute.firstResponseAt = new Date();
      await this.disputeRepo.save(dispute);
    }

    // Auto-progress OPEN → UNDER_REVIEW when elevated user first comments
    if (dispute.status === DisputeStatusV2.OPEN && hasElevatedView(user.role)) {
      await this.changeStatus(id, { status: DisputeStatusV2.UNDER_REVIEW }, user);
    }

    this.eventEmitter.emit('dispute.message_added', { disputeId: id, message: msg, sender: user });
    return msg;
  }

  async getComments(id: string, user: User): Promise<DisputeMessage[]> {
    await this.findOne(id, user);
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('sender.profile', 'profile')
      .where('m.disputeId = :id', { id })
      .orderBy('m.createdAt', 'ASC');
    if (!hasElevatedView(user.role)) {
      qb.andWhere('m.isInternal = false');
    }
    return qb.getMany();
  }

  // ─── Attachments ───────────────────────────────────────────────────────────
  async addAttachment(
    id: string,
    fileInfo: { fileName: string; fileUrl: string; fileType?: string; fileSize?: number },
    user: User,
  ): Promise<DisputeAttachment> {
    const dispute = await this.findOne(id, user);
    if (dispute.status === DisputeStatusV2.CLOSED) {
      throw new BadRequestException('Cannot add attachments to a closed ticket.');
    }
    const attachment = await this.attachmentRepo.save(
      this.attachmentRepo.create({ disputeId: id, uploadedBy: user.id, ...fileInfo }),
    );
    await this.addAudit(id, 'ATTACHMENT_ADDED', user.id, null, { fileName: fileInfo.fileName });
    this.eventEmitter.emit('dispute.evidence_uploaded', { disputeId: id, attachment, uploader: user });
    return attachment;
  }

  async getAttachments(id: string, user: User): Promise<DisputeAttachment[]> {
    await this.findOne(id, user);
    return this.attachmentRepo.find({
      where: { disputeId: id },
      relations: ['uploader', 'uploader.profile'],
      order: { createdAt: 'ASC' },
    });
  }

  // ─── Resolve ───────────────────────────────────────────────────────────────
  async resolve(id: string, dto: ResolveDisputeDto, user: User): Promise<DisputeV2> {
    if (!canResolve(user.role)) throw new ForbiddenException('Only Tenant Admins can resolve tickets.');
    const dispute = await this.findOne(id, user);
    if ([DisputeStatusV2.CLOSED, DisputeStatusV2.RESOLVED].includes(dispute.status)) {
      throw new BadRequestException('Ticket is already resolved or closed.');
    }
    const oldStatus = dispute.status;
    dispute.status     = DisputeStatusV2.RESOLVED;
    dispute.resolvedAt = new Date();
    await this.disputeRepo.save(dispute);
    await this.resolutionRepo.save(
      this.resolutionRepo.create({
        disputeId: id,
        resolvedBy: user.id,
        decision: dto.decision,
        resolutionSummary: dto.resolutionSummary,
        adminNotes: dto.adminNotes,
        resolvedAt: new Date(),
      }),
    );
    await this.addAudit(id, 'RESOLVED', user.id, { status: oldStatus }, { status: DisputeStatusV2.RESOLVED, decision: dto.decision });
    this.eventEmitter.emit('dispute.resolved', { dispute, resolver: user, decision: dto.decision });
    return this.findOne(id, user);
  }

  // ─── Close ─────────────────────────────────────────────────────────────────
  async close(id: string, user: User): Promise<DisputeV2> {
    if (!canResolve(user.role)) throw new ForbiddenException('Only Tenant Admins can close tickets.');
    const dispute = await this.findOne(id, user);
    if (dispute.status === DisputeStatusV2.CLOSED) throw new BadRequestException('Ticket is already closed.');
    const oldStatus = dispute.status;
    dispute.status   = DisputeStatusV2.CLOSED;
    dispute.closedAt = new Date();
    await this.disputeRepo.save(dispute);
    await this.addAudit(id, 'CLOSED', user.id, { status: oldStatus }, { status: DisputeStatusV2.CLOSED });
    this.eventEmitter.emit('dispute.closed', { dispute, closedBy: user });
    return this.findOne(id, user);
  }

  // ─── Reopen ────────────────────────────────────────────────────────────────
  async reopen(id: string, reason: string, user: User): Promise<DisputeV2> {
    if (!canResolve(user.role)) throw new ForbiddenException('Only Tenant Admins can reopen tickets.');
    const dispute = await this.findOne(id, user);
    if (![DisputeStatusV2.CLOSED, DisputeStatusV2.RESOLVED, DisputeStatusV2.REJECTED].includes(dispute.status)) {
      throw new BadRequestException('Only closed, resolved, or rejected tickets can be reopened.');
    }
    const oldStatus = dispute.status;
    dispute.status     = DisputeStatusV2.REOPENED;
    dispute.closedAt   = null;
    dispute.resolvedAt = null;
    dispute.reopenCount = (dispute.reopenCount || 0) + 1;

    // Auto-escalate if reopened too many times
    if (dispute.reopenCount >= 3) {
      dispute.escalationLevel = (dispute.escalationLevel || 0) + 1;
      dispute.escalationReason  = EscalationReason.MULTIPLE_REOPENS;
      dispute.escalatedAt       = new Date();
      dispute.escalatedByUserId = user.id;
    }

    await this.disputeRepo.save(dispute);
    await this.addAudit(id, 'REOPENED', user.id, { status: oldStatus }, { status: DisputeStatusV2.REOPENED, reopenCount: dispute.reopenCount }, reason);
    this.eventEmitter.emit('dispute.reopened', { dispute, reopenedBy: user, reason });
    return this.findOne(id, user);
  }

  // ─── Change Status ─────────────────────────────────────────────────────────
  async changeStatus(id: string, dto: ChangeStatusDto, user: User): Promise<DisputeV2> {
    if (!canResolve(user.role)) throw new ForbiddenException('Only admins can change ticket status.');
    const dispute = await this.findOne(id, user);
    const oldStatus = dispute.status;
    dispute.status = dto.status;
    if (dto.status === DisputeStatusV2.CLOSED)   dispute.closedAt   = new Date();
    if (dto.status === DisputeStatusV2.RESOLVED) dispute.resolvedAt = new Date();
    await this.disputeRepo.save(dispute);
    await this.addAudit(id, 'STATUS_CHANGED', user.id, { status: oldStatus }, { status: dto.status }, dto.reason);
    this.eventEmitter.emit('dispute.status_changed', { dispute, oldStatus, newStatus: dto.status, changedBy: user });
    return this.findOne(id, user);
  }

  // ─── Timeline ──────────────────────────────────────────────────────────────
  async getTimeline(id: string, user: User): Promise<any[]> {
    await this.findOne(id, user);
    const [auditLogs, messages] = await Promise.all([
      this.auditRepo.find({
        where: { disputeId: id },
        relations: ['actor', 'actor.profile'],
        order: { createdAt: 'ASC' },
      }),
      this.messageRepo.find({
        where: { disputeId: id, ...(hasElevatedView(user.role) ? {} : { isInternal: false }) },
        relations: ['sender', 'sender.profile'],
        order: { createdAt: 'ASC' },
      }),
    ]);
    return [
      ...auditLogs.map(a => ({ type: 'audit',   data: a, timestamp: a.createdAt })),
      ...messages.map(m  => ({ type: 'message', data: m, timestamp: m.createdAt })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // ─── Resolutions ───────────────────────────────────────────────────────────
  async getResolutions(id: string, user: User): Promise<DisputeResolutionRecord[]> {
    await this.findOne(id, user);
    return this.resolutionRepo.find({
      where: { disputeId: id },
      relations: ['resolver', 'resolver.profile'],
      order: { resolvedAt: 'DESC' },
    });
  }

  // ─── Assignment history ────────────────────────────────────────────────────
  async getAssignments(id: string, user: User): Promise<DisputeAssignment[]> {
    await this.findOne(id, user);
    return this.assignmentRepo.find({
      where: { disputeId: id },
      relations: ['assignedBy', 'assignedBy.profile', 'assignedTo', 'assignedTo.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Escalation history ────────────────────────────────────────────────────
  async getEscalations(id: string, user: User): Promise<DisputeEscalation[]> {
    await this.findOne(id, user);
    return this.escalationRepo.find({
      where: { disputeId: id },
      relations: ['escalatedBy', 'escalatedBy.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Check SLA breaches ────────────────────────────────────────────────────
  async checkSlaBreaches(tenantId: string): Promise<number> {
    const now = new Date();
    let updated = 0;

    // First response SLA
    const frBreached = await this.disputeRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.slaFirstResponseBreached = false')
      .andWhere('d.firstResponseAt IS NULL')
      .andWhere('d.slaFirstResponseDue < :now', { now })
      .andWhere('d.status NOT IN (:...done)', { done: [DisputeStatusV2.CLOSED, DisputeStatusV2.RESOLVED] })
      .getMany();

    for (const d of frBreached) {
      d.slaFirstResponseBreached = true;
      await this.disputeRepo.save(d);
      this.eventEmitter.emit('dispute.sla_breached', { disputeId: d.id, tenantId, type: 'first_response', ticket: d.ticketNumber });
      updated++;
    }

    // Resolution SLA
    const resBreached = await this.disputeRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.slaResolutionBreached = false')
      .andWhere('d.slaResolutionDue < :now', { now })
      .andWhere('d.status NOT IN (:...done)', { done: [DisputeStatusV2.CLOSED, DisputeStatusV2.RESOLVED] })
      .getMany();

    for (const d of resBreached) {
      d.slaResolutionBreached = true;
      await this.disputeRepo.save(d);
      // Auto-escalate critical/high SLA breaches
      if ([DisputePriority.CRITICAL, DisputePriority.HIGH].includes(d.priority) && d.escalationLevel === 0) {
        d.escalationLevel   = 1;
        d.escalationReason  = EscalationReason.SLA_BREACH;
        d.escalatedAt       = new Date();
        d.status            = DisputeStatusV2.ESCALATED;
        await this.disputeRepo.save(d);
      }
      this.eventEmitter.emit('dispute.sla_breached', { disputeId: d.id, tenantId, type: 'resolution', ticket: d.ticketNumber });
      updated++;
    }

    return updated;
  }

  // ─── Analytics ─────────────────────────────────────────────────────────────
  async getAnalytics(tenantId: string, period?: string): Promise<any> {
    const qb = this.disputeRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.deleted_at IS NULL');

    if (period) {
      const now = new Date();
      let fromDate: Date;
      switch (period) {
        case 'day':   fromDate = new Date(now.getTime() - 86400000); break;
        case 'week':  fromDate = new Date(now.getTime() - 7 * 86400000); break;
        case 'month': fromDate = new Date(now.getTime() - 30 * 86400000); break;
        case 'year':  fromDate = new Date(now.getTime() - 365 * 86400000); break;
        default:      fromDate = new Date(now.getTime() - 30 * 86400000);
      }
      qb.andWhere('d.createdAt >= :from', { from: fromDate });
    }

    const all = await qb.getMany();
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    // Monthly trend (last 6 months)
    const monthlyTrend: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[key] = 0;
    }

    for (const d of all) {
      byStatus[d.status]     = (byStatus[d.status]     || 0) + 1;
      byCategory[d.category] = (byCategory[d.category] || 0) + 1;
      byPriority[d.priority] = (byPriority[d.priority] || 0) + 1;
      const monthKey = `${new Date(d.createdAt).getFullYear()}-${String(new Date(d.createdAt).getMonth() + 1).padStart(2, '0')}`;
      if (monthKey in monthlyTrend) monthlyTrend[monthKey]++;
    }

    const resolved = all.filter(d => d.resolvedAt && d.createdAt);
    const avgResMs = resolved.length > 0
      ? resolved.reduce((s, d) => s + (new Date(d.resolvedAt).getTime() - new Date(d.createdAt).getTime()), 0) / resolved.length
      : 0;

    const withFirstResponse = all.filter(d => d.firstResponseAt && d.createdAt);
    const avgFirstResponseMs = withFirstResponse.length > 0
      ? withFirstResponse.reduce((s, d) => s + (new Date(d.firstResponseAt).getTime() - new Date(d.createdAt).getTime()), 0) / withFirstResponse.length
      : 0;

    const slaBreached = all.filter(d => d.slaFirstResponseBreached || d.slaResolutionBreached).length;
    const slaCompliant = all.length > 0 ? ((all.length - slaBreached) / all.length) * 100 : 100;

    return {
      total:             all.length,
      open:              (byStatus[DisputeStatusV2.OPEN] || 0) + (byStatus[DisputeStatusV2.REOPENED] || 0),
      underReview:       byStatus[DisputeStatusV2.UNDER_REVIEW] || 0,
      assigned:          byStatus[DisputeStatusV2.ASSIGNED] || 0,
      investigating:     byStatus[DisputeStatusV2.INVESTIGATING] || 0,
      waitingForUser:    byStatus[DisputeStatusV2.AWAITING_INFORMATION] || 0,
      escalated:         byStatus[DisputeStatusV2.ESCALATED] || 0,
      resolved:          byStatus[DisputeStatusV2.RESOLVED] || 0,
      closed:            byStatus[DisputeStatusV2.CLOSED] || 0,
      rejected:          byStatus[DisputeStatusV2.REJECTED] || 0,
      reopened:          byStatus[DisputeStatusV2.REOPENED] || 0,
      avgResolutionTimeHours: Math.round(avgResMs / 3600000),
      avgFirstResponseTimeMinutes: Math.round(avgFirstResponseMs / 60000),
      slaCompliancePercent: Math.round(slaCompliant),
      slaBreached,
      byStatus,
      byCategory,
      byPriority,
      monthlyTrend,
    };
  }
}
