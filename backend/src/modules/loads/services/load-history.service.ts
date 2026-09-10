import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load, LoadStatus } from '../../../entities/load.entity';
import {
  AuditEvent,
  AuditAction,
  AuditEntityType,
} from '../../../entities/audit-event.entity';
import { Bid, BidStatus } from '../../../entities/bid.entity';
import { Trip, TripStatus } from '../../../entities/trip.entity';
import {
  CargoInspection,
  CargoInspectionType,
  InspectionStatus,
} from '../../../entities/cargo-inspection.entity';
import { BrokerCommission } from '../../../entities/broker-commission.entity';
import {
  TripEvent,
  TripEventType,
} from '../../tracking/entities/trip-event.entity';
import { User } from '../../../entities/user.entity';
import { UserProfile } from '../../../entities/user-profile.entity';
import {
  CargoHistoryActivityType,
  CargoHistoryItemDto,
  CargoHistoryResponseDto,
} from '../dto/cargo-history.dto';

@Injectable()
export class LoadHistoryService {
  private readonly logger = new Logger(LoadHistoryService.name);

  constructor(
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(CargoInspection)
    private readonly cargoInspectionRepository: Repository<CargoInspection>,
    @InjectRepository(BrokerCommission)
    private readonly brokerCommissionRepository: Repository<BrokerCommission>,
    @InjectRepository(TripEvent)
    private readonly tripEventRepository: Repository<TripEvent>,
  ) {}

  async getHistory(
    loadId: string,
    tenantId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<CargoHistoryResponseDto> {
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 50));

