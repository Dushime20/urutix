import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import {
  CapacityOffer,
  CapacityOfferStatus,
  CapacityBookingMode,
  CapacityPlace,
} from '../../entities/capacity-offer.entity';
import {
  CapacityBooking,
  CapacityBookingStatus,
  CapacityCommissionStatus,
} from '../../entities/capacity-booking.entity';
import { Truck, VehicleStatus } from '../../entities/truck.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { Driver } from '../../entities/driver.entity';
import {
  Load,
  LoadLocation,
  LoadStatus,
  LoadType,
  CargoType,
  EquipmentType,
  Visibility,
  PaymentTerms,
  UrgencyLevel,
  PackagingType,
} from '../../entities/load.entity';
import { Payment, PaymentMethod, PaymentStatus, PaymentType } from '../../entities/payment.entity';
import {
  NotificationType,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  EntityType,
} from '../../entities/notification.entity';
import { NotificationService } from '../notifications/notification.service';
import { CampaignGeoService } from '../campaigns/campaign-geo.service';
import {
  BookCapacityDto,
  CreateCapacityOfferDto,
  QuoteCapacityDto,
  SearchCapacityDto,
  UpdateCapacityOfferDto,
} from './dto/capacity.dto';
import {
  applyBookingToSlice,
  corridorOverlaps,
  hardFilterOffer,
  nextOfferStatus,
  PLATFORM_CAPACITY_COMMISSION_RATE,
  quoteCommission,
  quoteFreight,
  resolveOfferedFreight,
  isLeftoverSellableSlice,
  remainingFromTrip,
  roundKg,
  roundMoney,
  scoreOffer,
  suggestListedRemainder,
  tripWindowsOverlap,
  utilizationPercent,
  windowsOverlap,
  type OfferMatchInput,
  type SearchQuery,
} from './capacity-matching';

const ACTIVE_TRIP = [TripStatus.PLANNED, TripStatus.IN_PROGRESS, TripStatus.DELAYED, TripStatus.OVERDUE];
const LIVE_BOOKING = [CapacityBookingStatus.REQUESTED, CapacityBookingStatus.CONFIRMED, CapacityBookingStatus.IN_TRANSIT];
const OPEN_OFFER = [CapacityOfferStatus.OPEN, CapacityOfferStatus.PARTIALLY_BOOKED];
/** Columns that exist on older truck tables — never SELECT the full entity. */
const TRUCK_CARD_SELECT: (keyof Truck)[] = [
  'id',
  'tenantId',
  'ownerId',
  'plateNumber',
  'make',
  'model',
  'capacityWeight',
  'capacityVolume',
  'status',
  'currentDriverId',
];
/** Richer truck fields for leftover-space View details — fall back to card if a column is missing. */
const TRUCK_DETAIL_SELECT: (keyof Truck)[] = [
  ...TRUCK_CARD_SELECT,
  'vin',
  'year',
  'color',
  'manufacturer',
  'chassis',
  'truckType',
  'trailerType',
  'fuelType',
  'availabilityStatus',
  'ownershipType',
  'vehicleClass',
  'chassisConfiguration',
  'fleetGroup',
  'maxLength',
  'maxWidth',
  'maxHeight',
  'hasSideRails',
  'hasTarps',
  'hasStraps',
  'hasChains',
  'hasWinch',
  'hasRam',
  'hasTailLift',
  'hasSideLift',
  'hasRollerBed',
  'hasDropDeck',
  'hasExtendable',
  'hasLowbed',
  'hasStepDeck',
  'hasPowerOnly',
  'hasContainerChassis',
  'hasTanker',
  'hasBulk',
  'hasRefrigerated',
  'hasHeated',
  'hasVentilated',
  'hasCurtainSide',
  'hasBox',
  'hasVan',
  'hasPlatform',
  'hasCarCarrier',
  'hasHeavyHaul',
  'hasOversized',
  'hasHazmat',
  'hasDangerousGoods',
  'hasFoodGrade',
  'hasPharmaceutical',
  'hasLiquid',
  'hasDryBulk',
  'hasGas',
  'hasChemical',
  'hasWaste',
  'hasReefer',
  'hasFrozen',
  'hasChilled',
  'hasAmbient',
  'hasControlledAtmosphere',
  'hasHumidityControl',
  'hasTemperatureMonitoring',
  'hasGPS',
  'hasTracking',
  'hasTelematics',
  'hasELD',
  'hasDashCam',
  'hasSafetyCameras',
];
/** Avoid SELECT * on trips/loads — production often lags entity columns (delay*, geometry, enums). */
const TRIP_CARD_SELECT = [
  'trip.id',
  'trip.tenantId',
  'trip.truckId',
  'trip.loadId',
  'trip.driverId',
  'trip.tripNumber',
  'trip.status',
  'trip.plannedStartTime',
  'trip.plannedEndTime',
  'trip.agreedPrice',
  'trip.currencyCode',
  'trip.notes',
];
const LOAD_CARD_SELECT = [
  'load.id',
  'load.title',
  'load.weight',
  'load.volume',
  'load.origin',
  'load.destination',
  'load.locations',
];
const ASSIGNABLE_LOAD_SELECT: (keyof Load)[] = [
  'id',
  'tenantId',
  'cargoOwnerId',
  'title',
  'description',
  'weight',
  'volume',
  'origin',
  'destination',
  'locations',
  'status',
  'pickupDate',
  'deliveryDate',
  'cargoType',
  'assignedTruckId',
  'metadata',
  'createdAt',
];
const ASSIGNABLE_LOAD_STATUS = [
  LoadStatus.DRAFT,
  LoadStatus.CREATED,
  LoadStatus.PUBLISHED,
];

@Injectable()
export class CapacityService implements OnModuleInit {
  private readonly logger = new Logger(CapacityService.name);

