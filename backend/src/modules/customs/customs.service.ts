import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { CustomsInspection, CustomsInspectionStatus, CustomsRiskLevel } from '../../entities/customs-inspection.entity';
import { CustomsCheckpoint } from '../../entities/customs-checkpoint.entity';
import { CustomsComplianceResponse, ComplianceResponseStatus } from '../../entities/customs-compliance-response.entity';
import { Trip } from '../../entities/trip.entity';
import { Truck } from '../../entities/truck.entity';
import { Document, EntityType } from '../../entities/document.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
} from '../../entities/notification.entity';
import {
  CreateInspectionDto,
  UpdateInspectionStatusDto,
  SearchTruckDto,
  CreateCheckpointDto,
  SubmitComplianceResponseDto,
  ReviewComplianceResponseDto,
} from './dto/customs.dto';

@Injectable()
export class CustomsService {
  private readonly logger = new Logger(CustomsService.name);

  constructor(
    @InjectRepository(CustomsInspection)
    private readonly inspectionRepo: Repository<CustomsInspection>,
    @InjectRepository(CustomsCheckpoint)
    private readonly checkpointRepo: Repository<CustomsCheckpoint>,
    @InjectRepository(CustomsComplianceResponse)
    private readonly complianceResponseRepo: Repository<CustomsComplianceResponse>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Truck)
    private readonly truckRepo: Repository<Truck>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Dashboard Stats ─────────────────────────────────────────────────────────

  async getDashboardStats(_tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Global stats — customs officers see all inspections across tenants
    const [
      totalToday,
      pending,
      cleared,
      rejected,
      flagged,
      onHold,
      highRisk,
    ] = await Promise.all([
      this.inspectionRepo.count(),
      this.inspectionRepo.count({ where: { status: CustomsInspectionStatus.PENDING } }),
      this.inspectionRepo.count({ where: { status: CustomsInspectionStatus.CLEARED } }),
      this.inspectionRepo.count({ where: { status: CustomsInspectionStatus.REJECTED } }),
      this.inspectionRepo.count({ where: { status: CustomsInspectionStatus.HIGH_RISK } }),
      this.inspectionRepo.count({ where: { status: CustomsInspectionStatus.ON_HOLD } }),
      this.inspectionRepo.count({ where: { riskLevel: CustomsRiskLevel.HIGH } }),
    ]);

    const clearedToday = await this.inspectionRepo
      .createQueryBuilder('i')
      .where('i.status = :status', { status: CustomsInspectionStatus.CLEARED })
      .andWhere('i.completedAt >= :today', { today })
      .getCount();

    return {
      totalInspections: totalToday,
      pending,
      cleared,
      rejected,
      flagged,
      onHold,
      highRisk,
      clearedToday,
    };
  }

  // ─── Search Trucks / Shipments ────────────────────────────────────────────────

