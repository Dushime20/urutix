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
  ApprovePreTripInspectionDto,
  SubmitPreTripInspectionDto,
} from './dto/pre-trip-inspection.dto';
import {
  getPreTripInspectionMetadata,
  isPreTripInspectionApproved,
  PRE_TRIP_INSPECTION_BLOCKED_MESSAGE,
  PreTripInspectionIssue,
  PreTripInspectionMetadata,
  PreTripInspectionWorkflowStatus,
  requiresPreTripOwnerResolution,
} from './pre-trip-inspection.types';
import { NotificationService } from '../notifications/notification.service';
import {
  EntityType,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '../../entities/notification.entity';
import { EventsGateway } from '../events/events.gateway';

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
    private readonly eventsGateway: EventsGateway,
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
    let workflow = getPreTripInspectionMetadata(load.metadata);

    if (
      workflow.status === PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION
    ) {
      workflow = await this.persistPreTripWorkflow(load, {
        ...workflow,
        status: PreTripInspectionWorkflowStatus.IN_PROGRESS,
      });
    }

    const history = await this.getInspectionHistoryRecords(loadId);

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
          requiresPreTripOwnerResolution(workflow.status) ||
          workflow.status === PreTripInspectionWorkflowStatus.AWAITING_CARGO_OWNER_APPROVAL;

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
            approvedById: workflow.approvedById,
            approvalNotes: workflow.approvalNotes,
            submittedForApprovalAt: workflow.submittedForApprovalAt,
            lastFailedAt: workflow.lastFailedAt,
            resolutionNotes: workflow.resolutionNotes,
            readyForReInspectionAt: workflow.readyForReInspectionAt,
            resolvedAt: workflow.resolvedAt,
            resolvedById: workflow.resolvedById,
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
        workflow.status === PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION ||
        workflow.status === PreTripInspectionWorkflowStatus.FAILED
          ? 'This shipment is awaiting corrective action from the cargo owner or broker before you can re-inspect.'
          : workflow.status ===
              PreTripInspectionWorkflowStatus.AWAITING_CARGO_OWNER_APPROVAL
            ? 'This shipment is awaiting cargo owner or broker approval. You cannot submit another inspection yet.'
            : 'This shipment is not available for inspection at this time.',
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
          status: PreTripInspectionWorkflowStatus.AWAITING_CARGO_OWNER_APPROVAL,
          lastInspectionId: savedInspection.id,
          lastDriverUserId: driver.userId,
          submittedForApprovalAt: new Date().toISOString(),
          currentAttempt: attemptNumber,
        }
      : {
          status: PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION,
          lastInspectionId: savedInspection.id,
          lastDriverUserId: driver.userId,
          lastFailedAt: new Date().toISOString(),
          currentAttempt: attemptNumber,
        };

    await this.updateLoadWorkflow(load, nextWorkflow, dto, passed);

    if (passed) {
      await this.notifyInspectionSubmittedForApproval(
        load,
        driver,
        savedInspection.id,
      );
    } else {
      await this.notifyInspectionFailed(load, driver, savedInspection.id, issues);
    }

    return {
      inspection: savedInspection,
      workflowStatus: nextWorkflow.status,
      canProceed: false,
    };
  }

  async approvePreTripInspection(
    loadId: string,
    userId: string,
    tenantId: string,
    dto: ApprovePreTripInspectionDto,
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
      workflow.status !==
      PreTripInspectionWorkflowStatus.AWAITING_CARGO_OWNER_APPROVAL
    ) {
      throw new BadRequestException(
        'Only shipments with a submitted pre-trip inspection awaiting approval can be approved.',
      );
    }

    const nextWorkflow: PreTripInspectionMetadata = {
      ...workflow,
      status: PreTripInspectionWorkflowStatus.APPROVED,
      approvedAt: new Date().toISOString(),
      approvedById: userId,
      approvalNotes: dto.approvalNotes,
    };

    await this.loadRepository.update(loadId, {
      metadata: {
        ...(load.metadata || {}),
        preTripInspection: nextWorkflow,
        inspectionStatus: 'COMPLETED',
      } as Record<string, any>,
      updatedAt: new Date(),
    });

    const inspection = workflow.lastInspectionId
      ? await this.cargoInspectionRepository.findOne({
          where: { id: workflow.lastInspectionId, loadId },
        })
      : null;

    const driver = await this.resolveDriverForLoad(
      load,
      inspection,
      workflow.lastDriverUserId,
    );

    if (!driver) {
      this.logger.warn(
        `No driver found to notify for load ${loadId} pre-trip approval (truck=${load.assignedTruckId}, inspectionDriver=${inspection?.driverId}, lastDriverUserId=${workflow.lastDriverUserId})`,
      );
    }

    await this.notifyInspectionApproved(
      load,
      driver,
      workflow.lastInspectionId!,
      userId,
      dto.approvalNotes,
    );

    return {
      loadId,
      workflowStatus: nextWorkflow.status,
      driverNotified: Boolean(driver),
      message: driver
        ? 'Pre-trip inspection approved. Driver has been notified and may proceed with loading and trip start.'
        : 'Pre-trip inspection approved. Driver could not be resolved for notification — verify truck assignment.',
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
    if (!requiresPreTripOwnerResolution(workflow.status)) {
      throw new BadRequestException(
        'Only shipments awaiting corrective action can be released for re-inspection.',
      );
    }

    if (!dto.resolutionNotes?.trim()) {
      throw new BadRequestException(
        'Corrective action summary is required before releasing for re-inspection.',
      );
    }

    const inspection = workflow.lastInspectionId
      ? await this.cargoInspectionRepository.findOne({
          where: { id: workflow.lastInspectionId, loadId },
        })
      : (
          await this.cargoInspectionRepository.find({
            where: {
              loadId,
              inspectionType: CargoInspectionType.PRE_TRIP,
              decision: InspectionDecision.FAILED,
            },
            order: { createdAt: 'DESC' },
            take: 1,
          })
        )[0];

    if (!inspection) {
      throw new BadRequestException(
        'No failed inspection record found for this shipment.',
      );
    }

    const openIssues = (inspection.issues || []).filter((issue) => !issue.resolved);
    const resolvedIssueMap = new Map(
      (dto.resolvedIssues || []).map((item) => [item.issueId, item.correctiveAction]),
    );

    if (openIssues.length > 0) {
      const unresolvedIds = openIssues
        .filter((issue) => !resolvedIssueMap.has(issue.id))
        .map((issue) => issue.id);

      if (unresolvedIds.length > 0) {
        throw new BadRequestException(
          'All reported issues must be acknowledged before releasing for re-inspection.',
        );
      }
    }

    const resolvedAt = new Date().toISOString();
    const updatedIssues = (inspection.issues || []).map((issue) => {
      const correctiveAction = resolvedIssueMap.get(issue.id);
      if (!correctiveAction && !resolvedIssueMap.has(issue.id)) {
        return issue;
      }

      return {
        ...issue,
        resolved: true,
        resolutionNotes:
          correctiveAction?.trim() || dto.resolutionNotes.trim(),
      };
    });

    await this.cargoInspectionRepository.update(inspection.id, {
      issues: updatedIssues,
      updatedAt: new Date(),
    });

    const nextWorkflow: PreTripInspectionMetadata = {
      ...workflow,
      status: PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION,
      resolutionNotes: dto.resolutionNotes.trim(),
      readyForReInspectionAt: resolvedAt,
      resolvedAt,
      resolvedById: userId,
    };

    await this.persistPreTripWorkflow(
      load,
      nextWorkflow,
      'READY_FOR_RE_INSPECTION',
    );

    await this.notifyReadyForReInspection(
      load,
      inspection,
      dto.resolutionNotes.trim(),
      userId,
      openIssues.length,
    );

    return {
      loadId,
      workflowStatus: nextWorkflow.status,
      inspectionId: inspection.id,
      resolvedIssueCount: openIssues.length,
      message:
        'Corrective actions recorded. Driver has been notified to perform re-inspection.',
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

  private async persistPreTripWorkflow(
    load: Load,
    workflow: PreTripInspectionMetadata,
    inspectionStatus?: string,
  ): Promise<PreTripInspectionMetadata> {
    const nextMetadata = {
      ...(load.metadata || {}),
      preTripInspection: {
        ...(load.metadata?.preTripInspection || {}),
        ...workflow,
        status: workflow.status,
      },
      inspectionStatus: inspectionStatus ?? workflow.status,
    };

    await this.loadRepository.update(load.id, {
      metadata: nextMetadata as Record<string, any>,
      updatedAt: new Date(),
    });

    load.metadata = nextMetadata;
    return getPreTripInspectionMetadata(nextMetadata);
  }

  private async updateLoadWorkflow(
    load: Load,
    workflow: PreTripInspectionMetadata,
    dto: SubmitPreTripInspectionDto,
    passed: boolean,
  ) {
    await this.persistPreTripWorkflow(
      load,
      workflow,
      passed ? 'COMPLETED' : 'FAILED',
    );

    await this.loadRepository.update(load.id, {
      metadata: {
        ...(load.metadata || {}),
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

  private getOwnerRecipientIds(load: Load): string[] {
    return [
      ...new Set([load.cargoOwnerId, load.brokerId].filter(Boolean)),
    ] as string[];
  }

  private async getUserDisplayName(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!user) return 'User';
    const profile = user.profile;
    const name = profile
      ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
      : '';
    return name || user.email || 'User';
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
    const shipmentLabel = load.title || 'shipment';
    const driverName = `${driver.firstName} ${driver.lastName}`.trim();
    const event = 'PRE_TRIP_FAILED';

    for (const recipientId of this.getOwnerRecipientIds(load)) {
      await this.safeNotify({
        recipientId,
        tenantId: load.tenantId,
        title: 'Pre-Trip Inspection Failed — Action Required',
        message: `Driver ${driverName} reported issues during pre-trip inspection for "${shipmentLabel}": ${issueSummary}. Please review and resolve so the driver can re-inspect.`,
        shortMessage: `Pre-trip failed for "${shipmentLabel}" — action required.`,
        notificationType: NotificationType.PRE_TRIP_FAILED,
        priority: NotificationPriority.HIGH,
        entityId: load.id,
        actionUrl: this.inspectionActionUrl(load.id, recipientId, load),
        actionText: 'Review & Resolve',
        metadata: {
          loadId: load.id,
          inspectionId,
          issues,
          event,
          workflowStatus: PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION,
        },
        requiresAction: true,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
        ],
      });
    }

    await this.safeNotify({
      recipientId: driver.userId,
      tenantId: load.tenantId,
      title: 'Inspection Failed — Submitted to Cargo Owner',
      message: `Your failed pre-trip inspection for "${shipmentLabel}" has been submitted. The cargo owner and broker have been notified. Operations are blocked until they resolve the reported issues.`,
      shortMessage: `Pre-trip failed for "${shipmentLabel}" — awaiting owner resolution.`,
      notificationType: NotificationType.PRE_TRIP_FAILED,
      priority: NotificationPriority.HIGH,
      entityId: load.id,
      actionUrl: '/dashboard/driver/inspection',
      actionText: 'View Status',
      metadata: {
        loadId: load.id,
        inspectionId,
        issues,
        event,
        workflowStatus: PreTripInspectionWorkflowStatus.AWAITING_RESOLUTION,
      },
      channels: [
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
        NotificationChannel.EMAIL,
      ],
    });
  }

  private async notifyInspectionSubmittedForApproval(
    load: Load,
    driver: Driver,
    inspectionId: string,
  ) {
    const shipmentLabel = load.title || 'shipment';
    const driverName = `${driver.firstName} ${driver.lastName}`.trim();
    const event = 'PRE_TRIP_SUBMITTED';

    for (const recipientId of this.getOwnerRecipientIds(load)) {
      await this.safeNotify({
        recipientId,
        tenantId: load.tenantId,
        title: 'Pre-Trip Inspection Submitted — Approval Required',
        message: `Driver ${driverName} completed the pre-trip inspection for "${shipmentLabel}" with no blocking issues. Please review and give the green light to start shipping.`,
        shortMessage: `Approve pre-trip for "${shipmentLabel}" to clear shipping.`,
        notificationType: NotificationType.PRE_TRIP_SUBMITTED,
        priority: NotificationPriority.HIGH,
        entityId: load.id,
        actionUrl: this.inspectionActionUrl(load.id, recipientId, load),
        actionText: 'Review & Approve',
        metadata: {
          loadId: load.id,
          inspectionId,
          event,
          workflowStatus:
            PreTripInspectionWorkflowStatus.AWAITING_CARGO_OWNER_APPROVAL,
        },
        requiresAction: true,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
        ],
      });
    }

    await this.safeNotify({
      recipientId: driver.userId,
      tenantId: load.tenantId,
      title: 'Pre-Trip Inspection Submitted — Awaiting Approval',
      message: `Your pre-trip inspection for "${shipmentLabel}" has been submitted. The cargo owner and broker have been notified. You will be alerted once they give the green light to start shipping.`,
      shortMessage: `Awaiting approval for "${shipmentLabel}" pre-trip inspection.`,
      notificationType: NotificationType.PRE_TRIP_SUBMITTED,
      priority: NotificationPriority.NORMAL,
      entityId: load.id,
      actionUrl: '/dashboard/driver/inspection',
      actionText: 'View Status',
      metadata: {
        loadId: load.id,
        inspectionId,
        event,
        workflowStatus:
          PreTripInspectionWorkflowStatus.AWAITING_CARGO_OWNER_APPROVAL,
      },
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    });
  }

  private async notifyInspectionApproved(
    load: Load,
    driver: Driver | null,
    inspectionId: string,
    approvedById: string,
    approvalNotes?: string,
  ) {
    const approverName = await this.getUserDisplayName(approvedById);
    const shipmentLabel = load.title || 'shipment';
    const notesSuffix = approvalNotes ? ` Notes: ${approvalNotes}` : '';
    const event = 'PRE_TRIP_APPROVED';
    const driverNotified = Boolean(driver);

    if (driver) {
      await this.safeNotify({
        recipientId: driver.userId,
        tenantId: load.tenantId,
        title: 'Green Light — You May Start Shipping',
        message: `${approverName} approved the pre-trip inspection for "${shipmentLabel}". You may now load cargo and start the trip.${notesSuffix}`,
        shortMessage: `Green light for "${shipmentLabel}" — you may start shipping.`,
        notificationType: NotificationType.PRE_TRIP_APPROVED,
        priority: NotificationPriority.HIGH,
        entityId: load.id,
        actionUrl: '/dashboard/driver/cargo',
        actionText: 'Proceed to Loading',
        metadata: {
          loadId: load.id,
          inspectionId,
          approvedById,
          approvalNotes,
          event,
          workflowStatus: PreTripInspectionWorkflowStatus.APPROVED,
        },
        requiresAction: true,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
          NotificationChannel.SMS,
        ],
      });
    }

    for (const recipientId of this.getOwnerRecipientIds(load)) {
      const isApprover = recipientId === approvedById;
      await this.safeNotify({
        recipientId,
        tenantId: load.tenantId,
        title: isApprover
          ? driverNotified
            ? 'Pre-Trip Inspection Approved — Driver Notified'
            : 'Pre-Trip Inspection Approved — Driver Notify Failed'
          : 'Pre-Trip Inspection Approved — Shipping Cleared',
        message: isApprover
          ? driverNotified
            ? `You approved the pre-trip inspection for "${shipmentLabel}". The driver has been notified they may load cargo and start the trip.${notesSuffix}`
            : `You approved the pre-trip inspection for "${shipmentLabel}". Shipping is cleared, but the assigned driver could not be resolved for notification — verify truck assignment.${notesSuffix}`
          : driverNotified
            ? `${approverName} approved the pre-trip inspection for "${shipmentLabel}". The driver has been notified they may proceed.${notesSuffix}`
            : `${approverName} approved the pre-trip inspection for "${shipmentLabel}". Shipping is cleared; driver notification could not be delivered automatically.${notesSuffix}`,
        shortMessage: `Pre-trip approved for "${shipmentLabel}".`,
        notificationType: NotificationType.PRE_TRIP_APPROVED,
        priority: NotificationPriority.NORMAL,
        entityId: load.id,
        actionUrl: this.inspectionActionUrl(load.id, recipientId, load),
        actionText: 'View Inspection',
        metadata: {
          loadId: load.id,
          inspectionId,
          approvedById,
          approvalNotes,
          driverNotified,
          event,
          workflowStatus: PreTripInspectionWorkflowStatus.APPROVED,
        },
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });
    }
  }

  private async resolveDriverForLoad(
    load: Load,
    inspection?: CargoInspection | null,
    lastDriverUserId?: string | null,
  ): Promise<Driver | null> {
    if (load.assignedTruckId) {
      const driverByTruck = await this.driverRepository.findOne({
        where: { currentTruckId: load.assignedTruckId, tenantId: load.tenantId },
      });
      if (driverByTruck) {
        return driverByTruck;
      }
    }

    const candidateUserIds = [
      inspection?.driverId,
      lastDriverUserId,
    ].filter(Boolean) as string[];

    for (const userId of candidateUserIds) {
      const driverByUser = await this.driverRepository.findOne({
        where: { userId, tenantId: load.tenantId },
      });
      if (driverByUser) {
        return driverByUser;
      }

      // Defensive: some historical rows may store driver entity id
      const driverById = await this.driverRepository.findOne({
        where: { id: userId, tenantId: load.tenantId },
      });
      if (driverById) {
        return driverById;
      }
    }

    return null;
  }

  private async notifyReadyForReInspection(
    load: Load,
    inspection: CargoInspection,
    resolutionNotes: string,
    resolvedById: string,
    resolvedIssueCount: number,
  ) {
    const resolverName = await this.getUserDisplayName(resolvedById);
    const shipmentLabel = load.title || 'shipment';
    const issueLabel =
      resolvedIssueCount === 1
        ? '1 reported issue'
        : `${resolvedIssueCount} reported issues`;
    const event = 'PRE_TRIP_READY_FOR_RE_INSPECTION';
    const workflow = getPreTripInspectionMetadata(load.metadata);

    const driver = await this.resolveDriverForLoad(
      load,
      inspection,
      workflow.lastDriverUserId,
    );
    const driverNotified = Boolean(driver);

    if (driver) {
      await this.safeNotify({
        recipientId: driver.userId,
        tenantId: load.tenantId,
        title: 'Issues Resolved — Re-Inspection Required',
        message: `${resolverName} resolved ${issueLabel} for "${shipmentLabel}". Corrective actions: ${resolutionNotes}. Please perform a new pre-trip inspection before loading.`,
        shortMessage: `Re-inspect "${shipmentLabel}" — issues resolved by cargo owner.`,
        notificationType: NotificationType.PRE_TRIP_READY_FOR_RE_INSPECTION,
        priority: NotificationPriority.HIGH,
        entityId: load.id,
        actionUrl: '/dashboard/driver/inspection',
        actionText: 'Start Re-Inspection',
        metadata: {
          loadId: load.id,
          inspectionId: inspection.id,
          resolutionNotes,
          resolvedById,
          resolvedIssueCount,
          workflowStatus: PreTripInspectionWorkflowStatus.READY_FOR_RE_INSPECTION,
          event,
        },
        requiresAction: true,
        channels: [
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
          NotificationChannel.SMS,
        ],
      });
    } else {
      this.logger.warn(
        `No driver found to notify for load ${load.id} re-inspection release (truck=${load.assignedTruckId}, inspectionDriver=${inspection.driverId}, lastDriverUserId=${workflow.lastDriverUserId})`,
      );
    }

    for (const recipientId of this.getOwnerRecipientIds(load)) {
      const isResolver = recipientId === resolvedById;
      await this.safeNotify({
        recipientId,
        tenantId: load.tenantId,
        title: isResolver
          ? driverNotified
            ? 'Resolution Submitted — Driver Notified'
            : 'Resolution Submitted — Driver Notify Failed'
          : 'Inspection Issues Resolved — Re-Inspection Pending',
        message: isResolver
          ? driverNotified
            ? `You marked ${issueLabel} for "${shipmentLabel}" as resolved. The driver has been notified to re-inspect.`
            : `You marked ${issueLabel} for "${shipmentLabel}" as resolved. The driver could not be resolved for notification — verify truck assignment.`
          : driverNotified
            ? `${resolverName} resolved ${issueLabel} for "${shipmentLabel}". The driver will perform a re-inspection.`
            : `${resolverName} resolved ${issueLabel} for "${shipmentLabel}". Driver notification could not be delivered automatically.`,
        shortMessage: `Re-inspection pending for "${shipmentLabel}".`,
        notificationType: NotificationType.PRE_TRIP_READY_FOR_RE_INSPECTION,
        priority: NotificationPriority.NORMAL,
        entityId: load.id,
        actionUrl: this.inspectionActionUrl(load.id, recipientId, load),
        actionText: 'View Inspection',
        metadata: {
          loadId: load.id,
          resolutionNotes,
          resolvedById,
          resolvedIssueCount,
          driverNotified,
          event,
        },
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      });
    }
  }

  private async safeNotify(payload: {
    recipientId: string;
    tenantId: string;
    title: string;
    message: string;
    shortMessage?: string;
    notificationType: NotificationType;
    priority: NotificationPriority;
    entityId: string;
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, any>;
    requiresAction?: boolean;
    channels?: NotificationChannel[];
  }) {
    try {
      const recipient = await this.userRepository.findOne({
        where: { id: payload.recipientId },
      });
      const recipientEmail = recipient?.email?.trim() || undefined;
      const recipientPhone = recipient?.phone?.trim() || undefined;

      const requestedChannels =
        payload.channels ??
        [NotificationChannel.IN_APP, NotificationChannel.PUSH];

      const channels = requestedChannels.filter((channel) => {
        if (channel === NotificationChannel.EMAIL) {
          return Boolean(recipientEmail);
        }
        if (channel === NotificationChannel.SMS) {
          return Boolean(recipientPhone);
        }
        return true;
      });

      const metadata = {
        ...(payload.metadata || {}),
        ...(recipientEmail ? { recipientEmail } : {}),
        ...(recipientPhone ? { recipientPhone } : {}),
      };

      const saved = await this.notificationService.createNotification({
        recipientId: payload.recipientId,
        tenantId: payload.tenantId,
        title: payload.title,
        message: payload.message,
        shortMessage: payload.shortMessage,
        notificationType: payload.notificationType,
        category: NotificationCategory.CARGO,
        priority: payload.priority,
        entityId: payload.entityId,
        entityType: EntityType.CARGO,
        channels,
        actionUrl: payload.actionUrl,
        actionText: payload.actionText,
        metadata,
        requiresAction: payload.requiresAction ?? false,
      });

      this.eventsGateway.emitNotification(payload.recipientId, {
        ...saved,
        type: payload.notificationType,
        notificationType: payload.notificationType,
        title: payload.title,
        message: payload.message,
        metadata,
        data: metadata,
      });
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }
}
