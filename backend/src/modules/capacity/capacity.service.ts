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
import {
  Load,
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
  hardFilterOffer,
  nextOfferStatus,
  PLATFORM_CAPACITY_COMMISSION_RATE,
  quoteCommission,
  quoteFreight,
  isLeftoverSellableSlice,
  remainingFromTrip,
  roundKg,
  roundMoney,
  scoreOffer,
  suggestListedRemainder,
  utilizationPercent,
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

@Injectable()
export class CapacityService implements OnModuleInit {
  private readonly logger = new Logger(CapacityService.name);

  constructor(
    @InjectRepository(CapacityOffer) private readonly offerRepo: Repository<CapacityOffer>,
    @InjectRepository(CapacityBooking) private readonly bookingRepo: Repository<CapacityBooking>,
    @InjectRepository(Truck) private readonly truckRepo: Repository<Truck>,
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Load) private readonly loadRepo: Repository<Load>,
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
          "bookingMode" character varying(16) NOT NULL DEFAULT 'INSTANT',
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
    const trips = await this.tripRepo.find({
      where: { tenantId, status: In(ACTIVE_TRIP) },
      relations: ['load'],
    });
    const liveOffers = await this.offerRepo.find({
      where: { tenantId, ownerId, status: In(OPEN_OFFER) },
    });

    return trucks
      .filter((truck) => [VehicleStatus.AVAILABLE, VehicleStatus.IN_TRANSIT].includes(truck.status))
      .map((truck) => {
        const trip = trips.find((t) => t.truckId === truck.id);
        const offer = liveOffers.find((o) => o.truckId === truck.id);
        const nameplateKg = Number(truck.capacityWeight) || 0;
        const nameplateM3 = Number(truck.capacityVolume) || 0;
        const loadKg = Number(trip?.load?.weight) || 0;
        const loadM3 = Number(trip?.load?.volume) || 0;
        const bookedKg = Number(offer?.allocatedWeightKg) || 0;
        const bookedM3 = Number(offer?.allocatedVolumeM3) || 0;
        const allocatedKg = loadKg + bookedKg;
        const allocatedM3 = loadM3 + bookedM3;
        const slice = remainingFromTrip(nameplateKg, nameplateM3, allocatedKg, allocatedM3);
        const utilization = utilizationPercent(allocatedKg, nameplateKg);
        const row = {
          truckId: truck.id,
          plateNumber: truck.plateNumber,
          make: truck.make,
          model: truck.model,
          status: truck.status,
          nameplateWeightKg: nameplateKg,
          nameplateVolumeM3: nameplateM3,
          tripId: trip?.id || null,
          tripNumber: trip?.tripNumber || null,
          cargoTitle: trip?.load?.title || null,
          loadedWeightKg: loadKg,
          corridor: trip
            ? {
                origin: this.placeFromLoad(trip.load, 'origin'),
                destination: this.placeFromLoad(trip.load, 'destination'),
                departureAt: trip.plannedStartTime,
                arrivalAt: trip.plannedEndTime,
              }
            : null,
          remainingWeightKg: offer ? Number(offer.remainingWeightKg) : slice.remainingWeightKg,
          remainingVolumeM3: offer ? Number(offer.remainingVolumeM3) : slice.remainingVolumeM3,
          allocatedWeightKg: allocatedKg,
          utilizationPercent: utilization,
          emptyPercent: roundKg(100 - utilization),
          canList: isLeftoverSellableSlice({
            tripId: trip?.id,
            allocatedWeightKg: allocatedKg,
            remainingWeightKg: slice.remainingWeightKg,
            utilizationPercent: utilization,
            existingOfferId: offer?.id,
          }),
          existingOfferId: offer?.id || null,
          suggestedFloorPrice: roundMoney(this.suggestFloor(slice.remainingWeightKg, trip)),
        };
        return row;
      })
      .filter((row) =>
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

    const live = await this.offerRepo.findOne({
      where: { tenantId, truckId: truck.id, status: In(OPEN_OFFER) },
    });
    if (live) throw new BadRequestException('This truck already has an open leftover-space listing');

    const trip = await this.tripRepo.findOne({
      where: { id: dto.tripId, tenantId, truckId: truck.id },
      relations: ['load'],
    });
    if (!trip) throw new NotFoundException('Trip not found for this truck');

    const nameplateKg = Number(truck.capacityWeight) || 0;
    const nameplateM3 = Number(truck.capacityVolume) || 0;
    const allocatedKg = Number(trip?.load?.weight) || 0;
    const allocatedM3 = Number(trip?.load?.volume) || 0;
    const utilization = utilizationPercent(allocatedKg, nameplateKg);
    if (!trip) {
      throw new BadRequestException('Only trucks on an active trip can sell leftover space');
    }
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
    if (floorPrice <= 0) {
      throw new BadRequestException('Set a price for the remaining space');
    }

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
      bookingMode: dto.bookingMode || CapacityBookingMode.INSTANT,
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
    const truck = await this.findTruck({ id: offer.truckId, tenantId });
    const bookings =
      offer.ownerId === userId || ['ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'].includes(role)
        ? await this.bookingRepo.find({ where: { offerId: offer.id, tenantId }, order: { createdAt: 'DESC' } })
        : [];
    return { ...this.decorateOffer(offer, truck), bookings };
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
    return offers
      .map((offer) => {
        const truck = trucks.find((t) => t.id === offer.truckId);
        const card = this.decorateOffer(offer, truck);
        const input = this.toMatchInput(offer);
        const hasSlice = Boolean(search.weightKg);
        const corridorOk =
          (!search.origin && !search.destination) ||
          ((!search.origin || this.cityHint(search.origin, offer.origin)) &&
            (!search.destination || this.cityHint(search.destination, offer.destination)));
        const reason = hasSlice ? hardFilterOffer(input, search) : corridorOk ? null : 'Corridor does not overlap this leftover space';
        const score = hasSlice ? scoreOffer(input, search) : corridorOk ? 70 : 0;
        const quote = hasSlice ? this.quoteFromOffer(offer, search.weightKg, search.volumeM3 || 0) : null;
        return { ...card, matchScore: score, matchReason: reason, quote, bookable: !reason };
      })
      .filter((row) => row.matchScore > 0 || (!query.originCity && !query.destinationCity && !search.weightKg))
      .sort((a, b) => b.matchScore - a.matchScore);
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
    return this.quoteFromOffer(offer, dto.weightKg, dto.volumeM3 || 0);
  }

  async book(offerId: string, dto: BookCapacityDto, tenantId: string, cargoOwnerId: string) {
    return this.dataSource.transaction(async (manager) => {
      const offer = await manager
        .createQueryBuilder(CapacityOffer, 'o')
        .setLock('pessimistic_write')
        .where('o.id = :id', { id: offerId })
        .andWhere('o.tenantId = :tenantId', { tenantId })
        .getOne();
      if (!offer) throw new NotFoundException('Capacity listing not found');

      const origin = dto.origin || offer.origin;
      const destination = dto.destination || offer.destination;
      const search: SearchQuery = {
        origin,
        destination,
        pickupAt: dto.pickupAt || dto.pickupDate || offer.departureAt,
        weightKg: dto.weightKg,
        volumeM3: dto.volumeM3 || 0,
        cargoType: dto.cargoType || 'GENERAL',
        isHazardous: dto.isHazardous,
      };
      const reason = hardFilterOffer(this.toMatchInput(offer), search);
      if (reason) throw new BadRequestException(reason);
      if (offer.ownerId === cargoOwnerId) {
        throw new BadRequestException('You cannot book leftover space on your own truck');
      }

      const priced = this.quoteFromOffer(offer, dto.weightKg, dto.volumeM3 || 0);
      const instant = offer.bookingMode === CapacityBookingMode.INSTANT;
      const status = instant ? CapacityBookingStatus.CONFIRMED : CapacityBookingStatus.REQUESTED;

      const reserved = applyBookingToSlice(
        {
          remainingWeightKg: Number(offer.remainingWeightKg),
          remainingVolumeM3: Number(offer.remainingVolumeM3),
          allocatedWeightKg: Number(offer.allocatedWeightKg),
          allocatedVolumeM3: Number(offer.allocatedVolumeM3),
        },
        dto.weightKg,
        dto.volumeM3 || 0,
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

      const booking = manager.create(CapacityBooking, {
        tenantId,
        offerId: offer.id,
        cargoOwnerId,
        weightKg: roundKg(dto.weightKg),
        volumeM3: roundKg(dto.volumeM3 || 0),
        cargoType: (dto.cargoType || 'GENERAL').toUpperCase(),
        title: dto.title || `Shared capacity ${offer.origin.name} → ${offer.destination.name}`,
        freightAmount: priced.freightAmount,
        commissionRate: priced.commissionRate,
        commissionAmount: priced.commissionAmount,
        currencyCode: offer.currencyCode,
        commissionStatus: CapacityCommissionStatus.PENDING,
        status,
        origin,
        destination,
        pickupDate: new Date(dto.pickupDate || offer.departureAt),
        deliveryDate: new Date(dto.deliveryDate || offer.arrivalAt),
        metadata: { bookingMode: offer.bookingMode, payer: 'CARGO_OWNER' },
      });
      const saved = await manager.save(booking);

      if (instant) {
        await this.confirmInTx(manager, offer, saved, dto, tenantId, cargoOwnerId);
      }
      return this.presentBooking(await manager.findOneByOrFail(CapacityBooking, { id: saved.id }), offer);
    });
  }

  async acceptBooking(bookingId: string, tenantId: string, ownerId: string) {
    return this.dataSource.transaction(async (manager) => {
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
      return this.presentBooking(booking, offer);
    });
  }

  async rejectBooking(bookingId: string, tenantId: string, ownerId: string, reason?: string) {
    return this.releaseBooking(bookingId, tenantId, {
      actorId: ownerId,
      asOwner: true,
      status: CapacityBookingStatus.REJECTED,
      reason,
    });
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
    return bookings.map((b) => this.presentBooking(b, offers.find((o) => o.id === b.offerId)));
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
      currency: offer.currencyCode,
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
      currency: offer.currencyCode,
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
    trip.agreedPrice = roundMoney(Number(trip.agreedPrice || 0) + Number(booking.freightAmount));
    await manager.save(trip);
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
      currencyCode: offer.currencyCode,
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
      const existing = await manager.findOne(Trip, { where: { id: offer.tripId, tenantId } });
      if (existing) return existing;
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
      currencyCode: offer.currencyCode,
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
      return this.presentBooking(booking, offer);
    });
  }

  private async expireStale(tenantId: string) {
    await this.offerRepo
      .createQueryBuilder()
      .update(CapacityOffer)
      .set({ status: CapacityOfferStatus.EXPIRED })
      .where('"tenantId" = :tenantId', { tenantId })
      .andWhere('"status" IN (:...status)', { status: OPEN_OFFER })
      .andWhere('"departureAt" < :now', { now: new Date() })
      .execute();
  }

  private async toSearchQuery(query: SearchCapacityDto, tenantId: string): Promise<SearchQuery> {
    let origin: any = query.originLat && query.originLng
      ? { name: query.originCity || '', city: query.originCity, lat: query.originLat, lng: query.originLng }
      : null;
    let destination: any = query.destinationLat && query.destinationLng
      ? { name: query.destinationCity || '', city: query.destinationCity, lat: query.destinationLat, lng: query.destinationLng }
      : null;
    if (!origin && query.originCity) origin = { name: query.originCity, city: query.originCity };
    if (!destination && query.destinationCity) destination = { name: query.destinationCity, city: query.destinationCity };

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

  private quoteFromOffer(offer: CapacityOffer, weightKg: number, volumeM3: number) {
    const freightAmount = quoteFreight(this.toMatchInput(offer), weightKg, volumeM3);
    const commission = quoteCommission(freightAmount, Number(offer.commissionRate));
    return {
      freightAmount,
      commissionRate: commission.rate,
      commissionAmount: commission.amount,
      totalDue: roundMoney(freightAmount + commission.amount),
      currencyCode: offer.currencyCode,
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

  private decorateOffer(offer: CapacityOffer, truck?: Truck | null) {
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
      truck: truck
        ? {
            id: truck.id,
            plateNumber: truck.plateNumber,
            make: truck.make,
            model: truck.model,
            capacityWeight: Number(truck.capacityWeight),
            capacityVolume: Number(truck.capacityVolume),
          }
        : null,
    };
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

  private presentBooking(booking: CapacityBooking, offer?: CapacityOffer) {
    return {
      ...booking,
      weightKg: Number(booking.weightKg),
      volumeM3: Number(booking.volumeM3),
      freightAmount: Number(booking.freightAmount),
      commissionAmount: Number(booking.commissionAmount),
      commissionRate: Number(booking.commissionRate),
      totalDue: roundMoney(Number(booking.freightAmount) + Number(booking.commissionAmount)),
      corridor: offer ? `${offer.origin?.name} → ${offer.destination?.name}` : null,
      bookingMode: offer?.bookingMode,
      offerStatus: offer?.status,
      truckId: offer?.truckId,
    };
  }

  private findTrucks(where: FindOptionsWhere<Truck>) {
    return this.truckRepo.find({ where, select: TRUCK_CARD_SELECT });
  }

  private findTruck(where: FindOptionsWhere<Truck>) {
    return this.truckRepo.findOne({ where, select: TRUCK_CARD_SELECT });
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

  private placeFromLoad(load: Load | undefined, side: 'origin' | 'destination'): CapacityPlace | null {
    if (!load) return null;
    const addr = side === 'origin' ? load.origin : load.destination;
    const routeLoc = side === 'origin' ? load.pickupLocation : load.deliveryLocation;
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

  private suggestFloor(remainingKg: number, trip?: Trip | null) {
    const rate = Number(trip?.agreedPrice) && remainingKg
      ? (Number(trip.agreedPrice) / Math.max(Number(trip.load?.weight) || remainingKg, 1)) * remainingKg * 0.9
      : (remainingKg / 1000) * 160;
    return Math.max(80, rate);
  }
}