  async searchTruck(_tenantId: string, dto: SearchTruckDto) {
    const results: any[] = [];

    // Customs officers have global visibility — no tenantId filter
    const qb = this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('trip.load', 'load')
      .leftJoinAndSelect('trip.driver', 'driver')
      .where('1=1');

    if (!dto.plateNumber && !dto.shipmentReference && !dto.containerNumber && !dto.tripId && !dto.driverId && !dto.driverName) {
      return []; // Require at least one search term
    }

    if (dto.plateNumber) {
      qb.andWhere('LOWER(truck.plateNumber) LIKE LOWER(:plate)', { plate: `%${dto.plateNumber}%` });
    }
    if (dto.shipmentReference) {
      qb.andWhere('LOWER(load.trackingNumber) LIKE LOWER(:ref)', { ref: `%${dto.shipmentReference}%` });
    }
    if (dto.containerNumber) {
      qb.andWhere('LOWER(load.containerNumber) LIKE LOWER(:cn)', { cn: `%${dto.containerNumber}%` });
    }
    if (dto.tripId) {
      qb.andWhere('trip.id = :tripId', { tripId: dto.tripId });
    }

    const trips = await qb.limit(20).getMany();

    for (const trip of trips) {
      const lastInspection = await this.inspectionRepo.findOne({
        where: { tripId: trip.id },
        order: { createdAt: 'DESC' },
      });

      // Fetch cargo documents for this load
      const cargoDocuments = trip.load?.id
        ? await this.documentRepo.find({
            where: { entityType: EntityType.CARGO, entityId: trip.load.id },
            order: { createdAt: 'DESC' },
          })
        : [];

      const driver = trip.driver as any;
      results.push({
        tripId: trip.id,
        tripNumber: trip.tripNumber,
        status: trip.status,
        plateNumber: trip.truck?.plateNumber,
        truckType: trip.truck?.truckType,
        driverName: driver ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim() : null,
        driverId: trip.driverId,
        cargoTitle: trip.load?.title,
        cargoType: trip.load?.cargoType,
        cargoWeight: trip.load?.weight,
        origin: trip.load?.origin,
        destination: trip.load?.destination,
        loadId: trip.load?.id || null,
        documents: cargoDocuments.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          title: doc.title,
          fileName: doc.originalFileName,
          fileUrl: doc.fileUrl,
          status: doc.status,
          uploadedAt: doc.createdAt,
        })),
        customsStatus: lastInspection?.status || null,
        riskLevel: lastInspection?.riskLevel || null,
        lastInspectionId: lastInspection?.id || null,
      });
    }

    return results;
  }

  // ─── Inspections CRUD ─────────────────────────────────────────────────────────

  async createInspection(tenantId: string, officerId: string, dto: CreateInspectionDto) {
    const inspection = this.inspectionRepo.create({
      ...dto,
      tenantId,
      officerId,
      status: CustomsInspectionStatus.IN_PROGRESS,
    });
    const saved = await this.inspectionRepo.save(inspection);

    // Notify cargo owner if inspection is linked to a trip
    if (dto.tripId) {
      try {
        const trip = await this.tripRepo.findOne({
          where: { id: dto.tripId },
          relations: ['load'],
        });
        if (trip?.load?.cargoOwnerId) {
          const channel = saved.inspectionChannel || 'YELLOW';
          const channelLabel = channel === 'GREEN' ? 'Green Lane' : channel === 'RED' ? 'Red Lane — Physical Inspection' : 'Yellow Lane — Document Check';
          const priority = saved.riskLevel === 'CRITICAL' || saved.riskLevel === 'HIGH'
            ? NotificationPriority.URGENT
            : NotificationPriority.HIGH;
          await this.notificationsService.createNotification({
            userId: trip.load.cargoOwnerId,
            tenantId: trip.load.tenantId,
            subject: '🛃 Customs Inspection Started on Your Cargo',
            content: `A customs inspection has been initiated on your cargo "${trip.load.title || 'your shipment'}" (Plate: ${saved.plateNumber || dto.plateNumber || 'N/A'}). Channel: ${channelLabel}. Risk Level: ${saved.riskLevel}. You can view full inspection details in your dashboard.`,
            type: NotificationType.CARGO_CUSTOMS_UPDATE,
            category: NotificationCategory.COMPLIANCE,
            channel: NotificationChannel.IN_APP,
            priority,
            entityType: 'TRIP' as any,
            entityId: dto.tripId,
            actionUrl: `/dashboard/customs-inspections/${saved.id}`,
            actionText: 'View Inspection',
            metadata: { inspectionId: saved.id, plateNumber: saved.plateNumber, riskLevel: saved.riskLevel, inspectionChannel: saved.inspectionChannel },
          } as any, trip.load.tenantId);
        }
      } catch (err) {
        this.logger.warn(`Could not send customs inspection notification: ${err.message}`);
      }
    }

    return saved;
  }

  async getInspections(
    _tenantId: string,
    params: {
      status?: CustomsInspectionStatus;
      riskLevel?: CustomsRiskLevel;
      officerId?: string;
      limit?: number;
      offset?: number;
      search?: string;
    },
  ) {
    const qb = this.inspectionRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.officer', 'officer')
      .leftJoinAndSelect('i.trip', 'trip')
      .leftJoinAndSelect('trip.load', 'load')
      .where('1=1');

    if (params.status) qb.andWhere('i.status = :status', { status: params.status });
    if (params.riskLevel) qb.andWhere('i.riskLevel = :riskLevel', { riskLevel: params.riskLevel });
    if (params.officerId) qb.andWhere('i.officerId = :officerId', { officerId: params.officerId });
    if (params.search) {
      qb.andWhere(
        '(LOWER(i.plateNumber) LIKE LOWER(:q) OR LOWER(i.shipmentReference) LIKE LOWER(:q) OR LOWER(i.containerNumber) LIKE LOWER(:q) OR LOWER(i.driverName) LIKE LOWER(:q))',
        { q: `%${params.search}%` },
      );
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy('i.createdAt', 'DESC')
      .skip(params.offset || 0)
      .take(params.limit || 20)
      .getMany();

    return { data, total, limit: params.limit || 20, offset: params.offset || 0 };
  }

  async getInspectionById(_tenantId: string, id: string) {
    // Customs officers can access any inspection globally
    const inspection = await this.inspectionRepo.findOne({
      where: { id },
      relations: ['officer', 'trip', 'trip.load', 'trip.truck'],
    });
    if (!inspection) throw new NotFoundException(`Inspection ${id} not found`);
    return inspection;
  }

  async updateInspectionStatus(tenantId: string, id: string, dto: UpdateInspectionStatusDto, updatedByOfficerId?: string) {
    const inspection = await this.getInspectionById(tenantId, id);
    Object.assign(inspection, dto);
    if (
      dto.status === CustomsInspectionStatus.CLEARED ||
      dto.status === CustomsInspectionStatus.REJECTED
    ) {
      inspection.completedAt = new Date();
    }
    // Track which officer last updated this inspection
    if (updatedByOfficerId) {
      inspection.metadata = { ...(inspection.metadata || {}), lastUpdatedBy: updatedByOfficerId };
    }
    const saved = await this.inspectionRepo.save(inspection);

    // Notify cargo owner about status change
    if (saved.tripId) {
      try {
        const trip = await this.tripRepo.findOne({
          where: { id: saved.tripId },
          relations: ['load'],
        });
        if (trip?.load?.cargoOwnerId) {
          const statusMessages: Record<string, { subject: string; content: string; priority: NotificationPriority }> = {
            CLEARED: {
              subject: '✅ Your Cargo Has Been Customs Cleared',
              content: `Great news! Your cargo "${trip.load.title || 'your shipment'}" (Plate: ${saved.plateNumber || 'N/A'}) has passed customs inspection and been cleared for release.`,
              priority: NotificationPriority.HIGH,
            },
            REJECTED: {
              subject: '❌ Customs Inspection Rejected',
              content: `Your cargo "${trip.load.title || 'your shipment'}" (Plate: ${saved.plateNumber || 'N/A'}) has been rejected at customs.${dto.rejectionReason ? ` Reason: ${dto.rejectionReason}` : ''} Please contact the customs officer immediately.`,
              priority: NotificationPriority.URGENT,
            },
            ON_HOLD: {
              subject: '⏸ Your Cargo Is On Hold at Customs',
              content: `Your cargo "${trip.load.title || 'your shipment'}" (Plate: ${saved.plateNumber || 'N/A'}) has been placed on hold at customs. Please await further instructions or contact your customs broker.`,
              priority: NotificationPriority.HIGH,
            },
            HIGH_RISK: {
              subject: '⚠️ Your Cargo Has Been Flagged High Risk',
              content: `Your cargo "${trip.load.title || 'your shipment'}" (Plate: ${saved.plateNumber || 'N/A'}) has been flagged as high risk and requires a comprehensive physical inspection.`,
              priority: NotificationPriority.URGENT,
            },
          };
          const msg = statusMessages[dto.status];
          if (msg) {
            await this.notificationsService.createNotification({
              userId: trip.load.cargoOwnerId,
              tenantId: trip.load.tenantId,
              subject: msg.subject,
              content: msg.content,
              type: NotificationType.CARGO_CUSTOMS_UPDATE,
              category: NotificationCategory.COMPLIANCE,
              channel: NotificationChannel.IN_APP,
              priority: msg.priority,
              entityType: 'TRIP' as any,
              entityId: saved.tripId,
              actionUrl: `/dashboard/customs-inspections/${saved.id}`,
              actionText: 'View Inspection',
              metadata: { inspectionId: saved.id, status: dto.status, plateNumber: saved.plateNumber },
            } as any, trip.load.tenantId);
          }
        }
      } catch (err) {
        this.logger.warn(`Could not send customs status notification: ${err.message}`);
      }
    }

    return saved;
  }

  async flagInspection(tenantId: string, id: string, riskLevel: CustomsRiskLevel, notes?: string, updatedByOfficerId?: string) {
    const inspection = await this.getInspectionById(tenantId, id);
    inspection.riskLevel = riskLevel;
    inspection.status = CustomsInspectionStatus.HIGH_RISK;
    if (notes) inspection.inspectionNotes = notes;
    if (updatedByOfficerId) {
      inspection.metadata = { ...(inspection.metadata || {}), lastUpdatedBy: updatedByOfficerId };
    }
    const saved = await this.inspectionRepo.save(inspection);

    if (saved.tripId) {
      try {
        const trip = await this.tripRepo.findOne({
          where: { id: saved.tripId },
          relations: ['load'],
        });
        if (trip?.load?.cargoOwnerId) {
          await this.notificationsService.createNotification({
            userId: trip.load.cargoOwnerId,
            tenantId: trip.load.tenantId,
            subject: '⚠️ Your Cargo Has Been Flagged — Customs Action Required',
            content: `Your cargo "${trip.load.title || 'your shipment'}" has been flagged as ${riskLevel} risk at customs.${notes ? ` Officer notes: ${notes}` : ''} Immediate action may be required.`,
            type: NotificationType.CARGO_CUSTOMS_UPDATE,
            category: NotificationCategory.COMPLIANCE,
            channel: NotificationChannel.IN_APP,
            priority: NotificationPriority.URGENT,
            entityType: 'TRIP' as any,
            entityId: saved.tripId,
            actionUrl: `/dashboard/customs-inspections/${saved.id}`,
            actionText: 'View Inspection',
            metadata: { inspectionId: saved.id, riskLevel, plateNumber: saved.plateNumber },
          } as any, trip.load.tenantId);
        }
      } catch (err) {
        this.logger.warn(`Could not send flag notification: ${err.message}`);
      }
    }

    return saved;
  }

  // ─── Cargo Owner: View inspections on their loads ─────────────────────────────

  async getInspectionsByCargoOwner(cargoOwnerId: string) {
    // Find all trips whose load belongs to this cargo owner
    const trips = await this.tripRepo
      .createQueryBuilder('trip')
      .leftJoin('trip.load', 'load')
      .where('load.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .select(['trip.id'])
      .getMany();

    if (!trips.length) return [];

    const tripIds = trips.map(t => t.id);

    return this.inspectionRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.officer', 'officer')
      .leftJoinAndSelect('i.trip', 'trip')
      .leftJoinAndSelect('trip.load', 'load')
      .where('i.tripId IN (:...tripIds)', { tripIds })
      .orderBy('i.createdAt', 'DESC')
      .getMany();
  }

  // ─── Analytics ───────────────────────────────────────────────────────────────

  async getAnalytics(_tenantId: string, days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    // Global analytics across all tenants
    const all = await this.inspectionRepo
      .createQueryBuilder('i')
      .where('i.createdAt >= :from', { from })
      .getMany();

    const byStatus = Object.values(CustomsInspectionStatus).map(s => ({
      status: s,
      count: all.filter(i => i.status === s).length,
    }));

    const byRisk = Object.values(CustomsRiskLevel).map(r => ({
      risk: r,
      count: all.filter(i => i.riskLevel === r).length,
    }));

    const clearanceRate = all.length > 0
      ? Math.round((all.filter(i => i.status === CustomsInspectionStatus.CLEARED).length / all.length) * 100)
      : 0;

    return { total: all.length, byStatus, byRisk, clearanceRate, period: days };
  }

  // ─── Compliance Responses ─────────────────────────────────────────────────────

  /**
   * Cargo owner submits a compliance response to an ON_HOLD inspection.
   * They provide notes explaining what was resolved and reference uploaded document IDs.
   * The assigned officer is notified in real-time.
   */
  async submitComplianceResponse(
    inspectionId: string,
    submittedById: string,
    dto: SubmitComplianceResponseDto,
  ): Promise<CustomsComplianceResponse> {
    const inspection = await this.inspectionRepo.findOne({ where: { id: inspectionId } });
    if (!inspection) throw new NotFoundException(`Inspection ${inspectionId} not found`);

    const response = this.complianceResponseRepo.create({
      inspectionId,
      submittedById,
      notes: dto.notes,
      documentIds: dto.documentIds || [],
      status: ComplianceResponseStatus.SUBMITTED,
    });
    const saved = await this.complianceResponseRepo.save(response);

    // Mark inspection as pending re-review
    inspection.status = CustomsInspectionStatus.PENDING;
    inspection.metadata = {
      ...(inspection.metadata || {}),
      lastComplianceResponseId: saved.id,
      lastComplianceResponseAt: new Date().toISOString(),
    };
    await this.inspectionRepo.save(inspection);

    // Notify the officer who created the inspection
    try {
      await this.notificationsService.createNotification({
        userId: inspection.officerId,
        tenantId: inspection.tenantId,
        subject: '📋 Compliance Response Submitted — Action Required',
        content: `A cargo owner has submitted a compliance response for inspection on ${inspection.plateNumber || inspection.shipmentReference || inspectionId}. They have provided notes and ${dto.documentIds?.length || 0} document(s). Please review and update the inspection status.`,
        type: NotificationType.CARGO_CUSTOMS_UPDATE,
        category: NotificationCategory.COMPLIANCE,
        channel: NotificationChannel.IN_APP,
        priority: NotificationPriority.HIGH,
        entityType: 'TRIP' as any,
        entityId: inspection.tripId,
        actionUrl: `/dashboard/customs/inspections/${inspectionId}`,
        actionText: 'Review Response',
        metadata: {
          inspectionId,
          complianceResponseId: saved.id,
          submittedById,
          documentsCount: dto.documentIds?.length || 0,
        },
      } as any, inspection.tenantId);
    } catch (err) {
      this.logger.warn(`Could not notify officer of compliance response: ${err.message}`);
    }

    return saved;
  }

  /**
   * Get all compliance responses for an inspection.
   * Officers and cargo owners can both view these.
   */
  async getComplianceResponses(inspectionId: string): Promise<CustomsComplianceResponse[]> {
    return this.complianceResponseRepo.find({
      where: { inspectionId },
      relations: ['submittedBy', 'reviewedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Officer reviews a compliance response — accepts or rejects it.
   * If accepted, inspection moves to IN_PROGRESS for final decision.
   * If rejected, it goes back to ON_HOLD so cargo owner can try again.
   * Cargo owner is notified either way.
   */
  async reviewComplianceResponse(
    inspectionId: string,
    responseId: string,
    reviewedById: string,
    dto: ReviewComplianceResponseDto,
  ): Promise<CustomsComplianceResponse> {
    const response = await this.complianceResponseRepo.findOne({
      where: { id: responseId, inspectionId },
    });
    if (!response) throw new NotFoundException(`Compliance response ${responseId} not found`);

    response.status = dto.status;
    response.reviewedById = reviewedById;
    response.reviewNotes = dto.reviewNotes;
    response.reviewedAt = new Date();
    const saved = await this.complianceResponseRepo.save(response);

    // Update inspection status based on review decision
    const inspection = await this.inspectionRepo.findOne({ where: { id: inspectionId } });
    if (inspection) {
      inspection.status = dto.status === ComplianceResponseStatus.ACCEPTED
        ? CustomsInspectionStatus.IN_PROGRESS   // officer will now make final decision
        : CustomsInspectionStatus.ON_HOLD;       // rejected — cargo owner must try again
      await this.inspectionRepo.save(inspection);

      // Notify the cargo owner of the review outcome
      try {
        const isAccepted = dto.status === ComplianceResponseStatus.ACCEPTED;
        await this.notificationsService.createNotification({
          userId: response.submittedById,
          tenantId: inspection.tenantId,
          subject: isAccepted
            ? '✅ Your Compliance Response Has Been Accepted'
            : '❌ Your Compliance Response Was Rejected',
          content: isAccepted
            ? `The customs officer has reviewed and accepted your compliance response for inspection on "${inspection.plateNumber || inspection.shipmentReference || inspectionId}". The inspection is now being processed for final clearance.${dto.reviewNotes ? ` Officer notes: ${dto.reviewNotes}` : ''}`
            : `The customs officer has reviewed your compliance response for inspection on "${inspection.plateNumber || inspection.shipmentReference || inspectionId}" and found it insufficient. Please review the officer's notes and resubmit.${dto.reviewNotes ? ` Officer notes: ${dto.reviewNotes}` : ''}`,
          type: NotificationType.CARGO_CUSTOMS_UPDATE,
          category: NotificationCategory.COMPLIANCE,
          channel: NotificationChannel.IN_APP,
          priority: isAccepted ? NotificationPriority.HIGH : NotificationPriority.URGENT,
          entityType: 'TRIP' as any,
          entityId: inspection.tripId,
          actionUrl: `/dashboard/customs-inspections/${inspectionId}`,
          actionText: 'View Inspection',
          metadata: { inspectionId, complianceResponseId: responseId, reviewStatus: dto.status },
        } as any, inspection.tenantId);
      } catch (err) {
        this.logger.warn(`Could not notify cargo owner of compliance review: ${err.message}`);
      }
    }

    return saved;
  }

  // ─── Checkpoints ─────────────────────────────────────────────────────────────

  async getCheckpoints(_tenantId: string) {
    // Show all active checkpoints globally
    return this.checkpointRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async createCheckpoint(tenantId: string, dto: CreateCheckpointDto) {
    const cp = this.checkpointRepo.create({ ...dto, tenantId });
    return this.checkpointRepo.save(cp);
  }
}
