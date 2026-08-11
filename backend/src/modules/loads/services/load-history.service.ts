import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
    const load = await this.loadRepository.findOne({
      where: { id: loadId, tenantId },
      relations: ['broker', 'broker.profile', 'assignedDriver', 'assignedDriver.profile'],
    });

    if (!load) {
      return { items: [], total: 0, page, limit };
    }

    const [auditEvents, bids, trips, inspections, commissions] =
      await Promise.all([
        this.auditEventRepository.find({
          where: { loadId },
          order: { createdAt: 'DESC' },
        }),
        this.bidRepository.find({
          where: { loadId },
          relations: ['truckOwner', 'truckOwner.profile'],
          order: { createdAt: 'DESC' },
          withDeleted: false,
        }),
        this.tripRepository.find({
          where: { loadId },
          order: { createdAt: 'DESC' },
        }),
        this.cargoInspectionRepository.find({
          where: { loadId },
          relations: ['driver', 'driver.profile', 'receiver', 'receiver.profile'],
          order: { createdAt: 'DESC' },
        }),
        this.brokerCommissionRepository.find({
          where: { loadId },
          relations: ['broker', 'broker.profile'],
          order: { createdAt: 'ASC' },
        }),
      ]);

    const tripIds = trips.map((t) => t.id);
    const tripEvents =
      tripIds.length > 0
        ? await this.tripEventRepository.find({
            where: { tripId: In(tripIds) },
            order: { createdAt: 'DESC' },
          })
        : [];

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
      const mapped = this.mapAuditEvent(event);
      pushUnique(mapped, [`audit:${event.id}`]);
    }

    // 2. Load lifecycle timestamps
    if (load.createdAt) {
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
          createdAt: load.createdAt.toISOString(),
          source: 'load',
          entityType: AuditEntityType.LOAD,
          entityId: load.id,
          metadata: { status: LoadStatus.DRAFT },
        },
        [`load:created:${load.id}`, 'activity:created'],
      );
    }

    if (load.publishedAt) {
      pushUnique(
        {
          id: `load-published-${load.id}`,
          activityType: 'published',
          action: AuditAction.PUBLISH,
          title: 'Cargo published',
          description: 'Cargo was published and made available for matching',
          actorId: load.cargoOwnerId,
          createdAt: load.publishedAt.toISOString(),
          source: 'load',
          entityType: AuditEntityType.LOAD,
          entityId: load.id,
        },
        [`load:published:${load.id}`, 'activity:published'],
      );
    }

    // 3. Broker assignment via commission records (accurate timestamps)
    for (const commission of commissions) {
      const brokerName = this.formatUserName(commission.broker);
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
          createdAt: commission.createdAt.toISOString(),
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
          `broker:assign:${commission.brokerId}:${commission.createdAt.toISOString()}`,
        ],
      );
    }

    // Fallback: broker currently assigned but no commission row
    if (load.brokerId && commissions.length === 0) {
      const brokerName = this.formatUserName(load.broker);
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
          createdAt: (load.updatedAt || load.createdAt).toISOString(),
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

    // 4. Bids
    for (const bid of bids) {
      const bidderName = this.formatUserName(bid.truckOwner);
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
          createdAt: bid.createdAt.toISOString(),
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

      if (bid.status === BidStatus.ACCEPTED) {
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
            createdAt: bid.updatedAt.toISOString(),
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
      } else if (bid.status === BidStatus.REJECTED) {
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
            createdAt: bid.updatedAt.toISOString(),
            source: 'bid',
            entityType: AuditEntityType.BID,
            entityId: bid.id,
            metadata: { activityType: 'bid_rejected' },
          },
          [`bid:reject:${bid.id}`],
        );
      } else if (bid.status === BidStatus.WITHDRAWN) {
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
            createdAt: bid.updatedAt.toISOString(),
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
      const carrierName = this.formatUserName(load.assignedDriver);
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
          createdAt: (load.updatedAt || load.createdAt).toISOString(),
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

    // 6. Inspections
    for (const inspection of inspections) {
      const inspectorName = this.formatUserName(
        inspection.driver || inspection.receiver,
      );
      const typeLabel =
        inspection.inspectionType === CargoInspectionType.PRE_TRIP
          ? 'Pre-trip cargo inspection'
          : 'Delivery inspection';

      pushUnique(
        {
          id: `inspection-started-${inspection.id}`,
          activityType: 'inspection_started',
          action: AuditAction.STATUS_CHANGE,
          title: `${typeLabel} started`,
          description: inspectorName
            ? `${typeLabel} started by ${inspectorName}`
            : `${typeLabel} started`,
          actorId: inspection.driverId || inspection.receiverId,
          actorName: inspectorName,
          createdAt: inspection.createdAt.toISOString(),
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

      if (inspection.completedAt) {
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
            actorId: inspection.driverId || inspection.receiverId,
            actorName: inspectorName,
            createdAt: inspection.completedAt.toISOString(),
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
    if (preTrip?.truckInspection?.completedAt) {
      pushUnique(
        {
          id: `truck-inspection-${load.id}-${preTrip.truckInspection.completedAt}`,
          activityType: 'inspection_started',
          action: AuditAction.STATUS_CHANGE,
          title: 'Truck inspection completed',
          description: 'Pre-trip truck inspection was completed',
          actorId: preTrip.truckInspection.completedById,
          createdAt: new Date(preTrip.truckInspection.completedAt).toISOString(),
          source: 'load',
          entityType: AuditEntityType.LOAD,
          entityId: load.id,
          metadata: { activityType: 'inspection_started', step: 'truck' },
        },
        [`truck-inspection:${load.id}:${preTrip.truckInspection.completedAt}`],
      );
    }
    if (preTrip?.approvedAt) {
      pushUnique(
        {
          id: `inspection-approved-meta-${load.id}`,
          activityType: 'inspection_approved',
          action: AuditAction.STATUS_CHANGE,
          title: 'Pre-trip inspection approved',
          description: 'Cargo owner/broker approved the pre-trip inspection',
          actorId: preTrip.approvedById,
          createdAt: new Date(preTrip.approvedAt).toISOString(),
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
      const loadingTime =
        trips.find((t) => t.actualStartTime)?.actualStartTime ||
        trips[0]?.createdAt ||
        load.updatedAt;
      pushUnique(
        {
          id: `loading-${load.id}`,
          activityType: 'loaded',
          action: AuditAction.STATUS_CHANGE,
          title: 'Cargo loaded',
          description: 'Cargo loading was completed and status set to Loaded',
          createdAt: loadingTime.toISOString(),
          source: 'load',
          entityType: AuditEntityType.LOAD,
          entityId: load.id,
          metadata: { activityType: 'loaded', status: LoadStatus.LOADED, approximate: true },
        },
        [`loading:loaded:${load.id}`],
      );
    }

    // 8. Trips
    for (const trip of trips) {
      if (trip.actualStartTime || trip.status === TripStatus.IN_PROGRESS || trip.status === TripStatus.COMPLETED) {
        const startAt = trip.actualStartTime || trip.createdAt;
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
            createdAt: startAt.toISOString(),
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

      if (trip.actualEndTime || trip.completedAt || trip.status === TripStatus.COMPLETED) {
        const endAt = trip.actualEndTime || trip.completedAt || trip.updatedAt;
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
            createdAt: endAt.toISOString(),
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

    // 9. Trip events (pickup/delivery/loading/unloading style milestones)
    for (const te of tripEvents) {
      const mapped = this.mapTripEvent(te);
      if (!mapped) continue;
      pushUnique(mapped, [`trip_event:${te.id}`, this.activityDedupeKey(mapped)]);
    }

    // Sort newest first
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = items.length;
    const start = (Math.max(page, 1) - 1) * limit;
    const paged = items.slice(start, start + limit);

    return { items: paged, total, page, limit };
  }

  private mapAuditEvent(event: AuditEvent): CargoHistoryItemDto {
    const metaType = event.metadata?.activityType as
      | CargoHistoryActivityType
      | undefined;
    const activityType =
      metaType || this.inferActivityTypeFromAudit(event);

    const changeSummary =
      event.changes?.length > 0
        ? event.changes
            .map((c) => `${c.field}: ${this.stringifyValue(c.oldValue)} → ${this.stringifyValue(c.newValue)}`)
            .join('; ')
        : undefined;

    const description =
      event.description ||
      changeSummary ||
      event.getChangeSummary?.() ||
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
      createdAt: event.createdAt.toISOString(),
      source: 'audit',
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: {
        ...(event.metadata || {}),
        ...(event.changes?.length ? { changes: event.changes } : {}),
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
        createdAt: te.createdAt.toISOString(),
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
      createdAt: te.createdAt.toISOString(),
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
    const minute = item.createdAt.slice(0, 16);
    return `activity:${item.activityType}:${item.entityId || ''}:${minute}`;
  }

  private formatUserName(user?: User | null): string | undefined {
    if (!user) return undefined;
    const profile = (user as any).profile;
    const name = [profile?.firstName, profile?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (name) return name;
    if (profile?.companyName) return profile.companyName;
    return user.email || undefined;
  }
}