    try {
    const load = await this.findLoadForHistory(loadId, tenantId);
    if (!load) {
      return { items: [], total: 0, page: pageNum, limit: limitNum };
    }

    // Explicit column lists — production often lags entity columns
    // (trip delay*/geometry, KYC profile fields, extra audit columns).
    // SELECT * / nested relations 500 the whole History tab.
    const [auditEvents, bids, trips, inspections, commissions] =
      await Promise.all([
        this.firstSuccessful('audit events', [
          () =>
            this.auditEventRepository
              .createQueryBuilder('event')
              .select([
                'event.id',
                'event.loadId',
                'event.entityType',
                'event.entityId',
                'event.action',
                'event.actorId',
                'event.actorName',
                'event.actorRole',
                'event.description',
                'event.reason',
                'event.before',
                'event.after',
                'event.changes',
                'event.metadata',
                'event.createdAt',
              ])
              .where('event.loadId = :loadId', { loadId })
              .orderBy('event.createdAt', 'DESC')
              .getMany(),
          () =>
            this.auditEventRepository
              .createQueryBuilder('event')
              .select([
                'event.id',
                'event.loadId',
                'event.entityType',
                'event.entityId',
                'event.action',
                'event.actorId',
                'event.description',
                'event.metadata',
                'event.createdAt',
              ])
              .where('event.loadId = :loadId', { loadId })
              .orderBy('event.createdAt', 'DESC')
              .getMany(),
        ]),
        this.firstSuccessful('bids', [
          () =>
            this.bidRepository
              .createQueryBuilder('bid')
              .select([
                'bid.id',
                'bid.loadId',
                'bid.truckOwnerId',
                'bid.bidAmount',
                'bid.bidCurrency',
                'bid.status',
                'bid.createdAt',
                'bid.updatedAt',
              ])
              .where('bid.loadId = :loadId', { loadId })
              .andWhere('bid.deletedAt IS NULL')
              .orderBy('bid.createdAt', 'DESC')
              .getMany(),
          () =>
            this.bidRepository
              .createQueryBuilder('bid')
              .select([
                'bid.id',
                'bid.loadId',
                'bid.truckOwnerId',
                'bid.bidAmount',
                'bid.bidCurrency',
                'bid.status',
                'bid.createdAt',
                'bid.updatedAt',
              ])
              .where('bid.loadId = :loadId', { loadId })
              .orderBy('bid.createdAt', 'DESC')
              .getMany(),
        ]),
        this.firstSuccessful('trips', [
          () =>
            this.tripRepository
              .createQueryBuilder('trip')
              .select([
                'trip.id',
                'trip.loadId',
                'trip.driverId',
                'trip.tripNumber',
                'trip.status',
                'trip.actualStartTime',
                'trip.actualEndTime',
                'trip.completedAt',
                'trip.createdAt',
                'trip.updatedAt',
              ])
              .where('trip.loadId = :loadId', { loadId })
              .orderBy('trip.createdAt', 'DESC')
              .getMany(),
          () =>
            this.tripRepository
              .createQueryBuilder('trip')
              .select([
                'trip.id',
                'trip.loadId',
                'trip.driverId',
                'trip.tripNumber',
                'trip.status',
                'trip.actualStartTime',
                'trip.actualEndTime',
                'trip.createdAt',
                'trip.updatedAt',
              ])
              .where('trip.loadId = :loadId', { loadId })
              .orderBy('trip.createdAt', 'DESC')
              .getMany(),
        ]),
        this.firstSuccessful('inspections', [
          () =>
            this.cargoInspectionRepository
              .createQueryBuilder('inspection')
              .select([
                'inspection.id',
                'inspection.loadId',
                'inspection.inspectionType',
                'inspection.driverId',
                'inspection.receiverId',
                'inspection.status',
                'inspection.decision',
                'inspection.attemptNumber',
                'inspection.createdAt',
                'inspection.completedAt',
              ])
              .where('inspection.loadId = :loadId', { loadId })
              .orderBy('inspection.createdAt', 'DESC')
              .getMany(),
        ]),
        this.firstSuccessful('commissions', [
          () =>
            this.brokerCommissionRepository
              .createQueryBuilder('commission')
              .select([
                'commission.id',
                'commission.loadId',
                'commission.brokerId',
                'commission.commissionRate',
                'commission.commissionAmount',
                'commission.createdAt',
              ])
              .where('commission.loadId = :loadId', { loadId })
              .orderBy('commission.createdAt', 'ASC')
              .getMany(),
        ]),
      ]);

    const tripIds = trips.map((t) => t.id);
    const tripEvents =
      tripIds.length > 0
        ? await this.firstSuccessful('trip events', [
            () =>
              this.tripEventRepository
                .createQueryBuilder('te')
                .select([
                  'te.id',
                  'te.tripId',
                  'te.driverId',
                  'te.type',
                  'te.title',
                  'te.description',
                  'te.createdAt',
                  'te.metadata',
                ])
                .where('te.tripId IN (:...tripIds)', { tripIds })
                .orderBy('te.createdAt', 'DESC')
                .getMany(),
            () =>
              this.tripEventRepository
                .createQueryBuilder('te')
                .select([
                  'te.id',
                  'te.tripId',
                  'te.driverId',
                  'te.type',
                  'te.title',
                  'te.description',
                  'te.createdAt',
                ])
                .where('te.tripId IN (:...tripIds)', { tripIds })
                .orderBy('te.createdAt', 'DESC')
                .getMany(),
          ])
        : [];

    const actorNames = await this.loadActorNames([
      load.cargoOwnerId,
      load.brokerId,
      load.assignedCarrierId,
      ...bids.map((b) => b.truckOwnerId),
      ...commissions.map((c) => c.brokerId),
      ...inspections.map((i) => i.driverId || i.receiverId),
      ...trips.map((t) => t.driverId),
      ...tripEvents.map((te) => te.driverId),
      ...auditEvents.map((e) => e.actorId),
    ]);

    const items: CargoHistoryItemDto[] = [];
    const seenKeys = new Set<string>();

    const pushUnique = (item: CargoHistoryItemDto, dedupeKeys: string[]) => {
      for (const key of dedupeKeys) {
        if (seenKeys.has(key)) return;
      }
      dedupeKeys.forEach((k) => seenKeys.add(k));
      items.push(item);
    };

    // 1. Audit events (canonical when present) — never collapse distinct audits
    for (const event of auditEvents) {
      try {
        const mapped = this.mapAuditEvent(event);
        if (!mapped) continue;
        if (!mapped.actorName && event.actorId) {
          mapped.actorName = actorNames.get(event.actorId);
        }
        pushUnique(mapped, [`audit:${event.id}`]);
      } catch (err: any) {
        this.logger.warn(`Skipping audit event ${event.id}: ${err?.message}`);
      }
    }

    // 2. Load lifecycle timestamps
    const createdAtIso = this.toIso(load.createdAt);
    if (createdAtIso) {
      pushUnique(
        {
          id: `load-created-${load.id}`,
          activityType: 'created',
          action: AuditAction.CREATE,
          title: 'Cargo created',
          description: load.title
            ? `Cargo "${load.title}" was created`
            : 'Cargo was created',
          actorId: load.cargoOwnerId,
          actorName: actorNames.get(load.cargoOwnerId),
          createdAt: createdAtIso,
          source: 'load',
          entityType: AuditEntityType.LOAD,
          entityId: load.id,
          metadata: { status: LoadStatus.DRAFT },
        },
        [`load:created:${load.id}`, 'activity:created'],
      );
    }

    const publishedAtIso = this.toIso(load.publishedAt);
    if (publishedAtIso) {
      pushUnique(
        {
          id: `load-published-${load.id}`,
          activityType: 'published',
          action: AuditAction.PUBLISH,
          title: 'Cargo published',
          description: 'Cargo was published and made available for matching',
          actorId: load.cargoOwnerId,
          actorName: actorNames.get(load.cargoOwnerId),
          createdAt: publishedAtIso,
          source: 'load',
          entityType: AuditEntityType.LOAD,
          entityId: load.id,
        },
        [`load:published:${load.id}`, 'activity:published'],
      );
    }

    // 3. Broker assignment via commission records (accurate timestamps)
    for (const commission of commissions) {
      const createdAt = this.toIso(commission.createdAt);
      if (!createdAt) continue;
      const brokerName = actorNames.get(commission.brokerId);
      pushUnique(
        {
          id: `broker-assign-${commission.id}`,
          activityType: 'broker_assigned',
          action: AuditAction.ASSIGN,
          title: 'Cargo assigned to broker',
          description: brokerName
            ? `Cargo assigned to broker ${brokerName}`
            : 'Cargo assigned to a broker',
          actorName: brokerName,
          actorId: commission.brokerId,
          createdAt,
          source: 'commission',
          entityType: AuditEntityType.LOAD,
          entityId: load.id,
          metadata: {
            brokerId: commission.brokerId,
            commissionRate: commission.commissionRate,
            commissionAmount: commission.commissionAmount,
            activityType: 'broker_assigned',
          },
        },
        [
          `commission:assign:${commission.id}`,
          `broker:assign:${commission.brokerId}:${createdAt}`,
        ],
      );
    }

    // Fallback: broker currently assigned but no commission row
    if (load.brokerId && commissions.length === 0) {
      const createdAt = this.toIso(load.updatedAt, load.createdAt);
      if (createdAt) {
        const brokerName = actorNames.get(load.brokerId);
        pushUnique(
          {
            id: `broker-assign-fallback-${load.id}`,
            activityType: 'broker_assigned',
            action: AuditAction.ASSIGN,
            title: 'Cargo assigned to broker',
            description: brokerName
              ? `Cargo assigned to broker ${brokerName}`
              : 'Cargo assigned to a broker',
            actorName: brokerName,
            actorId: load.brokerId,
            createdAt,
            source: 'load',
            entityType: AuditEntityType.LOAD,
            entityId: load.id,
            metadata: {
              brokerId: load.brokerId,
              activityType: 'broker_assigned',
              approximate: true,
            },
          },
          [`broker:assign:fallback:${load.id}`],
        );
      }
    }

    // 4. Bids
    for (const bid of bids) {
      const submittedAt = this.toIso(bid.createdAt);
      if (!submittedAt) continue;
      const bidderName = actorNames.get(bid.truckOwnerId);
      const amountLabel = `${bid.bidCurrency || 'USD'} ${Number(bid.bidAmount).toLocaleString()}`;

      pushUnique(
        {
          id: `bid-submitted-${bid.id}`,
          activityType: 'bid_submitted',
          action: AuditAction.CREATE,
          title: 'Bid submitted',
          description: bidderName
            ? `${bidderName} submitted a bid of ${amountLabel}`
            : `A bid of ${amountLabel} was submitted`,
          actorId: bid.truckOwnerId,
          actorName: bidderName,
          createdAt: submittedAt,
          source: 'bid',
          entityType: AuditEntityType.BID,
          entityId: bid.id,
          metadata: {
            bidAmount: bid.bidAmount,
            bidCurrency: bid.bidCurrency,
            status: bid.status,
            activityType: 'bid_submitted',
          },
        },
        [`bid:submit:${bid.id}`],
      );

      const decidedAt = this.toIso(bid.updatedAt, bid.createdAt);
      if (bid.status === BidStatus.ACCEPTED && decidedAt) {
        pushUnique(
          {
            id: `bid-accepted-${bid.id}`,
            activityType: 'bid_accepted',
            action: AuditAction.ASSIGN,
            title: 'Bid accepted / won',
            description: bidderName
              ? `Bid from ${bidderName} for ${amountLabel} was accepted`
              : `Winning bid of ${amountLabel} was accepted`,
            actorId: bid.truckOwnerId,
            actorName: bidderName,
            createdAt: decidedAt,
            source: 'bid',
            entityType: AuditEntityType.BID,
            entityId: bid.id,
            metadata: {
              bidAmount: bid.bidAmount,
              bidCurrency: bid.bidCurrency,
              activityType: 'bid_accepted',
            },
          },
          [`bid:accept:${bid.id}`],
        );
      } else if (bid.status === BidStatus.REJECTED && decidedAt) {
        pushUnique(
          {
            id: `bid-rejected-${bid.id}`,
            activityType: 'bid_rejected',
            action: AuditAction.UPDATE,
            title: 'Bid rejected',
            description: bidderName
              ? `Bid from ${bidderName} was rejected`
              : 'A bid was rejected',
            actorId: bid.truckOwnerId,
            actorName: bidderName,
            createdAt: decidedAt,
            source: 'bid',
            entityType: AuditEntityType.BID,
            entityId: bid.id,
            metadata: { activityType: 'bid_rejected' },
          },
          [`bid:reject:${bid.id}`],
        );
      } else if (bid.status === BidStatus.WITHDRAWN && decidedAt) {
        pushUnique(
          {
            id: `bid-withdrawn-${bid.id}`,
            activityType: 'bid_withdrawn',
            action: AuditAction.UPDATE,
            title: 'Bid withdrawn',
            description: bidderName
              ? `${bidderName} withdrew their bid`
              : 'A bid was withdrawn',
            actorId: bid.truckOwnerId,
            actorName: bidderName,
            createdAt: decidedAt,
            source: 'bid',
            entityType: AuditEntityType.BID,
            entityId: bid.id,
            metadata: { activityType: 'bid_withdrawn' },
          },
          [`bid:withdraw:${bid.id}`],
        );
      }
    }

    // 5. Carrier assignment from load fields
    if (load.assignedCarrierId && load.status !== LoadStatus.DRAFT) {
      const createdAt = this.toIso(load.updatedAt, load.createdAt);
      if (createdAt) {
        const carrierName = actorNames.get(load.assignedCarrierId);
        pushUnique(
          {
            id: `carrier-assigned-${load.id}`,
            activityType: 'carrier_assigned',
            action: AuditAction.ASSIGN,
            title: 'Carrier assigned',
            description: carrierName
              ? `Cargo assigned to carrier ${carrierName}`
              : 'Carrier was assigned to this cargo',
            actorId: load.assignedCarrierId,
            actorName: carrierName,
            createdAt,
            source: 'load',
            entityType: AuditEntityType.LOAD,
            entityId: load.id,
            metadata: {
              assignedCarrierId: load.assignedCarrierId,
              assignedTruckId: load.assignedTruckId,
              activityType: 'carrier_assigned',
              approximate: true,
            },
          },
          [`carrier:assign:${load.id}:${load.assignedCarrierId}`],
        );
      }
    }

    // 6. Inspections
    for (const inspection of inspections) {
      const inspectorId = inspection.driverId || inspection.receiverId;
      const inspectorName = inspectorId
        ? actorNames.get(inspectorId)
        : undefined;
      const typeLabel =
        inspection.inspectionType === CargoInspectionType.PRE_TRIP
          ? 'Pre-trip cargo inspection'
          : 'Delivery inspection';

      const startedAt = this.toIso(inspection.createdAt);
      if (startedAt) {
        pushUnique(
          {
            id: `inspection-started-${inspection.id}`,
            activityType: 'inspection_started',
            action: AuditAction.STATUS_CHANGE,
            title: `${typeLabel} started`,
            description: inspectorName
              ? `${typeLabel} started by ${inspectorName}`
              : `${typeLabel} started`,
            actorId: inspectorId,
            actorName: inspectorName,
            createdAt: startedAt,
            source: 'inspection',
            entityType: AuditEntityType.LOAD,
            entityId: inspection.id,
            metadata: {
              inspectionType: inspection.inspectionType,
              attemptNumber: inspection.attemptNumber,
              activityType: 'inspection_started',
            },
          },
          [`inspection:start:${inspection.id}`],
        );
      }

      const completedAt = this.toIso(inspection.completedAt);
      if (completedAt) {
        const isFailed =
          inspection.status === InspectionStatus.FAILED ||
          inspection.decision === 'FAILED';
        const isApproved = inspection.status === InspectionStatus.APPROVED;

        pushUnique(
          {
            id: `inspection-completed-${inspection.id}`,
            activityType: isFailed
              ? 'inspection_failed'
              : isApproved
                ? 'inspection_approved'
                : 'inspection_submitted',
            action: AuditAction.STATUS_CHANGE,
            title: isFailed
              ? `${typeLabel} failed`
              : isApproved
                ? `${typeLabel} approved`
                : `${typeLabel} completed`,
            description: inspectorName
              ? `${typeLabel} ${isFailed ? 'failed' : isApproved ? 'approved' : 'completed'} by ${inspectorName}`
              : `${typeLabel} ${isFailed ? 'failed' : isApproved ? 'approved' : 'completed'}`,
            actorId: inspectorId,
            actorName: inspectorName,
            createdAt: completedAt,
            source: 'inspection',
            entityType: AuditEntityType.LOAD,
            entityId: inspection.id,
            metadata: {
              inspectionType: inspection.inspectionType,
              status: inspection.status,
              decision: inspection.decision,
              attemptNumber: inspection.attemptNumber,
              activityType: isFailed
                ? 'inspection_failed'
                : isApproved
                  ? 'inspection_approved'
                  : 'inspection_submitted',
            },
          },
          [`inspection:complete:${inspection.id}`],
        );
      }
    }

    // Pre-trip metadata timestamps (truck inspection / approval)
    const preTrip = (load.metadata as any)?.preTripInspection;
    const truckInspectionAt = this.toIso(preTrip?.truckInspection?.completedAt);
    if (truckInspectionAt) {
      pushUnique(
        {
          id: `truck-inspection-${load.id}-${preTrip.truckInspection.completedAt}`,
          activityType: 'inspection_started',
          action: AuditAction.STATUS_CHANGE,
          title: 'Truck inspection completed',
          description: 'Pre-trip truck inspection was completed',
          actorId: preTrip.truckInspection.completedById,
          actorName: actorNames.get(preTrip.truckInspection.completedById),
          createdAt: truckInspectionAt,
          source: 'load',
          entityType: AuditEntityType.LOAD,
          entityId: load.id,
          metadata: { activityType: 'inspection_started', step: 'truck' },
        },
        [`truck-inspection:${load.id}:${preTrip.truckInspection.completedAt}`],
      );
    }
    const approvedAt = this.toIso(preTrip?.approvedAt);
    if (approvedAt) {
      pushUnique(
        {
          id: `inspection-approved-meta-${load.id}`,
          activityType: 'inspection_approved',
          action: AuditAction.STATUS_CHANGE,
          title: 'Pre-trip inspection approved',
          description: 'Cargo owner/broker approved the pre-trip inspection',
          actorId: preTrip.approvedById,
          actorName: actorNames.get(preTrip.approvedById),
          createdAt: approvedAt,
          source: 'load',
          entityType: AuditEntityType.LOAD,
          entityId: load.id,
          metadata: { activityType: 'inspection_approved' },
        },
        [`inspection:approved:meta:${load.id}`],
      );
    }

    // 7. Loading (LOADED status) — approximate from trip start or updatedAt if no audit
    if (
      [LoadStatus.LOADED, LoadStatus.IN_TRANSIT, LoadStatus.DELIVERED, LoadStatus.COMPLETED, LoadStatus.CLOSED].includes(
        load.status,
      )
    ) {
      const loadingIso = this.toIso(
        trips.find((t) => t.actualStartTime)?.actualStartTime ||
          trips[0]?.createdAt ||
          load.updatedAt,
        load.createdAt,
      );
      if (loadingIso) {
        pushUnique(
          {
            id: `loading-${load.id}`,
            activityType: 'loaded',
            action: AuditAction.STATUS_CHANGE,
            title: 'Cargo loaded',
            description: 'Cargo loading was completed and status set to Loaded',
            createdAt: loadingIso,
            source: 'load',
            entityType: AuditEntityType.LOAD,
            entityId: load.id,
            metadata: { activityType: 'loaded', status: LoadStatus.LOADED, approximate: true },
          },
          [`loading:loaded:${load.id}`],
        );
      }
    }

    // 8. Trips
    for (const trip of trips) {
      if (trip.actualStartTime || trip.status === TripStatus.IN_PROGRESS || trip.status === TripStatus.COMPLETED) {
        const startAt = this.toIso(trip.actualStartTime, trip.createdAt);
        if (startAt) {
          pushUnique(
            {
              id: `trip-started-${trip.id}`,
              activityType: 'trip_started',
              action: AuditAction.START,
              title: 'Trip started',
              description: trip.tripNumber
                ? `Trip ${trip.tripNumber} started`
                : 'Trip started — cargo is in transit',
              actorId: trip.driverId,
              actorName: actorNames.get(trip.driverId),
              createdAt: startAt,
              source: 'trip',
              entityType: AuditEntityType.TRIP,
              entityId: trip.id,
              metadata: {
                tripId: trip.id,
                tripNumber: trip.tripNumber,
                activityType: 'trip_started',
              },
            },
            [`trip:start:${trip.id}`],
          );
        }
      }

      if (trip.actualEndTime || trip.completedAt || trip.status === TripStatus.COMPLETED) {
        const endAt = this.toIso(
          trip.actualEndTime || trip.completedAt || trip.updatedAt,
          trip.createdAt,
        );
        if (endAt) {
          pushUnique(
            {
              id: `trip-completed-${trip.id}`,
              activityType: 'delivered',
              action: AuditAction.DELIVER,
              title: 'Trip completed',
              description: trip.tripNumber
                ? `Trip ${trip.tripNumber} completed`
                : 'Trip completed',
              actorId: trip.driverId,
              actorName: actorNames.get(trip.driverId),
              createdAt: endAt,
              source: 'trip',
              entityType: AuditEntityType.TRIP,
              entityId: trip.id,
              metadata: {
                tripId: trip.id,
                tripNumber: trip.tripNumber,
                activityType: 'delivered',
              },
            },
            [`trip:complete:${trip.id}`],
          );
        }
      }
    }

    // 9. Trip events (pickup/delivery/loading/unloading style milestones)
    for (const te of tripEvents) {
      try {
        const mapped = this.mapTripEvent(te);
        if (!mapped) continue;
        if (!mapped.actorName && te.driverId) {
          mapped.actorName = actorNames.get(te.driverId);
        }
        pushUnique(mapped, [`trip_event:${te.id}`, this.activityDedupeKey(mapped)]);
      } catch (err: any) {
        this.logger.warn(`Skipping trip event ${te.id}: ${err?.message}`);
      }
    }

    // Sort newest first
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = items.length;
    const start = (pageNum - 1) * limitNum;
    const paged = items.slice(start, start + limitNum);

    return { items: paged, total, page: pageNum, limit: limitNum };
    } catch (err: any) {
      this.logger.error(
        `Cargo history failed for load ${loadId}: ${err?.message}`,
        err?.stack,
      );
      return { items: [], total: 0, page: pageNum, limit: limitNum };
    }
  }

  private mapAuditEvent(event: AuditEvent): CargoHistoryItemDto | null {
    const createdAt = this.toIso(event.createdAt);
    if (!createdAt) return null;

    const metaType = event.metadata?.activityType as
      | CargoHistoryActivityType
      | undefined;
    const activityType =
      metaType || this.inferActivityTypeFromAudit(event);

    const changeSummary =
      Array.isArray(event.changes) && event.changes.length > 0
        ? event.changes
            .map((c) => `${c.field}: ${this.stringifyValue(c.oldValue)} → ${this.stringifyValue(c.newValue)}`)
            .join('; ')
        : undefined;

    const description =
      event.description ||
      changeSummary ||
      this.defaultDescription(activityType);

    return {
      id: event.id,
      activityType,
      action: event.action,
      title: this.titleForActivity(activityType, event.description),
      description,
      actorId: event.actorId,
      actorName: event.actorName,
      actorRole: event.actorRole,
      createdAt,
      source: 'audit',
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: {
        ...(event.metadata || {}),
        ...(Array.isArray(event.changes) && event.changes.length
          ? { changes: event.changes }
          : {}),
        ...(event.before ? { before: event.before } : {}),
        ...(event.after ? { after: event.after } : {}),
        ...(event.reason ? { reason: event.reason } : {}),
      },
    };
  }

  private stringifyValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  private mapTripEvent(te: TripEvent): CargoHistoryItemDto | null {
    const typeMap: Partial<
      Record<TripEventType, { activityType: CargoHistoryActivityType; title: string }>
    > = {
      [TripEventType.TRIP_STARTED]: {
        activityType: 'trip_started',
        title: 'Trip started',
      },
      [TripEventType.TRIP_COMPLETED]: {
        activityType: 'delivered',
        title: 'Trip completed',
      },
      [TripEventType.TRIP_CANCELLED]: {
        activityType: 'cancelled',
        title: 'Trip cancelled',
      },
      [TripEventType.PICKUP_ARRIVED]: {
        activityType: 'pickup_arrived',
        title: 'Arrived at pickup',
      },
      [TripEventType.PICKUP_COMPLETED]: {
        activityType: 'pickup_completed',
        title: 'Pickup / loading completed',
      },
      [TripEventType.DELIVERY_ARRIVED]: {
        activityType: 'delivery_arrived',
        title: 'Arrived at delivery',
      },
      [TripEventType.DELIVERY_COMPLETED]: {
        activityType: 'unloading_completed',
        title: 'Delivery / unloading completed',
      },
    };

    const createdAt = this.toIso(te.createdAt);
    if (!createdAt) return null;

    const mapped = typeMap[te.type];
    if (!mapped) {
      // Skip noisy ETA/weather/traffic noise from cargo history
      if (
        [
          TripEventType.ETA_UPDATED,
          TripEventType.WEATHER_UPDATE,
          TripEventType.TRAFFIC_UPDATE,
          TripEventType.ROUTE_DEVIATION,
        ].includes(te.type)
      ) {
        return null;
      }
      return {
        id: te.id,
        activityType: 'other',
        action: te.type,
        title: te.title || te.type,
        description: te.description || te.title,
        actorId: te.driverId,
        createdAt,
        source: 'trip_event',
        entityType: AuditEntityType.TRIP,
        entityId: te.tripId,
        metadata: { tripEventType: te.type, ...(te.metadata || {}) },
      };
    }

    return {
      id: te.id,
      activityType: mapped.activityType,
      action: te.type,
      title: te.title || mapped.title,
      description: te.description || mapped.title,
      actorId: te.driverId,
      createdAt,
      source: 'trip_event',
      entityType: AuditEntityType.TRIP,
      entityId: te.tripId,
      metadata: { tripEventType: te.type, activityType: mapped.activityType },
    };
  }

  private inferActivityTypeFromAudit(
    event: AuditEvent,
  ): CargoHistoryActivityType {
    switch (event.action) {
      case AuditAction.CREATE:
        return event.entityType === AuditEntityType.BID
          ? 'bid_submitted'
          : 'created';
      case AuditAction.PUBLISH:
        return 'published';
      case AuditAction.ASSIGN:
        if (event.metadata?.activityType === 'broker_assigned')
          return 'broker_assigned';
        if (event.entityType === AuditEntityType.BID) return 'bid_accepted';
        return 'carrier_assigned';
      case AuditAction.START:
        return 'trip_started';
      case AuditAction.DELIVER:
        return 'delivered';
      case AuditAction.CANCEL:
        return 'cancelled';
      case AuditAction.REPOST:
        return 'reposted';
      case AuditAction.STATUS_CHANGE:
        return 'status_change';
      case AuditAction.DOCUMENT_UPLOAD:
        return 'document_uploaded';
      case AuditAction.DOCUMENT_DELETE:
        return 'document_deleted';
      case AuditAction.TRACKING_UPDATE:
        return 'tracking_update';
      case AuditAction.ALERT_CREATE:
      case AuditAction.ALERT_UPDATE:
        return 'alert';
      case AuditAction.UPDATE:
        return 'updated';
      default:
        return 'other';
    }
  }

  private titleForActivity(
    activityType: CargoHistoryActivityType,
    fallback?: string,
  ): string {
    const titles: Record<CargoHistoryActivityType, string> = {
      created: 'Cargo created',
      published: 'Cargo published',
      updated: 'Cargo updated',
      status_change: 'Status changed',
      broker_assigned: 'Cargo assigned to broker',
      broker_unassigned: 'Broker unassigned',
      bid_submitted: 'Bid submitted',
      bid_accepted: 'Bid accepted / won',
      bid_rejected: 'Bid rejected',
      bid_withdrawn: 'Bid withdrawn',
      carrier_assigned: 'Carrier assigned',
      inspection_started: 'Inspection started',
      inspection_submitted: 'Inspection submitted',
      inspection_approved: 'Inspection approved',
      inspection_failed: 'Inspection failed',
      loading_started: 'Loading started',
      loaded: 'Cargo loaded',
      trip_started: 'Trip started',
      pickup_arrived: 'Arrived at pickup',
      pickup_completed: 'Pickup completed',
      in_transit: 'In transit',
      delivery_arrived: 'Arrived at delivery',
      unloading_started: 'Unloading started',
      unloading_completed: 'Unloading completed',
      delivered: 'Cargo delivered',
      cancelled: 'Cargo cancelled',
      reposted: 'Cargo reposted',
      document_uploaded: 'Document uploaded',
      document_deleted: 'Document deleted',
      receiver_assigned: 'Receiver assigned',
      tracking_update: 'Tracking updated',
      alert: 'Alert',
      other: fallback || 'Activity',
    };
    return titles[activityType] || fallback || 'Activity';
  }

  private defaultDescription(activityType: CargoHistoryActivityType): string {
    return this.titleForActivity(activityType);
  }

  private activityDedupeKey(item: CargoHistoryItemDto): string {
    const minute = String(item.createdAt || '').slice(0, 16);
    return `activity:${item.activityType}:${item.entityId || ''}:${minute}`;
  }

  private async findLoadForHistory(
    loadId: string,
    tenantId: string,
  ): Promise<Load | null> {
    const selectAttempts = [
      [
        'load.id',
        'load.tenantId',
        'load.title',
        'load.cargoOwnerId',
        'load.brokerId',
        'load.assignedCarrierId',
        'load.assignedTruckId',
        'load.status',
        'load.createdAt',
        'load.updatedAt',
        'load.publishedAt',
        'load.metadata',
      ],
      [
        'load.id',
        'load.tenantId',
        'load.title',
        'load.cargoOwnerId',
        'load.brokerId',
        'load.assignedCarrierId',
        'load.status',
        'load.createdAt',
        'load.updatedAt',
      ],
    ];

    for (const select of selectAttempts) {
      try {
        return await this.loadRepository
          .createQueryBuilder('load')
          .select(select)
          .where('load.id = :loadId', { loadId })
          .andWhere('load.tenantId = :tenantId', { tenantId })
          .getOne();
      } catch (err: any) {
        this.logger.warn(
          `Cargo history load fetch failed: ${err?.message}`,
        );
      }
    }
    return null;
  }

  private async firstSuccessful<T>(
    label: string,
    attempts: Array<() => Promise<T[]>>,
  ): Promise<T[]> {
    let lastError: any;
    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (err: any) {
        lastError = err;
        this.logger.warn(`Cargo history ${label} query failed: ${err?.message}`);
      }
    }
    this.logger.warn(
      `Cargo history ${label} unavailable: ${lastError?.message || 'unknown error'}`,
    );
    return [];
  }

  private async loadActorNames(
    userIds: Array<string | null | undefined>,
  ): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    const ids = [...new Set(userIds.filter((id): id is string => Boolean(id)))];
    if (ids.length === 0) return names;

    try {
      const profiles = await this.loadRepository.manager
        .createQueryBuilder(UserProfile, 'profile')
        .select([
          'profile.id',
          'profile.userId',
          'profile.firstName',
          'profile.lastName',
          'profile.companyName',
        ])
        .where('profile.userId IN (:...ids)', { ids })
        .getMany();
      for (const profile of profiles) {
        const name = [profile.firstName, profile.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();
        if (name) names.set(profile.userId, name);
        else if (profile.companyName) names.set(profile.userId, profile.companyName);
      }
    } catch (err: any) {
      this.logger.warn(`Cargo history profile names skipped: ${err?.message}`);
    }

    const missing = ids.filter((id) => !names.has(id));
    if (missing.length === 0) return names;

    try {
      const users = await this.loadRepository.manager
        .createQueryBuilder(User, 'user')
        .select(['user.id', 'user.email'])
        .where('user.id IN (:...ids)', { ids: missing })
        .getMany();
      for (const user of users) {
        if (user.email) names.set(user.id, user.email);
      }
    } catch (err: any) {
      this.logger.warn(`Cargo history user emails skipped: ${err?.message}`);
    }

    return names;
  }

  private toIso(value: unknown, fallback?: unknown): string | undefined {
    const parsed = this.parseDate(value) || this.parseDate(fallback);
    return parsed ? parsed.toISOString() : undefined;
  }

  private parseDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? undefined : value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  }
}
