import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  CargoInspection,
  CargoInspectionType,
  InspectionDecision,
  InspectionStatus,
} from '../../entities/cargo-inspection.entity';
import { Load, LoadStatus } from '../../entities/load.entity';
import { Driver } from '../../entities/driver.entity';
import { User, UserRole } from '../../entities/user.entity';
import {
  MarkReadyForReInspectionDto,
  SubmitPreTripInspectionDto,
} from './dto/pre-trip-inspection.dto';
import {
  getPreTripInspectionMetadata,
  isPreTripInspectionApproved,
  PRE_TRIP_INSPECTION_BLOCKED_MESSAGE,
  PreTripInspectionIssue,
  PreTripInspectionMetadata,
  PreTripInspectionWorkflowStatus,
} from './pre-trip-inspection.types';
import { NotificationService } from '../notifications/notification.service';
import {
  EntityType,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../../entities/notification.entity';

@Injectable()
export class PreTripInspectionService {
  private readonly logger = new Logger(PreTripInspectionService.name);

  constructor(
    @InjectRepository(CargoInspection)
    private readonly cargoInspectionRepository: Repository<CargoInspection>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async getAssignedLoadsWithInspectionStatus(
    driverIdOrUserId: string,
    tenantId: string,
  ) {
    const driver = await this.resolveDriver(driverIdOrUserId, tenantId);
    const loads = await this.getAssignedLoadsForDriver(driver, tenantId);

    return Promise.all(
      loads.map(async (load) => ({
        ...load,
        preTripInspection: await this.buildInspectionSummary(load),
      })),
    );
  }

  async getInspectionQueue(driverIdOrUserId: string, tenantId: string) {
    const loads = await this.getAssignedLoadsWithInspectionStatus(
      driverIdOrUserId,
      tenantId,
    );

    return loads.filter((load) => {
      const status = load.preTripInspection.status;
      return [
        PreTripInspectionWorkflowStatus.PENDING,
        PreTripInspectionWorkflowStatus.IN_PROGRESS,
        PreTripInspectionWorkflowStatus.FAILED,
        PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION,
        PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION,
      ].includes(status);
    });
  }

  async getInspectionForm(
    loadId: string,
    driverIdOrUserId: string,
    tenantId: string,
  ) {
    const driver = await this.resolveDriver(driverIdOrUserId, tenantId);
    const load = await this.getAssignedLoadForDriver(loadId, driver, tenantId);
    const history = await this.getInspectionHistoryRecords(loadId);
    const workflow = getPreTripInspectionMetadata(load.metadata);

    return {
      cargo: load,
      workflowStatus: workflow.status,
      checklist: this.buildPreTripChecklist(load),
      history,
      canInspect: this.canDriverInspect(workflow.status),
    };
  }

  async getInspectionHistory(
    loadId: string,
    tenantId: string,
    userId?: string,
  ) {
    const load = await this.loadRepository.findOne({
      where: { id: loadId, tenantId },
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    if (userId) {
      await this.assertCanViewLoadInspections(load, userId);
    }

    return this.getInspectionHistoryRecords(loadId);
  }

  async getCargoOwnerInspectionOverview(
    userId: string,
    tenantId: string,
    role: UserRole,
  ) {
    if (
      role !== UserRole.CARGO_OWNER &&
      role !== UserRole.BROKER
    ) {
      throw new ForbiddenException(
        'Only cargo owners and brokers can view cargo inspections.',
      );
    }

    const loadFilter =
      role === UserRole.BROKER
        ? { brokerId: userId, tenantId }
        : { cargoOwnerId: userId, tenantId };

    const loads = await this.loadRepository.find({
      where: loadFilter,
      relations: ['receiver', 'receiver.profile', 'assignedTruck'],
      order: { updatedAt: 'DESC' },
    });

    const assignedTruckIds = loads
      .map((load) => load.assignedTruckId)
      .filter(Boolean) as string[];

    const driversByTruckId = new Map<string, Driver>();
    if (assignedTruckIds.length > 0) {
      const drivers = await this.driverRepository.find({
        where: { currentTruckId: In(assignedTruckIds), tenantId },
      });
      for (const driver of drivers) {
        if (driver.currentTruckId) {
          driversByTruckId.set(driver.currentTruckId, driver);
        }
      }
    }

    const loadIds = loads.map((load) => load.id);
    let allInspections: CargoInspection[] = [];

    if (loadIds.length > 0) {
      allInspections = await this.cargoInspectionRepository.find({
        where: { loadId: In(loadIds) },
        relations: ['receiver', 'receiver.profile', 'driver'],
        order: { createdAt: 'DESC' },
      });
    }

    const inspectionsByLoad = allInspections.reduce<
      Record<string, CargoInspection[]>
    >((acc, inspection) => {
      if (!acc[inspection.loadId]) {
        acc[inspection.loadId] = [];
      }
      acc[inspection.loadId].push(inspection);
      return acc;
    }, {});

    const shipments = loads
      .map((load) => {
        const loadInspections = inspectionsByLoad[load.id] || [];
        const preTripRecords = loadInspections.filter(
          (i) => i.inspectionType === CargoInspectionType.PRE_TRIP,
        );
        const deliveryRecords = loadInspections.filter(
          (i) => i.inspectionType === CargoInspectionType.DELIVERY,
        );
        const workflow = getPreTripInspectionMetadata(load.metadata);
        const latestPreTrip = preTripRecords[0]
          ? this.mapInspectionRecord(preTripRecords[0])
          : null;
        const latestDelivery = deliveryRecords[0]
          ? this.mapInspectionRecord(deliveryRecords[0])
          : null;

        const requiresAction =
          workflow.status === PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION;

        const assignedDriver = load.assignedTruckId
          ? driversByTruckId.get(load.assignedTruckId)
          : undefined;

        return {
          loadId: load.id,
          loadTitle: load.title,
          loadReference: load.reference,
          loadStatus: load.status,
          updatedAt: load.updatedAt,
          driver: assignedDriver
            ? {
                id: assignedDriver.id,
                name: `${assignedDriver.firstName || ''} ${assignedDriver.lastName || ''}`.trim(),
                phone: assignedDriver.phone,
              }
            : null,
          receiver: load.receiver
            ? {
                id: load.receiver.id,
                name: load.receiver.profile
                  ? `${load.receiver.profile.firstName || ''} ${load.receiver.profile.lastName || ''}`.trim()
                  : null,
                email: load.receiver.email,
                phone: load.receiver.phone,
              }
            : null,
          preTrip: {
            workflowStatus: workflow.status,
            approvedAt: workflow.approvedAt,
            lastFailedAt: workflow.lastFailedAt,
            resolutionNotes: workflow.resolutionNotes,
            readyForReInspectionAt: workflow.readyForReInspectionAt,
            currentAttempt: workflow.currentAttempt ?? preTripRecords.length,
            historyCount: preTripRecords.length,
            requiresAction,
            latestInspection: latestPreTrip,
            history: preTripRecords.map((r) => this.mapInspectionRecord(r)),
          },
          postTrip: {
            status: latestDelivery?.status ?? 'NOT_STARTED',
            latestInspection: latestDelivery,
            history: deliveryRecords.map((r) => this.mapInspectionRecord(r)),
          },
          requiresAction,
          hasActivity:
            preTripRecords.length > 0 ||
            deliveryRecords.length > 0 ||
            load.assignedTruckId != null ||
            workflow.status !== PreTripInspectionWorkflowStatus.PENDING,
        };
      })
      .filter((shipment) => shipment.hasActivity);

    const summary = {
      total: shipments.length,
      preTripPending: shipments.filter(
        (s) =>
          s.preTrip.workflowStatus === PreTripInspectionWorkflowStatus.PENDING ||
          s.preTrip.workflowStatus === PreTripInspectionWorkflowStatus.IN_PROGRESS,
      ).length,
      preTripAwaitingAction: shipments.filter((s) => s.preTrip.requiresAction)
        .length,
      preTripApproved: shipments.filter(
        (s) =>
          s.preTrip.workflowStatus === PreTripInspectionWorkflowStatus.APPROVED,
      ).length,
      postCompleted: shipments.filter(
        (s) => s.postTrip.status === InspectionStatus.COMPLETED,
      ).length,
      postWithIssues: shipments.filter(
        (s) => (s.postTrip.latestInspection?.discrepancyCount ?? 0) > 0,
      ).length,
      requiresAction: shipments.filter((s) => s.requiresAction).length,
    };

    return {
      success: true,
      data: {
        shipments,
        summary,
      },
    };
  }

  private mapInspectionRecord(inspection: CargoInspection) {
    return {
      id: inspection.id,
      inspectionType: inspection.inspectionType,
      status: inspection.status,
      decision: inspection.decision,
      attemptNumber: inspection.attemptNumber,
      checklist: inspection.checklist,
      overallNotes: inspection.overallNotes,
      allItemsVerified: inspection.allItemsVerified,
      verifiedCount: inspection.verifiedCount,
      totalItems: inspection.totalItems,
      discrepancyCount: inspection.discrepancyCount,
      discrepancies: inspection.discrepancies,
      issues: inspection.issues,
      documents: inspection.documents || [],
      verificationData: inspection.verificationData,
      completedAt: inspection.completedAt,
      createdAt: inspection.createdAt,
      updatedAt: inspection.updatedAt,
      driverId: inspection.driverId,
      receiverId: inspection.receiverId,
    };
  }

  async submitInspection(
    driverIdOrUserId: string,
    loadId: string,
    dto: SubmitPreTripInspectionDto,
    tenantId: string,
  ) {
    const driver = await this.resolveDriver(driverIdOrUserId, tenantId);
    const load = await this.getAssignedLoadForDriver(loadId, driver, tenantId);
    const workflow = getPreTripInspectionMetadata(load.metadata);

    if (!this.canDriverInspect(workflow.status)) {
      throw new BadRequestException(
        'This shipment is not available for inspection at this time.',
      );
    }

    const previousAttempts = await this.cargoInspectionRepository.count({
      where: { loadId, inspectionType: CargoInspectionType.PRE_TRIP },
    });

    const attemptNumber = previousAttempts + 1;
    const passed = dto.decision === InspectionDecision.PASSED;
    const failed = dto.decision === InspectionDecision.FAILED;

    if (failed && (!dto.issues || dto.issues.length === 0)) {
      throw new BadRequestException(
        'At least one issue must be reported when failing an inspection.',
      );
    }

    const checklist = (dto.checklist || []).map((item) => ({
      id: item.id,
      label: item.label,
      verified: item.verified,
      notes: item.notes,
      discrepancy: item.discrepancy ?? !item.verified,
    }));

    const issues: PreTripInspectionIssue[] = (dto.issues || []).map(
      (issue, index) => ({
        id: `${Date.now()}-${index}`,
        type: issue.type as PreTripInspectionIssue['type'],
        severity: issue.severity as PreTripInspectionIssue['severity'],
        description: issue.description,
        location: issue.location,
        actionRequired: issue.actionRequired,
        resolved: false,
      }),
    );

    const inspection = this.cargoInspectionRepository.create({
      loadId,
      driverId: driver.userId,
      inspectionType: CargoInspectionType.PRE_TRIP,
      status: passed
        ? InspectionStatus.APPROVED
        : failed
          ? InspectionStatus.FAILED
          : InspectionStatus.COMPLETED,
      decision: dto.decision,
      attemptNumber,
      checklist,
      overallNotes: dto.notes,
      allItemsVerified: passed,
      verifiedCount: checklist.filter((item) => item.verified).length,
      totalItems: checklist.length,
      discrepancyCount: checklist.filter((item) => item.discrepancy).length,
      discrepancies: checklist
        .filter((item) => item.discrepancy)
        .map((item) => ({
          itemId: item.id,
          itemLabel: item.label,
          originalValue: null,
          notes: item.notes || '',
        })),
      documents: (dto.documents || []).concat(
        (dto.photos || []).map((url, index) => ({
          id: `photo-${index}`,
          url,
          type: 'photo' as const,
          label: 'Inspection evidence',
          uploadedAt: new Date().toISOString(),
        })),
      ),
      issues,
      verificationData: dto.verification || {},
      completedAt: new Date(),
    });

    const savedInspection =
      await this.cargoInspectionRepository.save(inspection);

    const nextWorkflow: PreTripInspectionMetadata = passed
      ? {
          status: PreTripInspectionWorkflowStatus.APPROVED,
          lastInspectionId: savedInspection.id,
          approvedAt: new Date().toISOString(),
          currentAttempt: attemptNumber,
        }
      : {
          status: PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION,
          lastInspectionId: savedInspection.id,
          lastFailedAt: new Date().toISOString(),
          currentAttempt: attemptNumber,
        };

    await this.updateLoadWorkflow(load, nextWorkflow, dto, passed);

    if (passed) {
      await this.notifyInspectionApproved(load, driver, savedInspection.id);
    } else {
      await this.notifyInspectionFailed(load, driver, savedInspection.id, issues);
    }

    return {
      inspection: savedInspection,
      workflowStatus: nextWorkflow.status,
      canProceed: passed,
    };
  }

  async markReadyForReInspection(
    loadId: string,
    userId: string,
    tenantId: string,
    dto: MarkReadyForReInspectionDto,
  ) {
    const load = await this.loadRepository.findOne({
      where: { id: loadId, tenantId },
      relations: ['assignedTruck'],
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    await this.assertCanResolveInspection(load, userId);

    const workflow = getPreTripInspectionMetadata(load.metadata);
    if (
      workflow.status !== PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION
    ) {
      throw new BadRequestException(
        'Only shipments awaiting resolution can be marked ready for re-inspection.',
      );
    }

    const nextWorkflow: PreTripInspectionMetadata = {
      ...workflow,
      status: PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION,
      resolutionNotes: dto.resolutionNotes,
      readyForReInspectionAt: new Date().toISOString(),
    };

    await this.loadRepository.update(loadId, {
      metadata: {
        ...(load.metadata || {}),
        preTripInspection: nextWorkflow,
        inspectionStatus: 'READY_FOR_RE_INSPECTION',
      } as Record<string, any>,
      updatedAt: new Date(),
    });

    await this.notifyReadyForReInspection(load, dto.resolutionNotes);

    return {
      loadId,
      workflowStatus: nextWorkflow.status,
      message: 'Shipment marked ready for re-inspection.',
    };
  }

  assertPreTripInspectionApproved(load: Load): void {
    if (!isPreTripInspectionApproved(load.metadata)) {
      throw new BadRequestException(PRE_TRIP_INSPECTION_BLOCKED_MESSAGE);
    }
  }

  async assertPreTripInspectionApprovedByLoadId(
    loadId: string,
    tenantId: string,
  ): Promise<void> {
    const load = await this.loadRepository.findOne({
      where: { id: loadId, tenantId },
    });

    if (!load) {
      throw new NotFoundException('Load not found');
    }

    this.assertPreTripInspectionApproved(load);
  }

  private async buildInspectionSummary(load: Load) {
    const workflow = getPreTripInspectionMetadata(load.metadata);
    const history = await this.getInspectionHistoryRecords(load.id);

    return {
      ...workflow,
      historyCount: history.length,
      latestInspection: history[0] || null,
    };
  }

  private async getInspectionHistoryRecords(loadId: string) {
    return this.cargoInspectionRepository.find({
      where: { loadId, inspectionType: CargoInspectionType.PRE_TRIP },
      order: { createdAt: 'DESC' },
    });
  }

  private canDriverInspect(status: PreTripInspectionWorkflowStatus): boolean {
    return [
      PreTripInspectionWorkflowStatus.PENDING,
      PreTripInspectionWorkflowStatus.IN_PROGRESS,
      PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION,
    ].includes(status);
  }

  private buildPreTripChecklist(load: Load) {
    return [
      {
        id: 'identity',
        label: 'Cargo identity verification',
        category: 'identity',
        originalValue: load.title || load.cargoType,
      },
      {
        id: 'quantity',
        label: 'Quantity verification',
        category: 'quantity',
        originalValue: load.unitsRequired || load.numberOfPieces,
      },
      {
        id: 'weight',
        label: 'Weight verification',
        category: 'weight',
        originalValue: load.weight,
      },
      {
        id: 'dimensions',
        label: 'Dimensions verification',
        category: 'dimensions',
        originalValue: {
          length: load.length,
          width: load.width,
          height: load.height,
        },
      },
      {
        id: 'packaging',
        label: 'Packaging inspection',
        category: 'packaging',
      },
      {
        id: 'condition',
        label: 'Cargo condition',
        category: 'condition',
      },
      {
        id: 'documentation',
        label: 'Documentation verification',
        category: 'documentation',
        originalValue: load.metadata?.requiredDocuments || [],
      },
      {
        id: 'seal',
        label: 'Container seal verification',
        category: 'seal',
      },
    ];
  }

  private async updateLoadWorkflow(
    load: Load,
    workflow: PreTripInspectionMetadata,
    dto: SubmitPreTripInspectionDto,
    passed: boolean,
  ) {
    await this.loadRepository.update(load.id, {
      metadata: {
        ...(load.metadata || {}),
        preTripInspection: workflow,
        inspectionStatus: passed ? 'COMPLETED' : 'FAILED',
        inspectionResult: {
          status: passed ? 'PASSED' : 'FAILED',
          notes: dto.notes,
          photos: dto.photos || [],
          issues: dto.issues || [],
          decision: dto.decision,
        },
        inspectionCompletedAt: new Date().toISOString(),
      } as Record<string, any>,
      updatedAt: new Date(),
    });
  }

  private async resolveDriver(
    driverIdOrUserId: string,
    tenantId: string,
  ): Promise<Driver> {
    let driver = await this.driverRepository.findOne({
      where: { id: driverIdOrUserId, tenantId },
    });

    if (!driver) {
      driver = await this.driverRepository.findOne({
        where: { userId: driverIdOrUserId, tenantId },
      });
    }

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  private async getAssignedLoadsForDriver(driver: Driver, tenantId: string) {
    if (!driver.currentTruckId) {
      return [];
    }

    return this.loadRepository.find({
      where: {
        assignedTruckId: driver.currentTruckId,
        tenantId,
        status: LoadStatus.ASSIGNED,
      },
      relations: ['cargoOwner', 'cargoOwner.profile'],
      order: { createdAt: 'DESC' },
    });
  }

  private async getAssignedLoadForDriver(
    loadId: string,
    driver: Driver,
    tenantId: string,
  ): Promise<Load> {
    if (!driver.currentTruckId) {
      throw new BadRequestException('Driver is not assigned to any truck');
    }

    const load = await this.loadRepository.findOne({
      where: {
        id: loadId,
        assignedTruckId: driver.currentTruckId,
        tenantId,
      },
      relations: ['cargoOwner', 'cargoOwner.profile'],
    });

    if (!load) {
      throw new NotFoundException('Load not found or not assigned to your truck');
    }

    return load;
  }

  private async assertCanViewLoadInspections(load: Load, userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isCargoOwner =
      user.role === UserRole.CARGO_OWNER && load.cargoOwnerId === userId;
    const isBroker =
      user.role === UserRole.BROKER && load.brokerId === userId;
    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN].includes(
      user.role,
    );

    if (!isCargoOwner && !isBroker && !isAdmin) {
      throw new ForbiddenException(
        'You can only view inspections for your own cargo or brokered loads.',
      );
    }
  }

  private async assertCanResolveInspection(load: Load, userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const isCargoOwner =
      user.role === UserRole.CARGO_OWNER && load.cargoOwnerId === userId;
    const isBroker =
      user.role === UserRole.BROKER && load.brokerId === userId;
    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN].includes(
      user.role,
    );

    if (!isCargoOwner && !isBroker && !isAdmin) {
      throw new ForbiddenException(
        'Only the cargo owner or broker can resolve inspection issues.',
      );
    }
  }

  private inspectionActionUrl(loadId: string, recipientId: string, load: Load): string {
    if (load.brokerId === recipientId) {
      return `/dashboard/broker/customs-inspections/${loadId}`;
    }
    return `/dashboard/customs-inspections/${loadId}`;
  }

  private async notifyInspectionFailed(
    load: Load,
    driver: Driver,
    inspectionId: string,
    issues: PreTripInspectionIssue[],
  ) {
    const issueSummary = issues.map((issue) => issue.description).join('; ');
    const recipients = [load.cargoOwnerId, load.brokerId].filter(Boolean) as string[];

    for (const recipientId of recipients) {
      await this.safeNotify({
        recipientId,
        tenantId: load.tenantId,
        title: 'Pre-Trip Inspection Failed',
        message: `Driver ${driver.firstName} ${driver.lastName} reported issues during pre-trip inspection for "${load.title || 'shipment'}": ${issueSummary}`,
        notificationType: NotificationType.CARGO_DAMAGE,
        priority: NotificationPriority.HIGH,
        entityId: load.id,
        actionUrl: this.inspectionActionUrl(load.id, recipientId, load),
        actionText: 'Review Issues',
        metadata: { inspectionId, issues },
      });
    }

    await this.safeNotify({
      recipientId: driver.userId,
      tenantId: load.tenantId,
      title: 'Inspection Submitted — Awaiting Resolution',
      message: `Your failed pre-trip inspection for "${load.title || 'shipment'}" has been submitted. Operations are blocked until the cargo owner or broker resolves the reported issues.`,
      notificationType: NotificationType.DRIVER_ALERT,
      priority: NotificationPriority.HIGH,
      entityId: load.id,
      actionUrl: '/dashboard/driver/cargo',
      actionText: 'View Inspection',
      metadata: { inspectionId },
    });
  }

  private async notifyInspectionApproved(
    load: Load,
    driver: Driver,
    inspectionId: string,
  ) {
    await this.safeNotify({
      recipientId: load.cargoOwnerId,
      tenantId: load.tenantId,
      title: 'Pre-Trip Inspection Approved',
      message: `Driver ${driver.firstName} ${driver.lastName} approved the pre-trip inspection for "${load.title || 'shipment'}". Loading may proceed.`,
      notificationType: NotificationType.CARGO_DELIVERY_UPDATE,
      priority: NotificationPriority.NORMAL,
      entityId: load.id,
      actionUrl: `/dashboard/customs-inspections/${load.id}`,
      actionText: 'View Inspection',
      metadata: { inspectionId },
    });

    await this.safeNotify({
      recipientId: driver.userId,
      tenantId: load.tenantId,
      title: 'Pre-Trip Inspection Approved',
      message: `Pre-trip inspection approved for "${load.title || 'shipment'}". You may now load cargo and start the trip.`,
      notificationType: NotificationType.DRIVER_ALERT,
      priority: NotificationPriority.NORMAL,
      entityId: load.id,
      actionUrl: '/dashboard/driver/cargo',
      actionText: 'Proceed to Loading',
      metadata: { inspectionId },
    });
  }

  private async notifyReadyForReInspection(
    load: Load,
    resolutionNotes?: string,
  ) {
    const driver = await this.driverRepository.findOne({
      where: { currentTruckId: load.assignedTruckId, tenantId: load.tenantId },
    });

    if (!driver) {
      return;
    }

    await this.safeNotify({
      recipientId: driver.userId,
      tenantId: load.tenantId,
      title: 'Ready for Re-Inspection',
      message: `Issues for "${load.title || 'shipment'}" have been resolved${resolutionNotes ? `: ${resolutionNotes}` : ''}. Please perform a re-inspection before loading.`,
      notificationType: NotificationType.CARGO_DELIVERY_UPDATE,
      priority: NotificationPriority.HIGH,
      entityId: load.id,
      actionUrl: '/dashboard/driver/inspection',
      actionText: 'Re-Inspect Cargo',
      metadata: { resolutionNotes },
    });
  }

  private async safeNotify(payload: {
    recipientId: string;
    tenantId: string;
    title: string;
    message: string;
    notificationType: NotificationType;
    priority: NotificationPriority;
    entityId: string;
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await this.notificationService.createNotification({
        recipientId: payload.recipientId,
        tenantId: payload.tenantId,
        title: payload.title,
        message: payload.message,
        notificationType: payload.notificationType,
        category: NotificationCategory.CARGO,
        priority: payload.priority,
        entityId: payload.entityId,
        entityType: EntityType.CARGO,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        actionUrl: payload.actionUrl,
        actionText: payload.actionText,
        metadata: payload.metadata,
      });
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }
}
