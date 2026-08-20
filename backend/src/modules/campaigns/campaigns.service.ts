import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  DistributionCampaign,
  DistributionCampaignStatus,
} from '../../entities/distribution-campaign.entity';
import { Load, LoadStatus, LoadType, CargoType, EquipmentType, Visibility, PaymentTerms, UrgencyLevel, PackagingType } from '../../entities/load.entity';
import { Trip } from '../../entities/trip.entity';
import { Payment } from '../../entities/payment.entity';
import { MatchingService, MatchingAlgorithm } from '../matching/matching.service';
import { LoadsService } from '../loads/loads.service';
import { CampaignIntentDto } from './dto/campaign-intent.dto';
import {
  ADVANCE_RATIO,
  buildCampaignPlan,
  CampaignIntent,
  CorridorCity,
  FTL_RATE_PER_KM,
  FTL_VOLUME_M3,
  FTL_WEIGHT_KG,
  INSURANCE_RATE,
  citySlug,
  haversineKm,
} from './campaign-planner';
import { nextMonthWindow, parseCampaignPrompt } from './campaign-intent-parser';
import { CampaignGeoService } from './campaign-geo.service';

@Injectable()
export class CampaignsService implements OnModuleInit {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectRepository(DistributionCampaign)
    private readonly campaignRepo: Repository<DistributionCampaign>,
    @InjectRepository(Load)
    private readonly loadRepo: Repository<Load>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly matchingService: MatchingService,
    private readonly loadsService: LoadsService,
    private readonly dataSource: DataSource,
    private readonly geo: CampaignGeoService,
  ) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS "distribution_campaigns" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "tenantId" uuid NOT NULL,
          "cargoOwnerId" uuid NOT NULL,
          "status" character varying(32) NOT NULL DEFAULT 'DRAFT',
          "productName" character varying(200) NOT NULL,
          "totalUnits" integer NOT NULL,
          "intent" jsonb NOT NULL,
          "plan" jsonb,
          "loadIds" jsonb NOT NULL DEFAULT '[]',
          "execution" jsonb NOT NULL DEFAULT '{}',
          "approvedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_distribution_campaigns" PRIMARY KEY ("id")
        )
      `);
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_distribution_campaigns_owner"
          ON "distribution_campaigns" ("tenantId", "cargoOwnerId", "createdAt")
      `);
      await this.dataSource.query(`
        CREATE INDEX IF NOT EXISTS "IDX_distribution_campaigns_status"
          ON "distribution_campaigns" ("tenantId", "status")
      `);
    } catch (err: any) {
      this.logger.warn(`Could not ensure distribution_campaigns table: ${err?.message}`);
    }
  }

  private async resolveIntent(
    dto: CampaignIntentDto | CampaignIntent,
    tenantId: string,
    cargoOwnerId: string,
    previous?: CampaignIntent,
  ): Promise<CampaignIntent> {
    const prompt = (dto as CampaignIntentDto).prompt?.trim() || previous?.prompt || '';
    const parsed = prompt ? parseCampaignPrompt(prompt) : { namedCities: [], countryHints: [] };
    const originText = (dto as CampaignIntentDto).originText?.trim() || parsed.originText;

    const promptChanged = Boolean(prompt && prompt !== previous?.prompt);
    const originOverride = Boolean(
      originText && previous?.origin && originText.toLowerCase() !== previous.origin.name.toLowerCase(),
    );
    let origin: CorridorCity | undefined;
    let destinations: CorridorCity[] = [];

    if (Array.isArray((dto as any).destinations)) {
      destinations = ((dto as any).destinations as any[])
        .map((city) => this.asCity(city))
        .filter(Boolean) as CorridorCity[];
    } else if (
      previous?.origin &&
      previous?.destinations?.length &&
      !promptChanged &&
      !originOverride
    ) {
      origin = origin || previous.origin;
      destinations = [...previous.destinations];
    }

    if ((dto as any).origin?.lat && !originOverride) {
      origin = this.asCity((dto as any).origin);
    }

    if (!origin && originText) {
      origin = await this.geo.geocodeCity(originText);
    }
    if (!origin) {
      origin = previous?.origin || (await this.originFromHistory(tenantId, cargoOwnerId));
    }
    if (!origin) {
      throw new BadRequestException('Say where goods leave from, e.g. “from Kigali”.');
    }

    const ids = (dto as CampaignIntentDto).destinationCityIds;
    if (ids?.length && destinations.length) {
      destinations = destinations.filter((city) => ids.includes(city.id));
    } else if (ids?.length && previous?.destinations?.length) {
      destinations = previous.destinations.filter((city) => ids.includes(city.id));
    }

    destinations = destinations.filter(
      (city) => citySlug(city.name, city.countryCode) !== citySlug(origin!.name, origin!.countryCode),
    );
    if (!destinations.length) {
      throw new BadRequestException(
        'Select destination cities. UrutiX will not guess which cities to serve.',
      );
    }

    const fallbackWindow = nextMonthWindow();
    const rates = await this.marketRates(tenantId);
    if (new Date(dto.windowEnd || parsed.windowEnd || previous?.windowEnd || fallbackWindow.windowEnd) <
      new Date(dto.windowStart || parsed.windowStart || previous?.windowStart || fallbackWindow.windowStart)) {
      throw new BadRequestException('Window end must be after window start');
    }
    const totalUnits = dto.totalUnits || parsed.totalUnits || previous?.totalUnits;
    if (!totalUnits) {
      throw new BadRequestException('Say how many units to move, e.g. “100,000 units”.');
    }

    return {
      prompt,
      productName: (dto.productName || parsed.productName || previous?.productName || 'General cargo').trim(),
      totalUnits,
      kgPerUnit: dto.kgPerUnit || parsed.kgPerUnit || previous?.kgPerUnit || 2,
      m3PerUnit: dto.m3PerUnit ?? previous?.m3PerUnit ?? 0.004,
      valuePerUnit: dto.valuePerUnit ?? parsed.valuePerUnit ?? previous?.valuePerUnit ?? 0,
      origin,
      destinations,
      originCityId: origin.id,
      destinationCityIds: destinations.map((city) => city.id),
      windowStart: dto.windowStart || parsed.windowStart || previous?.windowStart || fallbackWindow.windowStart,
      windowEnd: dto.windowEnd || parsed.windowEnd || previous?.windowEnd || fallbackWindow.windowEnd,
      budgetCap: dto.budgetCap ?? parsed.budgetCap ?? previous?.budgetCap ?? 0,
      slaPercent: dto.slaPercent ?? previous?.slaPercent ?? 95,
      preferSharedTrucks: dto.preferSharedTrucks ?? parsed.preferSharedTrucks ?? previous?.preferSharedTrucks ?? true,
      requireInsurance: dto.requireInsurance ?? parsed.requireInsurance ?? previous?.requireInsurance ?? true,
      fundOnEscrow: dto.fundOnEscrow ?? parsed.fundOnEscrow ?? previous?.fundOnEscrow ?? true,
      goodsReady: dto.goodsReady ?? previous?.goodsReady ?? false,
      currencyCode: (dto.currencyCode || parsed.currencyCode || previous?.currencyCode || 'USD').toUpperCase().slice(0, 3),
      ...rates,
    };
  }

  private asCity(city: any): CorridorCity | undefined {
    if (!city?.name || !Number.isFinite(Number(city.lat)) || !Number.isFinite(Number(city.lng))) return undefined;
    const countryCode = (city.countryCode || 'XX').toUpperCase();
    return {
      id: city.id || citySlug(city.name, countryCode),
      name: city.name,
      country: city.country || '',
      countryCode,
      region: city.region || '',
      lat: Number(city.lat),
      lng: Number(city.lng),
    };
  }

  private async originFromHistory(tenantId: string, cargoOwnerId: string): Promise<CorridorCity | null> {
    const load = await this.loadRepo.findOne({
      where: { tenantId, cargoOwnerId },
      order: { createdAt: 'DESC' },
    });
    const origin = (load as any)?.origin;
    if (origin?.city && Number.isFinite(Number(origin.lat))) {
      const countryCode = String(origin.country || 'XX').slice(0, 2).toUpperCase();
      return {
        id: citySlug(origin.city, countryCode),
        name: origin.city,
        country: origin.country || '',
        countryCode,
        lat: Number(origin.lat),
        lng: Number(origin.lng),
      };
    }
    return null;
  }

  private async marketRates(tenantId: string) {
    const loads = await this.loadRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 80,
    });
    const perKm: number[] = [];
    for (const load of loads) {
      const origin = (load as any).origin;
      const dest = (load as any).destination;
      const price = Number(load.offeredPrice || 0);
      if (!origin?.lat || !dest?.lat || price <= 0) continue;
      const km = haversineKm(Number(origin.lat), Number(origin.lng), Number(dest.lat), Number(dest.lng));
      if (km >= 30) perKm.push(price / km);
    }
    perKm.sort((a, b) => a - b);
    const mid = perKm.length ? perKm[Math.floor(perKm.length / 2)] : FTL_RATE_PER_KM;
    return {
      ftlWeightKg: FTL_WEIGHT_KG,
      ftlVolumeM3: FTL_VOLUME_M3,
      ftlRatePerKm: Number(Math.max(0.4, Math.min(mid, 8)).toFixed(2)),
      insuranceRate: INSURANCE_RATE,
      advanceRatio: ADVANCE_RATIO,
    };
  }

  async list(tenantId: string, cargoOwnerId: string) {
    return this.campaignRepo.find({
      where: { tenantId, cargoOwnerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async get(id: string, tenantId: string, cargoOwnerId: string) {
    const campaign = await this.campaignRepo.findOne({
      where: { id, tenantId, cargoOwnerId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return this.enrich(campaign);
  }

  async create(dto: CampaignIntentDto, tenantId: string, cargoOwnerId: string) {
    const previous = (dto as any).origin?.lat ? (dto as unknown as CampaignIntent) : undefined;
    const intent = await this.resolveIntent(dto, tenantId, cargoOwnerId, previous);
    const plan = buildCampaignPlan(intent);
    const campaign = this.campaignRepo.create({
      tenantId,
      cargoOwnerId,
      status: DistributionCampaignStatus.PLANNED,
      productName: intent.productName,
      totalUnits: intent.totalUnits,
      intent,
      plan,
      loadIds: [],
      execution: {},
    });
    return this.campaignRepo.save(campaign);
  }

  async updatePlan(id: string, dto: CampaignIntentDto, tenantId: string, cargoOwnerId: string) {
    const campaign = await this.requireMutable(id, tenantId, cargoOwnerId);
    const intent = await this.resolveIntent(dto, tenantId, cargoOwnerId, campaign.intent as CampaignIntent);
    campaign.intent = intent;
    campaign.productName = intent.productName;
    campaign.totalUnits = intent.totalUnits;
    campaign.plan = buildCampaignPlan(intent);
    campaign.status = DistributionCampaignStatus.PLANNED;
    return this.campaignRepo.save(campaign);
  }

  async approve(id: string, dto: CampaignIntentDto, tenantId: string, cargoOwnerId: string) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const campaign = await manager
        .getRepository(DistributionCampaign)
        .createQueryBuilder('c')
        .setLock('pessimistic_write')
        .where('c.id = :id', { id })
        .andWhere('c.tenantId = :tenantId', { tenantId })
        .andWhere('c.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
        .getOne();
      if (!campaign) throw new NotFoundException('Campaign not found');

      if (campaign.loadIds?.length && ['EXECUTING', 'COMPLETE'].includes(campaign.status)) {
        return campaign;
      }

      const intent = await this.resolveIntent(
        { ...campaign.intent, ...dto, goodsReady: dto.goodsReady ?? campaign.intent?.goodsReady },
        tenantId,
        cargoOwnerId,
        campaign.intent as CampaignIntent,
      );

      if (!intent.goodsReady) {
        throw new BadRequestException('Confirm goods are ready at the origin warehouse before approving');
      }

      const plan = buildCampaignPlan(intent);
      if (plan.overBudget) {
        throw new BadRequestException('Estimated freight plus cover exceeds the budget cap');
      }
      if (!plan.destinations.length) {
        throw new BadRequestException('Plan has no destinations');
      }

      const createdLoads: Load[] = [];
      const destinations: any[] = [...plan.destinations];

      for (const dest of destinations) {
        const existing = await this.findCampaignLoad(tenantId, cargoOwnerId, campaign.id, dest.cityId);
        if (existing) {
          createdLoads.push(existing);
          dest.loadId = existing.id;
          dest.loadStatus = existing.status;
          dest.matchCount = existing.metadata?.matchCount ?? dest.matchCount ?? 0;
          dest.matchingStatus = existing.metadata?.matchingStatus ?? dest.matchingStatus ?? 'REQUESTED';
          dest.topMatchScore = existing.metadata?.topMatchScore ?? dest.topMatchScore ?? null;
          continue;
        }

        try {
          const savedLoad = await this.createChildLoad(campaign.id, intent, plan, dest, tenantId, cargoOwnerId);
          createdLoads.push(savedLoad);
          dest.loadId = savedLoad.id;
          dest.loadStatus = savedLoad.status;
          dest.matchCount = 0;
          dest.matchingStatus = 'REQUESTED';
        } catch (err: any) {
          this.logger.error(`Failed to create load for ${dest.cityName}: ${err?.message}`, err?.stack);
          dest.loadStatus = 'FAILED';
          dest.matchingStatus = 'LOAD_CREATE_FAILED';
        }
      }

      const steps = plan.operatorSteps.map((step) => {
        if (step.id === 'transport') {
          return { ...step, status: 'ready', detail: `${createdLoads.length} loads created and sent to matching.` };
        }
        if (step.id === 'negotiate') {
          return { ...step, status: 'planned', detail: 'AI matching is running against live capacity.' };
        }
        if (step.id === 'inventory') {
          return { ...step, status: 'ready', detail: 'Goods-ready confirmed by cargo owner. No purchase order created.' };
        }
        if (step.id === 'financing') {
          return {
            ...step,
            status: intent.fundOnEscrow ? 'planned' : 'queued',
            detail: intent.fundOnEscrow
              ? 'Trip facilities will draw after a truck is assigned. Not a single unsecured lump.'
              : 'Escrow funding off.',
          };
        }
        if (step.id === 'insurance') {
          return {
            ...step,
            status: intent.requireInsurance ? 'ready' : 'queued',
            detail: intent.requireInsurance
              ? `Cargo cover quoted ${intent.currencyCode} ${plan.insurancePremium} on declared value. Bound when a truck is assigned.`
              : 'Cover not requested.',
          };
        }
        if (step.id === 'customs') {
          const borders = destinations.filter((d) => d.crossBorder).length;
          return {
            ...step,
            status: borders ? 'planned' : 'ready',
            detail: borders
              ? `${borders} loads flagged PENDING_DOCS for a border pack. Customs officers are not auto-assigned.`
              : 'Domestic destinations only.',
          };
        }
        return step;
      });

      campaign.intent = intent;
      campaign.plan = { ...plan, destinations, operatorSteps: steps };
      campaign.loadIds = createdLoads.map((l) => l.id);
      campaign.status = createdLoads.length
        ? DistributionCampaignStatus.EXECUTING
        : DistributionCampaignStatus.EXCEPTION;
      campaign.approvedAt = new Date();
      campaign.execution = {
        loadsCreated: createdLoads.length,
        matchesFound: 0,
        matching: 'REQUESTED',
        crossBorderLoads: destinations.filter((d) => d.crossBorder).length,
        escrowRequested: intent.fundOnEscrow,
        insuranceQuoted: intent.requireInsurance,
        approvedAt: campaign.approvedAt,
      };

      return manager.getRepository(DistributionCampaign).save(campaign);
    });

    void this.matchCampaignLoads(saved.id, tenantId, cargoOwnerId);
    return this.enrich(saved);
  }

  async repeat(id: string, tenantId: string, cargoOwnerId: string) {
    const source = await this.requireOwned(id, tenantId, cargoOwnerId);
    const intent = { ...(source.intent as CampaignIntent) };
    const start = new Date(intent.windowStart);
    const end = new Date(intent.windowEnd);
    const span = end.getTime() - start.getTime();
    const nextStart = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    intent.windowStart = nextStart.toISOString();
    intent.windowEnd = new Date(nextStart.getTime() + Math.max(span, 7 * 24 * 60 * 60 * 1000)).toISOString();
    intent.goodsReady = false;
    return this.create(intent as any, tenantId, cargoOwnerId);
  }

  async searchCities(query: string, limit = 40) {
    return this.geo.searchCities(query || '', limit);
  }

  async suggestCities(dto: CampaignIntentDto, tenantId: string, cargoOwnerId: string) {
    const parsed = parseCampaignPrompt(dto.prompt || '');
    const originText = dto.originText?.trim() || parsed.originText;
    let origin = originText ? await this.geo.geocodeCity(originText) : null;
    if (!origin) origin = await this.originFromHistory(tenantId, cargoOwnerId);
    if (parsed.namedCities.length) {
      return { origin, suggestions: await this.geo.geocodeMany(parsed.namedCities) };
    }
    if (parsed.countryHints.length && origin) {
      return {
        origin,
        suggestions: await this.geo.citiesInCountries(parsed.countryHints, parsed.cityCount || 20, origin),
      };
    }
    if (origin) {
      return { origin, suggestions: await this.geo.nearbyCities(origin, parsed.cityCount || 12) };
    }
    return { origin: null, suggestions: [] };
  }

  private async enrich(campaign: DistributionCampaign) {
    if (!campaign.loadIds?.length) return campaign;
    const loads = await this.loadRepo.find({ where: { id: In(campaign.loadIds) } });
    const trips = loads.length
      ? await this.tripRepo.find({ where: { loadId: In(loads.map((l) => l.id)) } as any })
      : [];
    const payments = trips.length
      ? await this.paymentRepo.find({ where: { tripId: In(trips.map((t) => t.id)) } }).catch(() => [])
      : [];

    const loadMap = new Map(loads.map((l) => [l.id, l]));
    const plan = campaign.plan || {};
    const destinations = (plan.destinations || []).map((dest: any) => {
      const load = dest.loadId ? loadMap.get(dest.loadId) : undefined;
      const trip = trips.find((t: any) => t.loadId === dest.loadId);
      const pay = (payments as any[]).filter((p) => p.tripId === trip?.id);
      const meta = load?.metadata || {};
      const financeStatus = trip && meta.fundOnEscrow ? 'TRIP_READY' : meta.financeStatus;
      return {
        ...dest,
        loadStatus: load?.status || dest.loadStatus,
        matchCount: meta.matchCount ?? dest.matchCount ?? 0,
        topMatchScore: meta.topMatchScore ?? dest.topMatchScore ?? null,
        matchingStatus: meta.matchingStatus ?? dest.matchingStatus,
        financeStatus,
        insuranceStatus: meta.insuranceStatus ?? dest.insuranceStatus,
        borderPackStatus: meta.borderPackStatus ?? dest.borderPackStatus,
        tripId: trip?.id,
        tripStatus: trip?.status,
        paidAmount: pay.reduce((s, p) => s + Number(p.amount || 0), 0),
      };
    });

    const liveStatuses = loads.map((l) => l.status);
    let status = campaign.status;
    if (loads.length && liveStatuses.every((s) => s === LoadStatus.COMPLETED || s === LoadStatus.DELIVERED || s === LoadStatus.CLOSED)) {
      status = DistributionCampaignStatus.COMPLETE;
    }

    return {
      ...campaign,
      status,
      plan: { ...plan, destinations },
      live: {
        loadCount: loads.length,
        published: loads.filter((l) => l.status !== LoadStatus.DRAFT).length,
        inTransit: loads.filter((l) => l.status === LoadStatus.IN_TRANSIT).length,
        delivered: loads.filter((l) => [LoadStatus.DELIVERED, LoadStatus.COMPLETED, LoadStatus.CLOSED].includes(l.status)).length,
        trips: trips.length,
        matchesFound: destinations.filter((d: any) => (d.matchCount || 0) > 0).length,
      },
    };
  }

  private async findCampaignLoad(
    tenantId: string,
    cargoOwnerId: string,
    campaignId: string,
    cityId: string,
  ) {
    return this.loadRepo
      .createQueryBuilder('load')
      .where('load.tenantId = :tenantId', { tenantId })
      .andWhere('load.cargoOwnerId = :cargoOwnerId', { cargoOwnerId })
      .andWhere(`load.metadata->>'campaignId' = :campaignId`, { campaignId })
      .andWhere(`load.metadata->>'destinationCityId' = :cityId`, { cityId })
      .getOne();
  }

  private async createChildLoad(
    campaignId: string,
    intent: CampaignIntent,
    plan: ReturnType<typeof buildCampaignPlan>,
    dest: ReturnType<typeof buildCampaignPlan>['destinations'][number],
    tenantId: string,
    cargoOwnerId: string,
  ) {
    const origin = plan.origin;
    const payload: any = {
      title: `${intent.productName} → ${dest.cityName}`.slice(0, 200),
      description: `Campaign ${campaignId}. ${dest.units} units ${origin.name} → ${dest.cityName}. ${dest.loadType}. Shared capacity preferred: ${intent.preferSharedTrucks}.`,
      weight: dest.weightKg,
      volume: dest.volumeM3,
      cargoType: CargoType.GENERAL,
      loadType: dest.loadType === 'LTL' ? LoadType.LTL : LoadType.FTL,
      equipmentType: EquipmentType.DRY_VAN,
      visibility: Visibility.PUBLIC,
      unitsRequired: 1,
      numberOfPieces: Math.min(dest.units, 10_000),
      pickupDate: dest.pickupDate,
      deliveryDate: dest.deliveryDate,
      loadValue: Math.max(dest.units * intent.valuePerUnit, 1),
      offeredPrice: dest.estimatedFreight,
      currencyCode: intent.currencyCode,
      paymentTerms: PaymentTerms.NET_30,
      urgencyLevel: UrgencyLevel.NORMAL,
      packagingType: PackagingType.PALLETIZED,
      locations: [
        this.locationPayload('PICKUP', 1, `${origin.name} warehouse`, origin, dest.pickupDate),
        this.locationPayload('DELIVERY', 2, `${dest.cityName} delivery`, dest, dest.deliveryDate),
      ],
      origin: {
        address: `${origin.name} warehouse`,
        city: origin.name,
        country: origin.country,
        lat: origin.lat,
        lng: origin.lng,
      },
      destination: {
        address: dest.cityName,
        city: dest.cityName,
        country: dest.country,
        lat: dest.lat,
        lng: dest.lng,
      },
      isFragile: false,
      isHazardous: false,
      requiresRefrigeration: false,
      contactInfo: {},
      autoMatchEnabled: true,
      matchingCriteria: {
        campaignId,
        destinationCityId: dest.cityId,
        preferSharedTrucks: intent.preferSharedTrucks,
      },
      truckRequirements: {},
      carrierPreferences: {},
      costPreferences: {
        maxBudget: dest.estimatedFreight,
        requiresInsurance: intent.requireInsurance,
        requiresTracking: true,
      },
      insuranceValue: dest.units * intent.valuePerUnit,
      requiresGpsMonitoring: true,
      requiresPreShipmentInspection: dest.crossBorder,
      requiresDeliveryInspection: true,
      requiresPhotographicDocumentation: dest.crossBorder,
      metadata: {
        campaignId,
        destinationCityId: dest.cityId,
        crossBorder: dest.crossBorder,
        borderPackStatus: dest.crossBorder ? 'PENDING_DOCS' : 'NOT_REQUIRED',
        fundOnEscrow: intent.fundOnEscrow,
        financeStatus: intent.fundOnEscrow ? 'AWAITING_TRIP' : 'NOT_REQUESTED',
        requireInsurance: intent.requireInsurance,
        insuranceStatus: intent.requireInsurance ? 'QUOTED' : 'NOT_REQUESTED',
        insurancePremiumShare: intent.requireInsurance
          ? Math.round((dest.units / Math.max(intent.totalUnits, 1)) * plan.insurancePremium)
          : 0,
        estimatedAdvance: intent.fundOnEscrow ? Math.round(dest.estimatedFreight * ADVANCE_RATIO) : 0,
        matchingStatus: 'REQUESTED',
        matchCount: 0,
      },
    };

    return this.loadsService.create(payload, cargoOwnerId, tenantId);
  }

  private async matchCampaignLoads(campaignId: string, tenantId: string, cargoOwnerId: string) {
    try {
      const campaign = await this.requireOwned(campaignId, tenantId, cargoOwnerId);
      const destinations = [...((campaign.plan as any)?.destinations || [])];
      let matchesFound = 0;

      for (const dest of destinations) {
        if (!dest.loadId) continue;
        try {
          const matches = await this.matchingService.findMatches(
            { loadId: dest.loadId, algorithm: MatchingAlgorithm.HYBRID, limit: 8, includeDrivers: true },
            tenantId,
          );
          dest.matchCount = matches?.length || 0;
          dest.topMatchScore = matches?.[0]?.overallScore ?? null;
          dest.matchingStatus = dest.matchCount ? 'CANDIDATES_FOUND' : 'NO_CAPACITY_YET';
          if (dest.matchCount) matchesFound += 1;

          const load = await this.loadRepo.findOne({ where: { id: dest.loadId } });
          if (load) {
            load.metadata = {
              ...(load.metadata || {}),
              matchCount: dest.matchCount,
              topMatchScore: dest.topMatchScore,
              matchingStatus: dest.matchingStatus,
            };
            await this.loadRepo.save(load);
          }
        } catch (err: any) {
          this.logger.warn(`Matching skipped for load ${dest.loadId}: ${err?.message}`);
          dest.matchCount = dest.matchCount || 0;
          dest.matchingStatus = 'MATCHING_UNAVAILABLE';
        }
      }

      const steps = ((campaign.plan as any)?.operatorSteps || []).map((step: any) => {
        if (step.id === 'negotiate') {
          return {
            ...step,
            status: matchesFound ? 'ready' : 'planned',
            detail: `${matchesFound} loads have carrier candidates. Others wait on capacity.`,
          };
        }
        return step;
      });

      campaign.plan = { ...(campaign.plan as any), destinations, operatorSteps: steps };
      campaign.execution = {
        ...(campaign.execution || {}),
        matchesFound,
        matching: 'COMPLETE',
      };
      await this.campaignRepo.save(campaign);
    } catch (err: any) {
      this.logger.warn(`Background matching failed for campaign ${campaignId}: ${err?.message}`);
    }
  }

  private locationPayload(
    type: 'PICKUP' | 'DELIVERY',
    sequence: number,
    name: string,
    city: { name?: string; country?: string; lat: number; lng: number; cityName?: string },
    scheduledDate: string,
  ) {
    const cityName = city.cityName || city.name || '';
    return {
      id: `${type.toLowerCase()}-${sequence}`,
      type,
      sequence,
      locationData: {
        name,
        address: `${cityName}`,
        city: cityName,
        country: city.country,
        coordinates: { latitude: city.lat, longitude: city.lng },
        contactInfo: {},
        operatingHours: {},
        accessInstructions: '',
      },
      scheduledDate,
      estimatedTime: 60,
      requirements: { hazmatCertified: false, temperatureControlled: false, securityClearance: '' },
      status: 'PENDING',
    };
  }

  private async requireOwned(id: string, tenantId: string, cargoOwnerId: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id, tenantId, cargoOwnerId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  private async requireMutable(id: string, tenantId: string, cargoOwnerId: string) {
    const campaign = await this.requireOwned(id, tenantId, cargoOwnerId);
    if (['EXECUTING', 'COMPLETE'].includes(campaign.status) && campaign.loadIds?.length) {
      throw new BadRequestException('This campaign already has live loads. Repeat it to plan next month.');
    }
    return campaign;
  }
}