  constructor(
    @InjectRepository(CapacityOffer) private readonly offerRepo: Repository<CapacityOffer>,
    @InjectRepository(CapacityBooking) private readonly bookingRepo: Repository<CapacityBooking>,
    @InjectRepository(Truck) private readonly truckRepo: Repository<Truck>,
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Load) private readonly loadRepo: Repository<Load>,
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    private readonly notifications: NotificationService,
    private readonly geo: CampaignGeoService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      const sql = `
        CREATE TABLE IF NOT EXISTS "capacity_offers" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "tenantId" uuid NOT NULL,
          "ownerId" uuid NOT NULL,
          "truckId" uuid NOT NULL,
          "tripId" uuid,
          "origin" jsonb NOT NULL,
          "destination" jsonb NOT NULL,
          "departureAt" TIMESTAMPTZ NOT NULL,
          "arrivalAt" TIMESTAMPTZ NOT NULL,
          "nameplateWeightKg" numeric(12,2) NOT NULL,
          "nameplateVolumeM3" numeric(12,2) NOT NULL,
          "listedWeightKg" numeric(12,2) NOT NULL,
          "listedVolumeM3" numeric(12,2) NOT NULL,
          "remainingWeightKg" numeric(12,2) NOT NULL,
          "remainingVolumeM3" numeric(12,2) NOT NULL,
          "allocatedWeightKg" numeric(12,2) NOT NULL DEFAULT 0,
          "allocatedVolumeM3" numeric(12,2) NOT NULL DEFAULT 0,
          "floorPrice" numeric(15,2) NOT NULL DEFAULT 0,
          "pricePerTonne" numeric(15,2),
          "pricePerM3" numeric(15,2),
          "currencyCode" character varying(3) NOT NULL DEFAULT 'USD',
          "commissionRate" numeric(5,2) NOT NULL DEFAULT 8.00,
          "compatibleCargoTypes" jsonb NOT NULL DEFAULT '["GENERAL"]',
          "generalCargoOnly" boolean NOT NULL DEFAULT true,
          "allowMixing" boolean NOT NULL DEFAULT true,
          "bookingMode" character varying(16) NOT NULL DEFAULT 'REQUEST',
          "status" character varying(24) NOT NULL DEFAULT 'OPEN',
          "notes" text,
          "loadIds" jsonb NOT NULL DEFAULT '[]',
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_capacity_offers" PRIMARY KEY ("id")
        );
        CREATE INDEX IF NOT EXISTS "IDX_capacity_offers_owner" ON "capacity_offers" ("tenantId", "ownerId", "createdAt");
        CREATE INDEX IF NOT EXISTS "IDX_capacity_offers_status" ON "capacity_offers" ("tenantId", "status", "departureAt");
        CREATE INDEX IF NOT EXISTS "IDX_capacity_offers_truck" ON "capacity_offers" ("truckId", "status");
        CREATE TABLE IF NOT EXISTS "capacity_bookings" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "tenantId" uuid NOT NULL,
          "offerId" uuid NOT NULL,
          "cargoOwnerId" uuid NOT NULL,
          "loadId" uuid,
          "tripId" uuid,
          "weightKg" numeric(12,2) NOT NULL,
          "volumeM3" numeric(12,2) NOT NULL DEFAULT 0,
          "cargoType" character varying(32) NOT NULL DEFAULT 'GENERAL',
          "title" character varying(200),
          "freightAmount" numeric(15,2) NOT NULL,
          "commissionRate" numeric(5,2) NOT NULL,
          "commissionAmount" numeric(15,2) NOT NULL,
          "currencyCode" character varying(3) NOT NULL DEFAULT 'USD',
          "commissionStatus" character varying(16) NOT NULL DEFAULT 'PENDING',
          "freightPaymentId" uuid,
          "commissionPaymentId" uuid,
          "status" character varying(24) NOT NULL DEFAULT 'REQUESTED',
          "rejectionReason" text,
          "origin" jsonb,
          "destination" jsonb,
          "pickupDate" TIMESTAMPTZ,
          "deliveryDate" TIMESTAMPTZ,
          "metadata" jsonb NOT NULL DEFAULT '{}',
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_capacity_bookings" PRIMARY KEY ("id")
        );
        CREATE INDEX IF NOT EXISTS "IDX_capacity_bookings_owner" ON "capacity_bookings" ("tenantId", "cargoOwnerId", "createdAt");
        CREATE INDEX IF NOT EXISTS "IDX_capacity_bookings_offer" ON "capacity_bookings" ("offerId", "status");
        CREATE INDEX IF NOT EXISTS "IDX_capacity_bookings_status" ON "capacity_bookings" ("tenantId", "status");
      `;
      await this.dataSource.query(sql);
    } catch (err: any) {
      this.logger.warn(`Could not ensure capacity tables: ${err?.message}`);
    }
  }

  searchCities(q: string, limit = 20) {
    return this.geo.searchCities(q || '', limit);
  }

  async sellable(tenantId: string, ownerId: string) {
    await this.expireStale(tenantId);
    const trucks = await this.findTrucks({ tenantId, ownerId });
    const liveTrucks = trucks.filter((truck) =>
      [VehicleStatus.AVAILABLE, VehicleStatus.IN_TRANSIT].includes(truck.status),
    );
    let trips: Trip[] = [];
    try {
      trips = await this.findActiveTripsWithLoads(
        tenantId,
        liveTrucks.map((truck) => truck.id),
      );
    } catch (err: any) {
      this.logger.error(`sellable trips query failed: ${err?.message}`);
    }
    let liveOffers: CapacityOffer[] = [];
    try {
      liveOffers = await this.offerRepo.find({
        where: { tenantId, ownerId, status: In(OPEN_OFFER) },
      });
    } catch (err: any) {
      this.logger.warn(`sellable offers query failed: ${err?.message}`);
    }

    const truckById = new Map(liveTrucks.map((truck) => [truck.id, truck]));
    const rows = [];
    for (const trip of trips) {
      const truck = truckById.get(trip.truckId);
      if (!truck) continue;
      try {
        const offer = liveOffers.find((o) => o.tripId === trip.id);
        const nameplateKg = Number(truck.capacityWeight) || 0;
        const nameplateM3 = Number(truck.capacityVolume) || 0;
        const loadKg = Number(trip.load?.weight) || 0;
        const loadM3 = Number(trip.load?.volume) || 0;
        const bookedKg = Number(offer?.allocatedWeightKg) || 0;
        const bookedM3 = Number(offer?.allocatedVolumeM3) || 0;
        const allocatedKg = loadKg + bookedKg;
        const allocatedM3 = loadM3 + bookedM3;
        const slice = remainingFromTrip(nameplateKg, nameplateM3, allocatedKg, allocatedM3);
        const utilization = utilizationPercent(allocatedKg, nameplateKg);
        rows.push({
          truckId: truck.id,
          plateNumber: truck.plateNumber,
          make: truck.make,
          model: truck.model,
          status: truck.status,
          nameplateWeightKg: nameplateKg,
          nameplateVolumeM3: nameplateM3,
          tripId: trip.id,
          tripNumber: trip.tripNumber || null,
          cargoTitle: trip.load?.title || null,
          loadedWeightKg: loadKg,
          corridor: {
            origin: this.placeFromLoad(trip.load, 'origin'),
            destination: this.placeFromLoad(trip.load, 'destination'),
            departureAt: trip.plannedStartTime,
            arrivalAt: trip.plannedEndTime,
          },
          remainingWeightKg: offer ? Number(offer.remainingWeightKg) : slice.remainingWeightKg,
          remainingVolumeM3: offer ? Number(offer.remainingVolumeM3) : slice.remainingVolumeM3,
          allocatedWeightKg: allocatedKg,
          utilizationPercent: utilization,
          emptyPercent: roundKg(100 - utilization),
          canList: isLeftoverSellableSlice({
            tripId: trip.id,
            allocatedWeightKg: allocatedKg,
            remainingWeightKg: slice.remainingWeightKg,
            utilizationPercent: utilization,
            existingOfferId: offer?.id,
          }),
          existingOfferId: offer?.id || null,
          suggestedFloorPrice: roundMoney(this.suggestFloor(slice.remainingWeightKg, trip)),
        });
      } catch (err: any) {
        this.logger.warn(`Skipping sellable trip ${trip.id}: ${err?.message}`);
      }
    }

    return rows.filter((row) =>
      isLeftoverSellableSlice({
        tripId: row.tripId,
        allocatedWeightKg: row.allocatedWeightKg,
        remainingWeightKg: row.remainingWeightKg,
        utilizationPercent: row.utilizationPercent,
        existingOfferId: row.existingOfferId,
      }),
    );
  }

  async createOffer(dto: CreateCapacityOfferDto, tenantId: string, ownerId: string) {
    const truck = await this.findTruck({ id: dto.truckId, tenantId, ownerId });
    if (!truck) throw new NotFoundException('Truck not found');
    if (![VehicleStatus.AVAILABLE, VehicleStatus.IN_TRANSIT].includes(truck.status)) {
      throw new BadRequestException('Only available or in-transit trucks can sell leftover space');
    }

    const trip = await this.findTripWithLoad({ id: dto.tripId, tenantId, truckId: truck.id });
    if (!trip) throw new NotFoundException('Trip not found for this truck');

    const liveOnTrip = await this.offerRepo.findOne({
      where: { tenantId, tripId: trip.id, status: In(OPEN_OFFER) },
    });
    if (liveOnTrip) {
      throw new BadRequestException('This trip already has an open leftover-space listing');
    }

    const liveOnTruck = await this.offerRepo.find({
      where: { tenantId, truckId: truck.id, status: In(OPEN_OFFER) },
    });
    const overlapping = liveOnTruck.find((offer) =>
      tripWindowsOverlap(offer.departureAt, offer.arrivalAt, trip.plannedStartTime, trip.plannedEndTime),
    );
    if (overlapping) {
      throw new BadRequestException(
        'This truck already has leftover space listed on overlapping dates. Sequential trips can each be listed separately.',
      );
    }

    const nameplateKg = Number(truck.capacityWeight) || 0;
    const nameplateM3 = Number(truck.capacityVolume) || 0;
    const allocatedKg = Number(trip.load?.weight) || 0;
    const allocatedM3 = Number(trip.load?.volume) || 0;
    const utilization = utilizationPercent(allocatedKg, nameplateKg);
    if (allocatedKg <= 0) {
      throw new BadRequestException('This truck has no cargo loaded yet — sell leftover space only on partially filled trips');
    }
    if (utilization >= 100) {
      throw new BadRequestException('This truck is full — no leftover space to sell');
    }

    const slice = suggestListedRemainder(nameplateKg, nameplateM3, allocatedKg, allocatedM3);
    const listedWeightKg = roundKg(slice.remainingWeightKg);
    const listedVolumeM3 = roundKg(slice.remainingVolumeM3);
    if (listedWeightKg < 50) {
      throw new BadRequestException('Need at least 50 kg of unused capacity to list');
    }

    const origin = this.placeFromLoad(trip.load, 'origin');
    const destination = this.placeFromLoad(trip.load, 'destination');
    if (!origin || !destination) {
      throw new BadRequestException('Cargo on this trip is missing pickup or delivery location');
    }
    if ((!origin.lat && !origin.lng) || (!destination.lat && !destination.lng)) {
      throw new BadRequestException('Cargo locations must include coordinates');
    }

    const departureAt = trip.plannedStartTime;
    const arrivalAt = trip.plannedEndTime;
    if (!departureAt || !arrivalAt) {
      throw new BadRequestException('Trip schedule is incomplete');
    }
    if (new Date(arrivalAt) <= new Date(departureAt)) {
      throw new BadRequestException('Trip arrival must be after departure');
    }

    const floorPrice = roundMoney(dto.floorPrice ?? this.suggestFloor(listedWeightKg, trip));

    const offer = this.offerRepo.create({
      tenantId,
      ownerId,
      truckId: truck.id,
      tripId: trip.id,
      origin: this.normalizePlace(origin),
      destination: this.normalizePlace(destination),
      departureAt: new Date(departureAt),
      arrivalAt: new Date(arrivalAt),
      nameplateWeightKg: nameplateKg,
      nameplateVolumeM3: nameplateM3,
      listedWeightKg,
      listedVolumeM3,
      remainingWeightKg: listedWeightKg,
      remainingVolumeM3: listedVolumeM3,
      allocatedWeightKg: 0,
      allocatedVolumeM3: 0,
      floorPrice,
      pricePerTonne:
        dto.pricePerTonne ??
        (listedWeightKg > 0 ? roundMoney(floorPrice / (listedWeightKg / 1000)) : null),
      pricePerM3: dto.pricePerM3 ?? null,
      currencyCode: (dto.currencyCode || trip?.currencyCode || 'USD').slice(0, 3),
      commissionRate: PLATFORM_CAPACITY_COMMISSION_RATE,
      compatibleCargoTypes: dto.compatibleCargoTypes?.length ? dto.compatibleCargoTypes : ['GENERAL'],
      generalCargoOnly: dto.generalCargoOnly !== false,
      allowMixing: dto.allowMixing !== false,
      bookingMode: dto.bookingMode || CapacityBookingMode.REQUEST,
      status: CapacityOfferStatus.OPEN,
      notes: dto.notes || null,
      loadIds: [],
    });
    return this.decorateOffer(await this.offerRepo.save(offer), truck);
  }

  async listOwnerOffers(tenantId: string, ownerId: string) {
    await this.expireStale(tenantId);
    const offers = await this.offerRepo.find({
      where: { tenantId, ownerId },
      order: { createdAt: 'DESC' },
    });
    return this.decorateMany(offers, tenantId);
  }

  async getOffer(id: string, tenantId: string, userId: string, role: string) {
    await this.expireStale(tenantId);
    const offer = await this.requireOffer(id, tenantId);
    if (role === 'TRUCK_OWNER' && offer.ownerId !== userId) {
      throw new ForbiddenException('You can only view your own listings');
    }
    const truck = await this.findTruckDetail({ id: offer.truckId, tenantId });
    const bookings =
      offer.ownerId === userId || ['ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(role)
        ? await this.bookingRepo.find({ where: { offerId: offer.id, tenantId }, order: { createdAt: 'DESC' } })
        : [];
    return { ...this.decorateOffer(offer, truck, true), bookings };
  }

  async updateOffer(id: string, dto: UpdateCapacityOfferDto, tenantId: string, ownerId: string) {
    const offer = await this.requireOwnedOffer(id, tenantId, ownerId);
    if (!OPEN_OFFER.includes(offer.status)) throw new BadRequestException('Closed listings cannot be edited');
    if (dto.floorPrice !== undefined) offer.floorPrice = roundMoney(dto.floorPrice);
    if (dto.pricePerTonne !== undefined) offer.pricePerTonne = dto.pricePerTonne;
    if (dto.pricePerM3 !== undefined) offer.pricePerM3 = dto.pricePerM3;
    if (dto.bookingMode) offer.bookingMode = dto.bookingMode;
    if (dto.notes !== undefined) offer.notes = dto.notes;
    return this.offerRepo.save(offer);
  }

  async closeOffer(id: string, tenantId: string, ownerId: string) {
    const offer = await this.requireOwnedOffer(id, tenantId, ownerId);
    if (!OPEN_OFFER.includes(offer.status)) throw new BadRequestException('Listing is already closed');
    const pending = await this.bookingRepo.count({
      where: { offerId: offer.id, status: CapacityBookingStatus.REQUESTED },
    });
    if (pending) throw new BadRequestException('Reject or accept pending requests before closing');
    offer.status = CapacityOfferStatus.CANCELLED;
    return this.offerRepo.save(offer);
  }

  async marketplace(query: SearchCapacityDto, tenantId: string) {
    await this.expireStale(tenantId);
    const offers = await this.offerRepo.find({
      where: { tenantId, status: In(OPEN_OFFER) },
      order: { departureAt: 'ASC' },
    });
    const trucks = await this.findTrucksByIds(tenantId, offers.map((o) => o.truckId));
    const search = await this.toSearchQuery(query, tenantId);
    const browse =
      !search.origin && !search.destination && !search.weightKg && !search.pickupAt;
    return offers
      .map((offer) => {
        const truck = trucks.find((t) => t.id === offer.truckId);
        const card = this.decorateOffer(offer, truck);
        const input = this.toMatchInput(offer);
        const hasSlice = Boolean(search.weightKg);
        const corridorOk = corridorOverlaps(input, search);
        const windowOk = windowsOverlap(input.departureAt, input.arrivalAt, search.pickupAt);
        const reason = browse
          ? null
          : hasSlice
            ? hardFilterOffer(input, search)
            : !corridorOk
              ? 'Cargo pickup/delivery are not on this truck working route'
              : !windowOk
                ? 'Pickup window does not overlap the truck departure'
                : null;
        const score = browse ? 0 : hasSlice ? scoreOffer(input, search) : reason ? 0 : 70;
        const quote = hasSlice ? this.quoteFromOffer(offer, search.weightKg, search.volumeM3 || 0) : null;
        return { ...card, matchScore: score, matchReason: reason, quote, bookable: !reason };
      })
      .filter((row) => browse || row.bookable)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime();
      });
  }

  async quote(offerId: string, dto: QuoteCapacityDto, tenantId: string) {
    const offer = await this.requireOffer(offerId, tenantId);
    const search: SearchQuery = {
      origin: dto.origin || offer.origin,
      destination: dto.destination || offer.destination,
      pickupAt: dto.pickupAt || offer.departureAt,
      weightKg: dto.weightKg,
      volumeM3: dto.volumeM3 || 0,
      cargoType: dto.cargoType || 'GENERAL',
      isHazardous: dto.isHazardous,
    };
    const reason = hardFilterOffer(this.toMatchInput(offer), search);
    if (reason) throw new BadRequestException(reason);
    return this.quoteFromOffer(offer, dto.weightKg, dto.volumeM3 || 0, dto.offeredPrice);
  }

  async assignableCargos(tenantId: string, cargoOwnerId: string) {
    const loads = await this.loadRepo.find({
      where: { tenantId, cargoOwnerId, status: In(ASSIGNABLE_LOAD_STATUS) },
      select: ASSIGNABLE_LOAD_SELECT,
      order: { pickupDate: 'DESC' },
      take: 80,
    });
    const live = await this.bookingRepo.find({
      where: { tenantId, cargoOwnerId, status: In(LIVE_BOOKING) },
    });
    const reserved = new Set(live.map((row) => row.loadId).filter(Boolean));
    return loads
      .filter((load) => !load.assignedTruckId && !reserved.has(load.id))
      .map((load) => ({
        id: load.id,
        title: load.title,
        weightKg: Number(load.weight) || 0,
        volumeM3: Number(load.volume) || 0,
        cargoType: load.cargoType || 'GENERAL',
        status: load.status,
        pickupDate: load.pickupDate,
        deliveryDate: load.deliveryDate,
        origin: this.placeFromLoad(load, 'origin'),
        destination: this.placeFromLoad(load, 'destination'),
        corridor: `${this.placeFromLoad(load, 'origin')?.name || 'Pickup'} → ${
          this.placeFromLoad(load, 'destination')?.name || 'Delivery'
        }`,
      }));
  }

  async book(offerId: string, dto: BookCapacityDto, tenantId: string, cargoOwnerId: string) {
    const presented = await this.dataSource.transaction(async (manager) => {
      const offer = await manager
        .createQueryBuilder(CapacityOffer, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id: offerId })
        .andWhere('o.tenantId = :tenantId', { tenantId })
        .getOne();
      if (!offer) throw new NotFoundException('Capacity listing not found');
      if (offer.ownerId === cargoOwnerId) {
        throw new BadRequestException('You cannot book leftover space on your own truck');
      }
      if (!dto.loadId) {
        throw new BadRequestException('Assign a cargo to this leftover-space truck before booking');
      }

      const cargo = await manager.findOne(Load, {
        where: { id: dto.loadId, tenantId, cargoOwnerId },
        select: ASSIGNABLE_LOAD_SELECT,
      });
      if (!cargo) throw new NotFoundException('Cargo not found');
      if (cargo.assignedTruckId && cargo.assignedTruckId !== offer.truckId) {
        throw new BadRequestException('This cargo is already assigned to another truck');
      }
      const alreadyBooked = await manager.findOne(CapacityBooking, {
        where: { tenantId, loadId: cargo.id, status: In(LIVE_BOOKING) },
      });
      if (alreadyBooked) {
        throw new BadRequestException('This cargo is already booked on leftover space');
      }

      const previousStatus = cargo.status;
      const origin = dto.origin || this.placeFromLoad(cargo, 'origin') || offer.origin;
      const destination = dto.destination || this.placeFromLoad(cargo, 'destination') || offer.destination;
      const weightKg = dto.weightKg || Number(cargo.weight) || 0;
      const volumeM3 = dto.volumeM3 || Number(cargo.volume) || 0;
      const pickupDate = new Date(dto.pickupDate || cargo.pickupDate || offer.departureAt);
      const deliveryDate = new Date(dto.deliveryDate || cargo.deliveryDate || offer.arrivalAt);
      const search: SearchQuery = {
        origin,
        destination,
        pickupAt: dto.pickupAt || pickupDate || offer.departureAt,
        weightKg,
        volumeM3,
        cargoType: dto.cargoType || cargo.cargoType || 'GENERAL',
        isHazardous: dto.isHazardous,
      };
      const reason = hardFilterOffer(this.toMatchInput(offer), search);
      if (reason) throw new BadRequestException(reason);
      if (weightKg <= 0) throw new BadRequestException('Cargo weight is required to book leftover space');

      const bookingCurrency = (dto.currencyCode || offer.currencyCode || 'USD').slice(0, 3).toUpperCase();
      const priced = this.quoteFromOffer(offer, weightKg, volumeM3, dto.offeredPrice, bookingCurrency);

      const reserved = applyBookingToSlice(
        {
          remainingWeightKg: Number(offer.remainingWeightKg),
          remainingVolumeM3: Number(offer.remainingVolumeM3),
          allocatedWeightKg: Number(offer.allocatedWeightKg),
          allocatedVolumeM3: Number(offer.allocatedVolumeM3),
        },
        weightKg,
        volumeM3,
        'reserve',
      );
      offer.remainingWeightKg = reserved.remainingWeightKg;
      offer.remainingVolumeM3 = reserved.remainingVolumeM3;
      offer.allocatedWeightKg = reserved.allocatedWeightKg;
      offer.allocatedVolumeM3 = reserved.allocatedVolumeM3;
      offer.status = nextOfferStatus(
        reserved.remainingWeightKg,
        reserved.remainingVolumeM3,
        offer.status,
      ) as CapacityOfferStatus;
      await manager.save(offer);

      cargo.status = LoadStatus.PENDING_CONFIRMATION;
      cargo.metadata = {
        ...(cargo.metadata || {}),
        capacityPendingOfferId: offer.id,
        previousLoadStatus: previousStatus,
      };
      await manager
        .createQueryBuilder()
        .update(Load)
        .set({ status: LoadStatus.PENDING_CONFIRMATION, metadata: cargo.metadata })
        .where('id = :id', { id: cargo.id })
        .execute();

      const booking = manager.create(CapacityBooking, {
        tenantId,
        offerId: offer.id,
        cargoOwnerId,
        loadId: cargo.id,
        weightKg: roundKg(weightKg),
        volumeM3: roundKg(volumeM3),
        cargoType: (dto.cargoType || cargo.cargoType || 'GENERAL').toUpperCase(),
        title: dto.title || cargo.title || `Shared capacity ${offer.origin.name} → ${offer.destination.name}`,
        freightAmount: priced.freightAmount,
        commissionRate: priced.commissionRate,
        commissionAmount: priced.commissionAmount,
        currencyCode: bookingCurrency,
        commissionStatus: CapacityCommissionStatus.PENDING,
        status: CapacityBookingStatus.REQUESTED,
        origin,
        destination,
        pickupDate,
        deliveryDate,
        metadata: {
          bookingMode: CapacityBookingMode.REQUEST,
          payer: 'CARGO_OWNER',
          offeredPrice: priced.freightAmount,
          previousLoadStatus: previousStatus,
        },
      });
      const saved = await manager.save(booking);
      return this.presentBooking(await manager.findOneByOrFail(CapacityBooking, { id: saved.id }), offer);
    });

    await this.notifyTruckOwnerOfRequest(presented, tenantId);
    return presented;
  }

  async acceptBooking(bookingId: string, tenantId: string, ownerId: string) {
    const presented = await this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(CapacityBooking, { where: { id: bookingId, tenantId } });
      if (!booking) throw new NotFoundException('Booking not found');
      const offer = await manager
        .createQueryBuilder(CapacityOffer, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id: booking.offerId })
        .getOne();
      if (!offer || offer.ownerId !== ownerId) throw new ForbiddenException('Not your listing');
      if (booking.status !== CapacityBookingStatus.REQUESTED) {
        throw new BadRequestException('Only requested bookings can be accepted');
      }
      booking.status = CapacityBookingStatus.CONFIRMED;
      await this.confirmInTx(manager, offer, booking, {}, tenantId, booking.cargoOwnerId);
      const truck = await manager.findOne(Truck, {
        where: { id: offer.truckId, tenantId },
        select: TRUCK_CARD_SELECT,
      });
      return this.presentBooking(booking, offer, { truck });
    });

    try {
      await this.notifyCargoOwnerOfDecision(presented, tenantId, 'accepted');
      await this.notifyDriverOfConfirmedCargo(presented, tenantId);
    } catch (err: any) {
      this.logger.warn(`Capacity accept notifications failed: ${err?.message}`);
    }
    return presented;
  }

  async rejectBooking(bookingId: string, tenantId: string, ownerId: string, reason?: string) {
    const presented = await this.releaseBooking(bookingId, tenantId, {
      actorId: ownerId,
      asOwner: true,
      status: CapacityBookingStatus.REJECTED,
      reason,
    });
    await this.notifyCargoOwnerOfDecision(presented, tenantId, 'rejected');
    return presented;
  }

  async cancelBooking(bookingId: string, tenantId: string, cargoOwnerId: string, reason?: string) {
    return this.releaseBooking(bookingId, tenantId, {
      actorId: cargoOwnerId,
      asOwner: false,
      status: CapacityBookingStatus.CANCELLED,
      reason,
    });
  }

  async listOwnerBookings(tenantId: string, ownerId: string) {
    const offers = await this.offerRepo.find({ where: { tenantId, ownerId } });
    if (!offers.length) return [];
    const bookings = await this.bookingRepo.find({
      where: { tenantId, offerId: In(offers.map((o) => o.id)) },
      order: { createdAt: 'DESC' },
    });
    const loadIds = [...new Set(bookings.map((b) => b.loadId).filter(Boolean))] as string[];
    const loads = loadIds.length
      ? await this.loadRepo.find({
          where: { tenantId, id: In(loadIds) },
          select: ASSIGNABLE_LOAD_SELECT,
        })
      : [];
    const trucks = await this.findTrucksByIds(
      tenantId,
      offers.map((o) => o.truckId),
    );
    return bookings.map((b) => {
      const offer = offers.find((o) => o.id === b.offerId);
      const load = loads.find((row) => row.id === b.loadId);
      const truck = trucks.find((row) => row.id === offer?.truckId);
      return this.presentBooking(b, offer, { load, truck });
    });
  }

  async listCargoBookings(tenantId: string, cargoOwnerId: string) {
    const bookings = await this.bookingRepo.find({
      where: { tenantId, cargoOwnerId },
      order: { createdAt: 'DESC' },
    });
    const offers = bookings.length
      ? await this.offerRepo.find({ where: { id: In(bookings.map((b) => b.offerId)) } })
      : [];
    return bookings.map((b) => this.presentBooking(b, offers.find((o) => o.id === b.offerId)));
  }

  async stats(tenantId: string, userId: string, role: string) {
    await this.expireStale(tenantId);
    if (role === 'TRUCK_OWNER') {
      const offers = await this.offerRepo.find({ where: { tenantId, ownerId: userId } });
      const bookings = offers.length
        ? await this.bookingRepo.find({ where: { tenantId, offerId: In(offers.map((o) => o.id)) } })
        : [];
      const confirmed = bookings.filter((b) =>
        [CapacityBookingStatus.CONFIRMED, CapacityBookingStatus.IN_TRANSIT, CapacityBookingStatus.COMPLETED].includes(
          b.status,
        ),
      );
      return {
        listings: offers.length,
        openListings: offers.filter((o) => OPEN_OFFER.includes(o.status)).length,
        bookings: bookings.length,
        matchedShipments: confirmed.length,
        residualKgSold: roundKg(confirmed.reduce((s, b) => s + Number(b.weightKg), 0)),
        freightEarned: roundMoney(confirmed.reduce((s, b) => s + Number(b.freightAmount), 0)),
        commissionAccrued: roundMoney(confirmed.reduce((s, b) => s + Number(b.commissionAmount), 0)),
      };
    }
    const bookings = await this.bookingRepo.find({ where: { tenantId, cargoOwnerId: userId } });
    const confirmed = bookings.filter((b) =>
      [CapacityBookingStatus.CONFIRMED, CapacityBookingStatus.IN_TRANSIT, CapacityBookingStatus.COMPLETED].includes(
        b.status,
      ),
    );
    return {
      bookings: bookings.length,
      matchedShipments: confirmed.length,
      freightSpend: roundMoney(confirmed.reduce((s, b) => s + Number(b.freightAmount), 0)),
      commissionPaid: roundMoney(confirmed.reduce((s, b) => s + Number(b.commissionAmount), 0)),
    };
  }

  private async confirmInTx(
    manager: any,
    offer: CapacityOffer,
    booking: CapacityBooking,
    dto: Partial<BookCapacityDto>,
    tenantId: string,
    cargoOwnerId: string,
  ) {
    const truck = await manager.findOne(Truck, {
      where: { id: offer.truckId, tenantId },
      select: TRUCK_CARD_SELECT,
    });
    if (!truck) throw new NotFoundException('Truck not found for this listing');
    const load = await this.ensureLoad(manager, offer, booking, dto, tenantId, cargoOwnerId, truck);
    const trip = await this.ensureTrip(manager, offer, booking, load, truck, tenantId);
    booking.loadId = load.id;
    booking.tripId = trip.id;
    booking.status = CapacityBookingStatus.CONFIRMED;
    offer.tripId = trip.id;
    offer.loadIds = Array.from(new Set([...(offer.loadIds || []), load.id]));
    load.status = LoadStatus.ASSIGNED;
    load.assignedTruckId = truck.id;
    load.assignedCarrierId = offer.ownerId;
    load.offeredPrice = Number(booking.freightAmount);
    load.currencyCode = booking.currencyCode || offer.currencyCode || load.currencyCode;
    load.metadata = {
      ...(load.metadata || {}),
      capacityOfferId: offer.id,
      capacityBookingId: booking.id,
      sharedCapacity: true,
    };
    await manager.save(load);
    await manager.save(offer);

    const due = new Date();
    due.setDate(due.getDate() + 7);
    const freightPay = manager.create(Payment, {
      tenantId,
      tripId: trip.id,
      payerId: cargoOwnerId,
      payeeId: offer.ownerId,
      amount: Number(booking.freightAmount),
      currency: booking.currencyCode || offer.currencyCode || 'USD',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentType: PaymentType.TRIP_PAYMENT,
      status: PaymentStatus.PENDING,
      dueDate: due,
      description: `Leftover capacity ${offer.origin.name} → ${offer.destination.name}`,
      referenceNumber: `CAP-FRT-${booking.id.slice(0, 8).toUpperCase()}`,
      metadata: { capacityBookingId: booking.id, offerId: offer.id, source: 'CAPACITY_MARKETPLACE' },
    });
    const commissionPay = manager.create(Payment, {
      tenantId,
      tripId: trip.id,
      payerId: cargoOwnerId,
      amount: Number(booking.commissionAmount),
      currency: booking.currencyCode || offer.currencyCode || 'USD',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentType: PaymentType.SERVICE_FEE,
      status: PaymentStatus.PENDING,
      dueDate: due,
      description: `Platform capacity-match commission ${booking.commissionRate}%`,
      referenceNumber: `CAP-COM-${booking.id.slice(0, 8).toUpperCase()}`,
      metadata: {
        capacityBookingId: booking.id,
        offerId: offer.id,
        source: 'CAPACITY_MATCH_COMMISSION',
        payer: 'CARGO_OWNER',
      },
    });
    const savedFreight = await manager.save(freightPay);
    const savedCommission = await manager.save(commissionPay);
    booking.freightPaymentId = savedFreight.id;
    booking.commissionPaymentId = savedCommission.id;
    booking.commissionStatus = CapacityCommissionStatus.PENDING;
    const nextAgreed = roundMoney(Number(trip.agreedPrice || 0) + Number(booking.freightAmount));
    trip.agreedPrice = nextAgreed;
    await manager
      .createQueryBuilder()
      .update(Trip)
      .set({ agreedPrice: nextAgreed })
      .where('id = :id', { id: trip.id })
      .execute();
    await manager.save(booking);
  }

  private async ensureLoad(
    manager: any,
    offer: CapacityOffer,
    booking: CapacityBooking,
    dto: Partial<BookCapacityDto>,
    tenantId: string,
    cargoOwnerId: string,
    truck: Truck,
  ): Promise<Load> {
    if (dto.loadId || booking.loadId) {
      const existing = await manager.findOne(Load, {
        where: { id: dto.loadId || booking.loadId, tenantId, cargoOwnerId },
      });
      if (!existing) throw new NotFoundException('Load not found');
      if (existing.assignedTruckId && existing.assignedTruckId !== truck.id) {
        throw new BadRequestException('This cargo is already assigned to another truck');
      }
      const origin = booking.origin || offer.origin;
      const destination = booking.destination || offer.destination;
      const pickup = booking.pickupDate || offer.departureAt;
      const delivery = booking.deliveryDate || offer.arrivalAt;
      existing.pickupDate = pickup;
      existing.deliveryDate = delivery;
      existing.offeredPrice = Number(booking.freightAmount);
      existing.locations = [
        this.locationPayload('PICKUP', 1, origin, pickup),
        this.locationPayload('DELIVERY', 2, destination, delivery),
      ];
      existing.origin = {
        address: origin.address || origin.name,
        city: origin.city || origin.name,
        country: origin.country || '',
        lat: origin.lat,
        lng: origin.lng,
      };
      existing.destination = {
        address: destination.address || destination.name,
        city: destination.city || destination.name,
        country: destination.country || '',
        lat: destination.lat,
        lng: destination.lng,
      };
      return existing;
    }
    if (booking.loadId) {
      const existing = await manager.findOne(Load, { where: { id: booking.loadId } });
      if (existing) return existing;
    }

    const origin = booking.origin || offer.origin;
    const destination = booking.destination || offer.destination;
    const pickup = booking.pickupDate || offer.departureAt;
    const delivery = booking.deliveryDate || offer.arrivalAt;
    const load = manager.create(Load, {
      tenantId,
      cargoOwnerId,
      title: booking.title || `Shared truck ${origin.name} → ${destination.name}`,
      description: `Leftover capacity booking on ${truck.plateNumber}. Platform commission ${booking.commissionRate}% billed to cargo owner.`,
      weight: Number(booking.weightKg),
      volume: Number(booking.volumeM3) || 1,
      cargoType: CargoType.GENERAL,
      loadType: LoadType.LTL,
      equipmentType: EquipmentType.DRY_VAN,
      visibility: Visibility.PUBLIC,
      unitsRequired: 1,
      pickupDate: pickup,
      deliveryDate: delivery,
      loadValue: dto.loadValue || Number(booking.freightAmount),
      offeredPrice: Number(booking.freightAmount),
      currencyCode: booking.currencyCode || offer.currencyCode,
      paymentTerms: PaymentTerms.NET_30,
      urgencyLevel: UrgencyLevel.NORMAL,
      packagingType: PackagingType.PALLETIZED,
      status: LoadStatus.ASSIGNED,
      locations: [
        this.locationPayload('PICKUP', 1, origin, pickup),
        this.locationPayload('DELIVERY', 2, destination, delivery),
      ],
      origin: {
        address: origin.address || origin.name,
        city: origin.city || origin.name,
        country: origin.country || '',
        lat: origin.lat,
        lng: origin.lng,
      },
      destination: {
        address: destination.address || destination.name,
        city: destination.city || destination.name,
        country: destination.country || '',
        lat: destination.lat,
        lng: destination.lng,
      },
      isFragile: false,
      isHazardous: false,
      requiresRefrigeration: false,
      contactInfo: {},
      autoMatchEnabled: false,
      matchingCriteria: { capacityOfferId: offer.id },
      truckRequirements: {},
      carrierPreferences: {},
      costPreferences: { maxBudget: Number(booking.freightAmount) },
      assignedTruckId: truck.id,
      assignedCarrierId: offer.ownerId,
      metadata: { capacityOfferId: offer.id, sharedCapacity: true },
    });
    return manager.save(load);
  }

  private async ensureTrip(
    manager: any,
    offer: CapacityOffer,
    booking: CapacityBooking,
    load: Load,
    truck: Truck,
    tenantId: string,
  ): Promise<Trip> {
    if (offer.tripId) {
      // Explicit select only — never SELECT */save full Trip (PostGIS + delay columns break prod).
      const existing = await manager
        .createQueryBuilder(Trip, 'trip')
        .select(TRIP_CARD_SELECT)
        .where('trip.id = :id', { id: offer.tripId })
        .andWhere('trip.tenantId = :tenantId', { tenantId })
        .getOne();
      if (existing) {
        const driverId = existing.driverId || truck.currentDriverId || null;
        this.attachExtraCargoStop(existing, offer, booking, load, truck);
        await manager
          .createQueryBuilder()
          .update(Trip)
          .set({
            driverId,
            notes: existing.notes || null,
          })
          .where('id = :id', { id: existing.id })
          .execute();
        existing.driverId = driverId;
        return existing;
      }
    }
    const trip = manager.create(Trip, {
      tenantId,
      loadId: load.id,
      truckId: truck.id,
      driverId: truck.currentDriverId || null,
      tripNumber: `CAP-${Date.now()}-${offer.id.slice(0, 6).toUpperCase()}`,
      status: TripStatus.PLANNED,
      plannedStartTime: offer.departureAt,
      plannedEndTime: offer.arrivalAt,
      agreedPrice: Number(booking.freightAmount),
      currencyCode: booking.currencyCode || offer.currencyCode,
      notes: `Shared-capacity trip ${offer.origin.name} → ${offer.destination.name}`,
    });
    return manager.save(trip);
  }

  private async releaseBooking(
    bookingId: string,
    tenantId: string,
    opts: { actorId: string; asOwner: boolean; status: CapacityBookingStatus; reason?: string },
  ) {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(CapacityBooking, { where: { id: bookingId, tenantId } });
      if (!booking) throw new NotFoundException('Booking not found');
      const offer = await manager
        .createQueryBuilder(CapacityOffer, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id: booking.offerId })
        .getOne();
      if (!offer) throw new NotFoundException('Listing not found');
      if (opts.asOwner && offer.ownerId !== opts.actorId) throw new ForbiddenException('Not your listing');
      if (!opts.asOwner && booking.cargoOwnerId !== opts.actorId) throw new ForbiddenException('Not your booking');
      if (![CapacityBookingStatus.REQUESTED, CapacityBookingStatus.CONFIRMED].includes(booking.status)) {
        throw new BadRequestException('This booking can no longer be released');
      }
      const released = applyBookingToSlice(
        {
          remainingWeightKg: Number(offer.remainingWeightKg),
          remainingVolumeM3: Number(offer.remainingVolumeM3),
          allocatedWeightKg: Number(offer.allocatedWeightKg),
          allocatedVolumeM3: Number(offer.allocatedVolumeM3),
        },
        Number(booking.weightKg),
        Number(booking.volumeM3),
        'release',
      );
      offer.remainingWeightKg = released.remainingWeightKg;
      offer.remainingVolumeM3 = released.remainingVolumeM3;
      offer.allocatedWeightKg = released.allocatedWeightKg;
      offer.allocatedVolumeM3 = released.allocatedVolumeM3;
      if (OPEN_OFFER.includes(offer.status) || offer.status === CapacityOfferStatus.FULL) {
        offer.status =
          released.allocatedWeightKg > 0 ? CapacityOfferStatus.PARTIALLY_BOOKED : CapacityOfferStatus.OPEN;
      }
      booking.status = opts.status;
      booking.rejectionReason = opts.reason || null;
      booking.commissionStatus = CapacityCommissionStatus.CANCELLED;
      await manager.save(offer);
      await manager.save(booking);
      if (booking.loadId) {
        await this.restorePendingLoad(manager, booking);
      }
      return this.presentBooking(booking, offer);
    });
  }

  private async expireStale(tenantId: string) {
    try {
      await this.offerRepo
        .createQueryBuilder()
        .update(CapacityOffer)
        .set({ status: CapacityOfferStatus.EXPIRED })
        .where('"tenantId" = :tenantId', { tenantId })
        .andWhere('"status" IN (:...status)', { status: OPEN_OFFER })
        .andWhere('"arrivalAt" < :now', { now: new Date() })
        .execute();
    } catch (err: any) {
      this.logger.warn(`Could not expire stale capacity offers: ${err?.message}`);
    }
  }

  private async toSearchQuery(query: SearchCapacityDto, tenantId: string): Promise<SearchQuery> {
    const originCity = query.originCity || query.pickupLocation || query.pickupCity;
    const destinationCity = query.destinationCity || query.deliveryLocation || query.deliveryCity;
    let origin: any = query.originLat && query.originLng
      ? { name: originCity || '', city: originCity, lat: query.originLat, lng: query.originLng }
      : null;
    let destination: any = query.destinationLat && query.destinationLng
      ? { name: destinationCity || '', city: destinationCity, lat: query.destinationLat, lng: query.destinationLng }
      : null;
    if (!origin && originCity) origin = { name: originCity, city: originCity };
    if (!destination && destinationCity) destination = { name: destinationCity, city: destinationCity };

    let weightKg = query.weightKg || 0;
    let volumeM3 = query.volumeM3 || 0;
    let cargoType = query.cargoType || 'GENERAL';
    if (query.loadId) {
      const load = await this.loadRepo.findOne({ where: { id: query.loadId, tenantId } });
      if (load) {
        weightKg = weightKg || Number(load.weight);
        volumeM3 = volumeM3 || Number(load.volume) || 0;
        cargoType = load.cargoType || cargoType;
        origin = origin || this.placeFromLoad(load, 'origin');
        destination = destination || this.placeFromLoad(load, 'destination');
      }
    }
    return {
      origin,
      destination,
      pickupAt: query.pickupAt,
      weightKg,
      volumeM3,
      cargoType,
    };
  }

  private cityHint(query: any, offerPoint: CapacityPlace) {
    const q = `${query?.city || query?.name || ''}`.trim().toLowerCase();
    if (!q) return true;
    const o = `${offerPoint?.city || offerPoint?.name || ''}`.trim().toLowerCase();
    return o.includes(q) || q.includes(o);
  }

  private quoteFromOffer(
    offer: CapacityOffer,
    weightKg: number,
    volumeM3: number,
    offeredPrice?: number,
    currencyCode?: string,
  ) {
    const suggestedFreight = quoteFreight(this.toMatchInput(offer), weightKg, volumeM3);
    const freightAmount = resolveOfferedFreight(suggestedFreight, offeredPrice);
    const commission = quoteCommission(freightAmount, Number(offer.commissionRate));
    return {
      freightAmount,
      suggestedFreight,
      offeredPrice: offeredPrice != null ? roundMoney(Number(offeredPrice)) : null,
      commissionRate: commission.rate,
      commissionAmount: commission.amount,
      totalDue: roundMoney(freightAmount + commission.amount),
      currencyCode: (currencyCode || offer.currencyCode || 'USD').slice(0, 3).toUpperCase(),
      payer: 'CARGO_OWNER' as const,
      commissionPayee: 'PLATFORM',
      remainingWeightKg: Number(offer.remainingWeightKg),
      remainingVolumeM3: Number(offer.remainingVolumeM3),
    };
  }

  private toMatchInput(offer: CapacityOffer): OfferMatchInput {
    return {
      origin: offer.origin,
      destination: offer.destination,
      departureAt: offer.departureAt,
      arrivalAt: offer.arrivalAt,
      remainingWeightKg: Number(offer.remainingWeightKg),
      remainingVolumeM3: Number(offer.remainingVolumeM3),
      listedWeightKg: Number(offer.listedWeightKg),
      listedVolumeM3: Number(offer.listedVolumeM3),
      floorPrice: Number(offer.floorPrice),
      pricePerTonne: offer.pricePerTonne == null ? null : Number(offer.pricePerTonne),
      pricePerM3: offer.pricePerM3 == null ? null : Number(offer.pricePerM3),
      commissionRate: Number(offer.commissionRate),
      compatibleCargoTypes: offer.compatibleCargoTypes || ['GENERAL'],
      generalCargoOnly: offer.generalCargoOnly,
      allowMixing: offer.allowMixing,
      status: offer.status as any,
    };
  }

  private decorateOffer(offer: CapacityOffer, truck?: Truck | null, fullTruck = false) {
    const listed = Number(offer.listedWeightKg) || 1;
    const sold = Number(offer.allocatedWeightKg) || 0;
    return {
      ...offer,
      nameplateWeightKg: Number(offer.nameplateWeightKg),
      remainingWeightKg: Number(offer.remainingWeightKg),
      remainingVolumeM3: Number(offer.remainingVolumeM3),
      listedWeightKg: Number(offer.listedWeightKg),
      allocatedWeightKg: sold,
      floorPrice: Number(offer.floorPrice),
      pricePerTonne: offer.pricePerTonne == null ? null : Number(offer.pricePerTonne),
      commissionRate: Number(offer.commissionRate),
      utilizationOfRemainder: utilizationPercent(sold, listed),
      emptyPercent: utilizationPercent(Number(offer.remainingWeightKg), Number(offer.nameplateWeightKg)),
      corridor: `${offer.origin?.name} → ${offer.destination?.name}`,
      truck: truck ? this.presentTruck(truck, fullTruck) : null,
    };
  }

  private presentTruck(truck: Truck, full = false) {
    const card = {
      id: truck.id,
      plateNumber: truck.plateNumber,
      make: truck.make,
      model: truck.model,
      year: (truck as any).year ?? null,
      color: (truck as any).color ?? null,
      vin: (truck as any).vin ?? null,
      status: truck.status,
      truckType: (truck as any).truckType ?? null,
      trailerType: (truck as any).trailerType ?? null,
      fuelType: (truck as any).fuelType ?? null,
      capacityWeight: Number(truck.capacityWeight),
      capacityVolume: Number(truck.capacityVolume),
      maxLength: (truck as any).maxLength == null ? null : Number((truck as any).maxLength),
      maxWidth: (truck as any).maxWidth == null ? null : Number((truck as any).maxWidth),
      maxHeight: (truck as any).maxHeight == null ? null : Number((truck as any).maxHeight),
      manufacturer: (truck as any).manufacturer ?? null,
      chassis: (truck as any).chassis ?? null,
      availabilityStatus: (truck as any).availabilityStatus ?? null,
      ownershipType: (truck as any).ownershipType ?? null,
      vehicleClass: (truck as any).vehicleClass ?? null,
      chassisConfiguration: (truck as any).chassisConfiguration ?? null,
      fleetGroup: (truck as any).fleetGroup ?? null,
    };
    if (!full) return card;
    const capabilities: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(truck as any)) {
      if (key.startsWith('has') && typeof value === 'boolean' && value) {
        capabilities[key] = true;
      }
    }
    return { ...card, ...capabilities };
  }

  private async decorateMany(offers: CapacityOffer[], tenantId: string) {
    const trucks = await this.findTrucksByIds(tenantId, offers.map((o) => o.truckId));
    const bookings = offers.length
      ? await this.bookingRepo.find({ where: { tenantId, offerId: In(offers.map((o) => o.id)) } })
      : [];
    return offers.map((offer) => ({
      ...this.decorateOffer(offer, trucks.find((t) => t.id === offer.truckId)),
      bookingCount: bookings.filter((b) => b.offerId === offer.id && LIVE_BOOKING.includes(b.status)).length,
      pendingRequests: bookings.filter(
        (b) => b.offerId === offer.id && b.status === CapacityBookingStatus.REQUESTED,
      ).length,
    }));
  }

  private presentBooking(
    booking: CapacityBooking,
    offer?: CapacityOffer,
    extras?: { load?: Load | null; truck?: Truck | null },
  ) {
    const pickup = this.formatPlaceName(booking.origin) || offer?.origin?.name;
    const delivery = this.formatPlaceName(booking.destination) || offer?.destination?.name;
    const load = extras?.load;
    const truck = extras?.truck;
    return {
      ...booking,
      weightKg: Number(booking.weightKg),
      volumeM3: Number(booking.volumeM3),
      freightAmount: Number(booking.freightAmount),
      offeredPrice: Number(booking.freightAmount),
      commissionAmount: Number(booking.commissionAmount),
      commissionRate: Number(booking.commissionRate),
      totalDue: roundMoney(Number(booking.freightAmount) + Number(booking.commissionAmount)),
      corridor: offer ? `${offer.origin?.name} → ${offer.destination?.name}` : null,
      pickupLabel: pickup || null,
      deliveryLabel: delivery || null,
      bookingMode: CapacityBookingMode.REQUEST,
      offerStatus: offer?.status,
      truckId: offer?.truckId,
      ownerId: offer?.ownerId,
      truckPlate: truck?.plateNumber || null,
      truckMake: truck?.make || null,
      truckModel: truck?.model || null,
      load: load
        ? {
            id: load.id,
            title: load.title,
            description: (load as any).description || null,
            weightKg: Number(load.weight) || Number(booking.weightKg),
            volumeM3: Number(load.volume) || Number(booking.volumeM3) || 0,
            cargoType: load.cargoType || booking.cargoType,
            status: load.status,
            pickupDate: load.pickupDate || booking.pickupDate,
            deliveryDate: load.deliveryDate || booking.deliveryDate,
            origin: this.placeFromLoad(load, 'origin') || booking.origin || null,
            destination: this.placeFromLoad(load, 'destination') || booking.destination || null,
          }
        : {
            id: booking.loadId || null,
            title: booking.title,
            description: null,
            weightKg: Number(booking.weightKg),
            volumeM3: Number(booking.volumeM3) || 0,
            cargoType: booking.cargoType,
            status: null,
            pickupDate: booking.pickupDate,
            deliveryDate: booking.deliveryDate,
            origin: booking.origin || null,
            destination: booking.destination || null,
          },
    };
  }

  private tripLoadQuery() {
    return this.tripRepo
      .createQueryBuilder('trip')
      .leftJoin('trip.load', 'load')
      .select(TRIP_CARD_SELECT)
      .addSelect(LOAD_CARD_SELECT);
  }

  private findActiveTripsWithLoads(tenantId: string, truckIds: string[]) {
    const ids = [...new Set(truckIds.filter(Boolean))];
    if (!ids.length) return Promise.resolve([] as Trip[]);
    return this.tripLoadQuery()
      .where('trip.tenantId = :tenantId', { tenantId })
      .andWhere('trip.truckId IN (:...ids)', { ids })
      .andWhere('CAST(trip.status AS varchar) IN (:...status)', { status: ACTIVE_TRIP })
      .orderBy('trip.plannedStartTime', 'ASC')
      .getMany();
  }

  private findTripWithLoad(where: { id: string; tenantId: string; truckId: string }) {
    return this.tripLoadQuery()
      .where('trip.id = :id', { id: where.id })
      .andWhere('trip.tenantId = :tenantId', { tenantId: where.tenantId })
      .andWhere('trip.truckId = :truckId', { truckId: where.truckId })
      .getOne();
  }

  private findTrucks(where: FindOptionsWhere<Truck>) {
    return this.truckRepo.find({ where, select: TRUCK_CARD_SELECT });
  }

  private findTruck(where: FindOptionsWhere<Truck>) {
    return this.truckRepo.findOne({ where, select: TRUCK_CARD_SELECT });
  }

  private async findTruckDetail(where: FindOptionsWhere<Truck>) {
    try {
      return await this.truckRepo.findOne({ where, select: TRUCK_DETAIL_SELECT });
    } catch (err: any) {
      this.logger.warn(`Truck detail select failed, falling back to card fields: ${err?.message}`);
      return this.findTruck(where);
    }
  }

  private findTrucksByIds(tenantId: string, ids: string[]) {
    const truckIds = [...new Set(ids.filter(Boolean))];
    if (!truckIds.length) return Promise.resolve([] as Truck[]);
    return this.truckRepo.find({
      where: { tenantId, id: In(truckIds) },
      select: TRUCK_CARD_SELECT,
    });
  }

  private async requireOffer(id: string, tenantId: string) {
    const offer = await this.offerRepo.findOne({ where: { id, tenantId } });
    if (!offer) throw new NotFoundException('Capacity listing not found');
    return offer;
  }

  private async requireOwnedOffer(id: string, tenantId: string, ownerId: string) {
    const offer = await this.requireOffer(id, tenantId);
    if (offer.ownerId !== ownerId) throw new ForbiddenException('Not your listing');
    return offer;
  }

  private normalizePlace(place: CapacityPlace): CapacityPlace {
    return {
      name: place.name,
      city: place.city || place.name,
      country: place.country,
      countryCode: place.countryCode,
      address: place.address || place.name,
      lat: Number(place.lat),
      lng: Number(place.lng),
    };
  }

  private isCoordinateLabel(value?: string | null): boolean {
    return !!value && /^Lat:\s*-?\d/i.test(value.trim());
  }

  private formatPlaceLabel(parts: {
    name?: string;
    city?: string;
    country?: string;
    address?: string;
  }): string {
    const city = parts.city?.trim();
    const country = parts.country?.trim();
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    const name = parts.name?.trim();
    if (name && !this.isCoordinateLabel(name)) return name;
    const address = parts.address?.trim();
    if (address && !this.isCoordinateLabel(address)) return address;
    if (country) return country;
    return 'Location';
  }

  private routeLocation(load: Load, side: 'origin' | 'destination'): LoadLocation | undefined {
    const locations = Array.isArray(load.locations) ? load.locations : [];
    const type = side === 'origin' ? 'PICKUP' : 'DELIVERY';
    return locations.find((loc) => loc?.type === type);
  }

  private placeFromLoad(load: Load | undefined, side: 'origin' | 'destination'): CapacityPlace | null {
    if (!load) return null;
    const addr = side === 'origin' ? load.origin : load.destination;
    const routeLoc = this.routeLocation(load, side);
    const data = routeLoc?.locationData;
    const lat = Number(addr?.lat ?? data?.coordinates?.latitude) || 0;
    const lng = Number(addr?.lng ?? data?.coordinates?.longitude) || 0;
    const city = addr?.city || data?.city;
    const country = addr?.country || data?.country;
    const address = addr?.address || data?.address;
    const name = this.formatPlaceLabel({ name: data?.name, city, country, address });
    if (!lat && !lng && !city && !address) return null;
    const readableAddress = address && !this.isCoordinateLabel(address) ? address : name;
    return {
      name,
      city: city || name,
      country,
      address: readableAddress,
      lat,
      lng,
    };
  }

  private locationPayload(type: 'PICKUP' | 'DELIVERY', sequence: number, place: CapacityPlace, when: Date) {
    return {
      id: `${type}-${sequence}`,
      type,
      sequence,
      scheduledDate: when,
      estimatedTime: 60,
      locationData: {
        name: place.name,
        address: place.address || place.name,
        city: place.city || place.name,
        country: place.country,
        coordinates: { latitude: place.lat, longitude: place.lng },
      },
    };
  }

  private formatPlaceName(place?: CapacityPlace | null) {
    if (!place) return '';
    return this.formatPlaceLabel({
      name: place.name,
      city: place.city,
      country: place.country,
      address: place.address,
    });
  }

  private formatWhen(value?: Date | string | null) {
    if (!value) return 'TBD';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'TBD';
    return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private leftoverOrdinal(offer: CapacityOffer, loadId: string) {
    const prior = (offer.loadIds || []).filter((id) => id !== loadId).length;
    if (prior === 0) return 'second';
    if (prior === 1) return 'third';
    return `#${prior + 2}`;
  }

  private attachExtraCargoStop(
    trip: Trip,
    offer: CapacityOffer,
    booking: CapacityBooking,
    load: Load,
    truck: Truck,
  ) {
    const pickup = this.formatPlaceName(booking.origin) || offer.origin?.name || 'Pickup';
    const delivery = this.formatPlaceName(booking.destination) || offer.destination?.name || 'Delivery';
    const ordinal = this.leftoverOrdinal(offer, load.id);
    const line = `Leftover cargo (${ordinal}) on ${truck.plateNumber}: pickup ${pickup} at ${this.formatWhen(
      booking.pickupDate,
    )}; delivery ${delivery} at ${this.formatWhen(booking.deliveryDate)}.`;
    trip.notes = [trip.notes, line].filter(Boolean).join('\n');
  }

  private async restorePendingLoad(manager: any, booking: CapacityBooking) {
    const load = await manager.findOne(Load, { where: { id: booking.loadId } });
    if (!load) return;
    const previous =
      booking.metadata?.previousLoadStatus ||
      load.metadata?.previousLoadStatus ||
      LoadStatus.PUBLISHED;
    const metadata = { ...(load.metadata || {}) };
    delete metadata.capacityPendingOfferId;
    delete metadata.previousLoadStatus;
    await manager
      .createQueryBuilder()
      .update(Load)
      .set({
        status: previous,
        assignedTruckId: null,
        metadata,
      })
      .where('id = :id', { id: load.id })
      .execute();
  }

  private async notifySafe(
    payload: {
      tenantId: string;
      recipientId?: string | null;
      title: string;
      message: string;
      notificationType: NotificationType;
      entityType: EntityType;
      entityId?: string;
      actionUrl: string;
      actionText: string;
      channels?: NotificationChannel[];
      requiresAction?: boolean;
    },
  ) {
    if (!payload.recipientId) {
      this.logger.warn(`Capacity notification skipped (no recipient): ${payload.title}`);
      return;
    }
    try {
      await this.notifications.createNotification({
        tenantId: payload.tenantId,
        recipientId: payload.recipientId,
        title: payload.title,
        message: payload.message,
        notificationType: payload.notificationType,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        channels: payload.channels || [
          NotificationChannel.IN_APP,
          NotificationChannel.PUSH,
          NotificationChannel.EMAIL,
        ],
        entityType: payload.entityType,
        entityId: payload.entityId,
        requiresAction: payload.requiresAction ?? false,
        actionUrl: payload.actionUrl,
        actionText: payload.actionText,
      });
    } catch (err: any) {
      this.logger.warn(`Capacity notification failed: ${err?.message}`);
    }
  }

  private async notifyTruckOwnerOfRequest(booking: any, tenantId: string) {
    const pickup = booking.pickupLabel || this.formatPlaceName(booking.origin);
    const delivery = booking.deliveryLabel || this.formatPlaceName(booking.destination);
    await this.notifySafe({
      tenantId,
      recipientId: booking.ownerId,
      title: 'Leftover space booking request',
      message: `${booking.title || 'Cargo'} asked to use leftover space on your truck. Offered ${Number(
        booking.freightAmount,
      ).toFixed(2)} ${booking.currencyCode || ''}. Pickup ${pickup} at ${this.formatWhen(
        booking.pickupDate,
      )}; delivery ${delivery} at ${this.formatWhen(booking.deliveryDate)}. Confirm to ship.`,
      notificationType: NotificationType.TRIP_CREATED,
      entityType: EntityType.CARGO,
      entityId: booking.id,
      actionUrl: '/dashboard/fleet/capacity',
      actionText: 'Review request',
      requiresAction: true,
    });
  }

  private async notifyCargoOwnerOfDecision(booking: any, tenantId: string, decision: 'accepted' | 'rejected') {
    const accepted = decision === 'accepted';
    const recipientId = booking.cargoOwnerId;
    if (!recipientId) {
      this.logger.warn(`Cannot notify cargo owner for booking ${booking.id}: missing cargoOwnerId`);
      return;
    }

    const truck =
      booking.truckPlate || !booking.truckId
        ? null
        : await this.findTruck({ id: booking.truckId, tenantId });
    const plate = booking.truckPlate || truck?.plateNumber || 'the truck';
    const pickup = booking.pickupLabel || this.formatPlaceName(booking.origin) || 'pickup';
    const delivery = booking.deliveryLabel || this.formatPlaceName(booking.destination) || 'delivery';
    const price = `${Number(booking.freightAmount || booking.offeredPrice || 0).toFixed(2)} ${
      booking.currencyCode || ''
    }`.trim();

    await this.notifySafe({
      tenantId,
      recipientId,
      title: accepted ? 'Shipping confirmed — leftover space accepted' : 'Leftover space request declined',
      message: accepted
        ? `Good news: the truck owner accepted your offered price (${price}) and will ship "${
            booking.title || 'your cargo'
          }" on ${plate}. Pickup at ${pickup} on ${this.formatWhen(
            booking.pickupDate,
          )}; delivery at ${delivery} on ${this.formatWhen(booking.deliveryDate)}.`
        : `The truck owner declined leftover space for "${booking.title || 'your cargo'}"${
            booking.rejectionReason ? `: ${booking.rejectionReason}` : '.'
          } You can request another leftover listing.`,
      notificationType: accepted ? NotificationType.SMART_MATCH_SELECTED : NotificationType.TRIP_CANCELLED,
      entityType: EntityType.CARGO,
      entityId: booking.loadId || booking.id,
      actionUrl: '/dashboard/available-space',
      actionText: accepted ? 'View confirmation' : 'Find other space',
      requiresAction: !accepted,
    });
  }

  private async notifyDriverOfConfirmedCargo(booking: any, tenantId: string) {
    try {
      await this.notifyDriverOfConfirmedCargoUnsafe(booking, tenantId);
    } catch (err: any) {
      this.logger.warn(`Driver leftover-cargo notification failed: ${err?.message}`);
    }
  }

  private async notifyDriverOfConfirmedCargoUnsafe(booking: any, tenantId: string) {
    const truck = booking.truckId ? await this.findTruck({ id: booking.truckId, tenantId }) : null;
    const trip = booking.tripId
      ? await this.tripRepo.findOne({ where: { id: booking.tripId, tenantId }, select: ['id', 'driverId', 'tripNumber'] })
      : null;
    const driverRecordId = trip?.driverId || truck?.currentDriverId;
    if (!driverRecordId) {
      await this.notifySafe({
        tenantId,
        recipientId: booking.ownerId,
        title: 'Assign a driver for leftover cargo',
        message: `You confirmed leftover cargo "${booking.title || 'cargo'}" on ${
          truck?.plateNumber || 'this truck'
        }, but no driver is assigned yet. Assign a driver so they get the pickup and delivery details.`,
        notificationType: NotificationType.DRIVER_ASSIGNMENT,
        entityType: EntityType.TRIP,
        entityId: booking.tripId,
        actionUrl: '/dashboard/fleet/capacity',
        actionText: 'Assign driver',
      });
      return;
    }

    const driver = await this.driverRepo.findOne({
      where: { id: driverRecordId },
      select: ['id', 'userId', 'firstName', 'lastName'],
    });
    if (!driver?.userId) {
      await this.notifySafe({
        tenantId,
        recipientId: booking.ownerId,
        title: 'Assign a driver for leftover cargo',
        message: `You confirmed leftover cargo "${booking.title || 'cargo'}" on ${
          truck?.plateNumber || 'this truck'
        }, but the assigned driver has no login. The driver cannot be notified of pickup and delivery.`,
        notificationType: NotificationType.DRIVER_ASSIGNMENT,
        entityType: EntityType.TRIP,
        entityId: booking.tripId,
        actionUrl: '/dashboard/fleet/capacity',
        actionText: 'Assign driver',
      });
      return;
    }
    const offer = await this.offerRepo.findOne({ where: { id: booking.offerId, tenantId } });
    const ordinal = offer ? this.leftoverOrdinal(offer, booking.loadId) : 'additional';
    const pickup = booking.pickupLabel || this.formatPlaceName(booking.origin);
    const delivery = booking.deliveryLabel || this.formatPlaceName(booking.destination);
    await this.notifySafe({
      tenantId,
      recipientId: driver?.userId,
      title: `Extra leftover cargo (${ordinal}) assigned`,
      message: `You are in charge of shipping this leftover cargo on ${
        truck?.plateNumber || 'your truck'
      }: "${booking.title || 'Cargo'}". Pickup ${pickup} at ${this.formatWhen(
        booking.pickupDate,
      )}. Delivery ${delivery} at ${this.formatWhen(booking.deliveryDate)}.`,
      notificationType: NotificationType.DRIVER_ASSIGNMENT,
      entityType: EntityType.TRIP,
      entityId: booking.tripId || booking.loadId,
      actionUrl: `/dashboard/driver/cargo`,
      actionText: 'View cargo',
    });
  }

  private suggestFloor(remainingKg: number, trip?: Trip | null) {
    const rate = Number(trip?.agreedPrice) && remainingKg
      ? (Number(trip.agreedPrice) / Math.max(Number(trip.load?.weight) || remainingKg, 1)) * remainingKg * 0.9
      : (remainingKg / 1000) * 160;
    return Math.max(80, rate);
  }
}
