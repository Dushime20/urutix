import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  ILike,
  In,
} from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DisputeV2,
  DisputeMessage,
  DisputeAttachment,
  DisputeResolutionRecord,
  DisputeAuditLog,
  DisputeStatusV2,
  DisputeDecision,
  DisputePriority,
} from '../../entities/dispute-v2.entity';
import { User, UserRole } from '../../entities/user.entity';
import {
  CreateDisputeDto,
  UpdateDisputeDto,
  AddCommentDto,
  ResolveDisputeDto,
  ChangeStatusDto,
  DisputeFilterDto,
} from './dto/dispute.dto';

// ─── Permission helpers ───────────────────────────────────────────────────────
//
// Access matrix:
//   SUPER_ADMIN  → platform-wide: view ALL disputes, resolve/close/reopen any
//   TENANT_ADMIN → tenant-scope:  view all within tenant, resolve/close/reopen
//   ADMIN        → tenant-scope:  view all within tenant, READ-ONLY (no resolve)
//   others       → party-scope:   view/comment only on disputes they are party to

const ELEVATED_VIEW_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN];
const RESOLVER_ROLES      = [UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN];

function canCreateDispute(role: UserRole): boolean {
  return [
    UserRole.CARGO_OWNER, UserRole.TRUCK_OWNER, UserRole.BROKER,
    UserRole.LENDER, UserRole.DRIVER, UserRole.FLEET_MANAGER,
    UserRole.FLEET_DISPATCHER, UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN,
  ].includes(role);
}

/** Only SUPER_ADMIN and TENANT_ADMIN may resolve / close / reopen. */
function canResolve(role: UserRole): boolean {
  return RESOLVER_ROLES.includes(role);
}

/** SUPER_ADMIN, TENANT_ADMIN, and ADMIN get the full tenant-wide list view. */
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

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private dataSource: DataSource,
    private eventEmitter: EventEmitter2,
  ) {}

  // ─── Generate Reference Number ──────────────────────────────────────────────

  private generateRef(): string {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `DIS-${yy}${mm}-${rand}`;
  }

  // ─── Audit helper ───────────────────────────────────────────────────────────

  private async addAudit(
    disputeId: string,
    action: string,
    performedBy: string,
    oldValue?: any,
    newValue?: any,
    notes?: string,
  ) {
    await this.auditRepo.save(
      this.auditRepo.create({ disputeId, action, performedBy, oldValue, newValue, notes }),
    );
  }

  // ─── Create ─────────────────────────────────────────────────────────────────

  async create(dto: CreateDisputeDto, user: User): Promise<DisputeV2> {
    if (!canCreateDispute(user.role)) {
      throw new ForbiddenException('You do not have permission to create disputes.');
    }

    const dispute = this.disputeRepo.create({
      tenantId: user.tenantId,
      referenceNumber: this.generateRef(),
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority ?? DisputePriority.MEDIUM,
      status: DisputeStatusV2.OPEN,
      complainantUserId: user.id,
      respondentUserId: dto.respondentUserId,
      tripId: dto.tripId,
      shipmentId: dto.shipmentId,
      truckId: dto.truckId,
      contractId: dto.contractId,
      invoiceId: dto.invoiceId,
    });

    const saved = await this.disputeRepo.save(dispute);

    await this.addAudit(saved.id, 'CREATED', user.id, null, { status: DisputeStatusV2.OPEN });

    // Emit for notifications
    this.eventEmitter.emit('dispute.created', {
      dispute: saved,
      createdBy: user,
    });

    return this.findOne(saved.id, user);
  }

  // ─── Find All (with filters) ─────────────────────────────────────────────────

  async findAll(
    filter: DisputeFilterDto,
    user: User,
  ): Promise<{ disputes: DisputeV2[]; total: number; page: number; limit: number }> {
    const page  = Math.max(1, filter.page  ?? 1);
    const limit = Math.min(100, filter.limit ?? 20);
    const skip  = (page - 1) * limit;

    const qb = this.disputeRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.complainant', 'complainant')
      .leftJoinAndSelect('complainant.profile', 'complainantProfile')
      .leftJoinAndSelect('d.respondent', 'respondent')
      .leftJoinAndSelect('respondent.profile', 'respondentProfile')
      .leftJoinAndSelect('d.trip', 'trip')
      .where('d.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('d.deleted_at IS NULL');

    // Non-elevated users see only their own disputes
    if (!hasElevatedView(user.role)) {
      qb.andWhere(
        '(d.complainantUserId = :uid OR d.respondentUserId = :uid)',
        { uid: user.id },
      );
    }

    if (filter.status)   qb.andWhere('d.status = :status', { status: filter.status });
    if (filter.category) qb.andWhere('d.category = :category', { category: filter.category });
    if (filter.priority) qb.andWhere('d.priority = :priority', { priority: filter.priority });
    if (filter.fromDate) qb.andWhere('d.createdAt >= :from', { from: new Date(filter.fromDate) });
    if (filter.toDate)   qb.andWhere('d.createdAt <= :to', { to: new Date(filter.toDate) });

    if (filter.search) {
      qb.andWhere(
        '(d.title ILIKE :q OR d.referenceNumber ILIKE :q OR d.description ILIKE :q)',
        { q: `%${filter.search}%` },
      );
    }

    qb.orderBy('d.createdAt', 'DESC').skip(skip).take(limit);

    const [disputes, total] = await qb.getManyAndCount();
    return { disputes, total, page, limit };
  }

  // ─── Find One ────────────────────────────────────────────────────────────────

  async findOne(id: string, user: User): Promise<DisputeV2> {
    const dispute = await this.disputeRepo.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['complainant', 'complainant.profile', 'respondent', 'respondent.profile', 'trip'],
    });

    if (!dispute) throw new NotFoundException('Dispute not found.');

    // Non-elevated roles can only access disputes they are a party to
    if (!hasElevatedView(user.role)) {
      if (dispute.complainantUserId !== user.id && dispute.respondentUserId !== user.id) {
        throw new ForbiddenException('You do not have access to this dispute.');
      }
    }

    return dispute;
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateDisputeDto, user: User): Promise<DisputeV2> {
    const dispute = await this.findOne(id, user);

    // Only complainant or elevated role can edit
    if (!hasElevatedView(user.role) && dispute.complainantUserId !== user.id) {
      throw new ForbiddenException('Only the complainant or an admin can edit this dispute.');
    }

    // Can't edit a closed dispute
    if ([DisputeStatusV2.CLOSED, DisputeStatusV2.RESOLVED].includes(dispute.status)) {
      throw new BadRequestException('Cannot edit a closed or resolved dispute.');
    }

    const old = { title: dispute.title, description: dispute.description, category: dispute.category, priority: dispute.priority };
    Object.assign(dispute, dto);
    await this.disputeRepo.save(dispute);

    await this.addAudit(id, 'UPDATED', user.id, old, dto);
    this.eventEmitter.emit('dispute.updated', { dispute, updatedBy: user });

    return this.findOne(id, user);
  }

  // ─── Delete (soft) ────────────────────────────────────────────────────────────

  async remove(id: string, user: User): Promise<void> {
    const dispute = await this.findOne(id, user);
    if (!hasElevatedView(user.role)) {
      throw new ForbiddenException('Only admins can delete disputes.');
    }
    await this.addAudit(id, 'DELETED', user.id);
    await this.disputeRepo.softDelete(id);
  }

  // ─── Comments ────────────────────────────────────────────────────────────────

  async addComment(id: string, dto: AddCommentDto, user: User): Promise<DisputeMessage> {
    const dispute = await this.findOne(id, user);

    // Closed disputes are read-only
    if (dispute.status === DisputeStatusV2.CLOSED) {
      throw new BadRequestException('Cannot comment on a closed dispute.');
    }

    // Internal notes are admin/elevated-only
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

    // Auto-progress to UNDER_REVIEW when an elevated user first comments on an OPEN dispute
    if (dispute.status === DisputeStatusV2.OPEN && hasElevatedView(user.role)) {
      await this.changeStatus(id, { status: DisputeStatusV2.UNDER_REVIEW }, user);
    }

    this.eventEmitter.emit('dispute.message_added', { disputeId: id, message: msg, sender: user });
    return msg;
  }

  async getComments(id: string, user: User): Promise<DisputeMessage[]> {
    await this.findOne(id, user); // access check

    const qb = this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('sender.profile', 'profile')
      .where('m.disputeId = :id', { id })
      .orderBy('m.createdAt', 'ASC');

    // Non-elevated roles cannot see internal notes
    if (!hasElevatedView(user.role)) {
      qb.andWhere('m.isInternal = false');
    }

    return qb.getMany();
  }

  // ─── Attachments ─────────────────────────────────────────────────────────────

  async addAttachment(
    id: string,
    fileInfo: { fileName: string; fileUrl: string; fileType?: string; fileSize?: number },
    user: User,
  ): Promise<DisputeAttachment> {
    const dispute = await this.findOne(id, user);

    if (dispute.status === DisputeStatusV2.CLOSED) {
      throw new BadRequestException('Cannot add attachments to a closed dispute.');
    }

    const attachment = await this.attachmentRepo.save(
      this.attachmentRepo.create({
        disputeId: id,
        uploadedBy: user.id,
        ...fileInfo,
      }),
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

  // ─── Resolve ─────────────────────────────────────────────────────────────────

  async resolve(id: string, dto: ResolveDisputeDto, user: User): Promise<DisputeV2> {
    if (!canResolve(user.role)) {
      throw new ForbiddenException('Only Tenant Admins can resolve disputes.');
    }

    const dispute = await this.findOne(id, user);

    if ([DisputeStatusV2.CLOSED, DisputeStatusV2.RESOLVED].includes(dispute.status)) {
      throw new BadRequestException('Dispute is already resolved or closed.');
    }

    const oldStatus = dispute.status;
    dispute.status    = DisputeStatusV2.RESOLVED;
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

  // ─── Close ────────────────────────────────────────────────────────────────────

  async close(id: string, user: User): Promise<DisputeV2> {
    if (!canResolve(user.role)) {
      throw new ForbiddenException('Only Tenant Admins can close disputes.');
    }

    const dispute = await this.findOne(id, user);
    if (dispute.status === DisputeStatusV2.CLOSED) {
      throw new BadRequestException('Dispute is already closed.');
    }

    const oldStatus = dispute.status;
    dispute.status   = DisputeStatusV2.CLOSED;
    dispute.closedAt = new Date();
    await this.disputeRepo.save(dispute);

    await this.addAudit(id, 'CLOSED', user.id, { status: oldStatus }, { status: DisputeStatusV2.CLOSED });
    this.eventEmitter.emit('dispute.closed', { dispute, closedBy: user });

    return this.findOne(id, user);
  }

  // ─── Reopen ───────────────────────────────────────────────────────────────────

  async reopen(id: string, reason: string, user: User): Promise<DisputeV2> {
    if (!canResolve(user.role)) {
      throw new ForbiddenException('Only Tenant Admins can reopen disputes.');
    }

    const dispute = await this.findOne(id, user);
    if (![DisputeStatusV2.CLOSED, DisputeStatusV2.RESOLVED, DisputeStatusV2.REJECTED].includes(dispute.status)) {
      throw new BadRequestException('Only closed, resolved, or rejected disputes can be reopened.');
    }

    const oldStatus = dispute.status;
    dispute.status    = DisputeStatusV2.REOPENED;
    dispute.closedAt  = null;
    dispute.resolvedAt = null;
    await this.disputeRepo.save(dispute);

    await this.addAudit(id, 'REOPENED', user.id, { status: oldStatus }, { status: DisputeStatusV2.REOPENED }, reason);
    this.eventEmitter.emit('dispute.reopened', { dispute, reopenedBy: user, reason });

    return this.findOne(id, user);
  }

  // ─── Change Status (generic — admin only) ────────────────────────────────────

  async changeStatus(id: string, dto: ChangeStatusDto, user: User): Promise<DisputeV2> {
    if (!canResolve(user.role)) {
      throw new ForbiddenException('Only admins can change dispute status directly.');
    }

    const dispute = await this.findOne(id, user);
    const oldStatus = dispute.status;
    dispute.status = dto.status;

    if (dto.status === DisputeStatusV2.CLOSED) dispute.closedAt = new Date();
    if (dto.status === DisputeStatusV2.RESOLVED) dispute.resolvedAt = new Date();

    await this.disputeRepo.save(dispute);
    await this.addAudit(id, 'STATUS_CHANGED', user.id, { status: oldStatus }, { status: dto.status }, dto.reason);
    this.eventEmitter.emit('dispute.status_changed', { dispute, oldStatus, newStatus: dto.status, changedBy: user });

    return this.findOne(id, user);
  }

  // ─── Get Timeline (audit + messages combined) ─────────────────────────────────

  async getTimeline(id: string, user: User): Promise<any[]> {
    await this.findOne(id, user); // access check

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

    const timeline = [
      ...auditLogs.map(a => ({ type: 'audit', data: a, timestamp: a.createdAt })),
      ...messages.map(m => ({ type: 'message', data: m, timestamp: m.createdAt })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return timeline;
  }

  // ─── Get Resolutions ─────────────────────────────────────────────────────────

  async getResolutions(id: string, user: User): Promise<DisputeResolutionRecord[]> {
    await this.findOne(id, user);
    return this.resolutionRepo.find({
      where: { disputeId: id },
      relations: ['resolver', 'resolver.profile'],
      order: { resolvedAt: 'DESC' },
    });
  }

  // ─── Analytics ────────────────────────────────────────────────────────────────

  async getAnalytics(tenantId: string, period?: string): Promise<any> {
    const qb = this.disputeRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.deleted_at IS NULL');

    // Apply period filter
    if (period) {
      const now = new Date();
      let fromDate: Date;
      switch (period) {
        case 'day':   fromDate = new Date(now.getTime() - 86400000); break;
        case 'week':  fromDate = new Date(now.getTime() - 7 * 86400000); break;
        case 'month': fromDate = new Date(now.getTime() - 30 * 86400000); break;
        case 'year':  fromDate = new Date(now.getTime() - 365 * 86400000); break;
        default: fromDate = new Date(now.getTime() - 30 * 86400000);
      }
      qb.andWhere('d.createdAt >= :from', { from: fromDate });
    }

    const all = await qb.getMany();

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const d of all) {
      byStatus[d.status]     = (byStatus[d.status]     || 0) + 1;
      byCategory[d.category] = (byCategory[d.category] || 0) + 1;
      byPriority[d.priority] = (byPriority[d.priority] || 0) + 1;
    }

    // Average resolution time
    const resolved = all.filter(d => d.resolvedAt && d.createdAt);
    const avgResolutionTimeMs = resolved.length > 0
      ? resolved.reduce((sum, d) => sum + (new Date(d.resolvedAt).getTime() - new Date(d.createdAt).getTime()), 0) / resolved.length
      : 0;
    const avgResolutionTimeHours = Math.round(avgResolutionTimeMs / 3600000);

    return {
      total:          all.length,
      open:           (byStatus[DisputeStatusV2.OPEN] || 0) + (byStatus[DisputeStatusV2.REOPENED] || 0),
      underReview:    byStatus[DisputeStatusV2.UNDER_REVIEW] || 0,
      resolved:       byStatus[DisputeStatusV2.RESOLVED] || 0,
      closed:         byStatus[DisputeStatusV2.CLOSED] || 0,
      escalated:      byStatus[DisputeStatusV2.ESCALATED] || 0,
      rejected:       byStatus[DisputeStatusV2.REJECTED] || 0,
      avgResolutionTimeHours,
      byStatus,
      byCategory,
      byPriority,
    };
  }
}
