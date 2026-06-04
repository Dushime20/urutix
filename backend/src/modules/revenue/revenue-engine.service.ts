import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { RevenueRecord } from '../../entities/revenue-record.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';

// Platform fee rates by subscription plan
const PLATFORM_FEE_RATES: Record<string, number> = {
  STARTER: 0.05,    // 5%
  GROWTH: 0.04,     // 4%
  PROFESSIONAL: 0.035, // 3.5%
  ENTERPRISE: 0.03, // 3%
  default: 0.05,
};

const BROKER_COMMISSION_RATE = 0.02; // 2% default broker commission

@Injectable()
export class RevenueEngineService {
  private readonly logger = new Logger(RevenueEngineService.name);

  constructor(
    @InjectRepository(RevenueRecord)
    private readonly revenueRepository: Repository<RevenueRecord>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  // ─── Calculate and deduct on trip settlement ─────────────────────────────────

  async deductOnSettlement(tripId: string): Promise<RevenueRecord> {
    // Check if already settled
    const existing = await this.revenueRepository.findOne({ where: { tripId } });
    if (existing) {
      this.logger.warn(`Revenue already recorded for trip ${tripId}`);
      return existing;
    }

    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

    const load = await this.loadRepository.findOne({ where: { id: (trip as any).loadId } });

    const grossAmount = Number((trip as any).agreedPrice || (load as any)?.offeredPrice || 0);
    const planKey = 'default'; // TODO: fetch from tenant subscription
    const platformFeeRate = PLATFORM_FEE_RATES[planKey];
    const platformFeeAmount = grossAmount * platformFeeRate;

    const brokerId = (load as any)?.brokerId;
    const brokerCommissionAmount = brokerId ? grossAmount * BROKER_COMMISSION_RATE : 0;

    const netPayoutAmount = grossAmount - platformFeeAmount - brokerCommissionAmount;

    const record = this.revenueRepository.create({
      tripId,
      loadId: (trip as any).loadId,
      tenantId: trip.tenantId,
      brokerId,
      grossAmount,
      platformFeeRate,
      platformFeeAmount,
      brokerCommissionAmount,
      netPayoutAmount,
      currency: (load as any)?.currencyCode || 'KES',
      isSettled: true,
    });

    const saved = await this.revenueRepository.save(record);
    this.logger.log(
      `Revenue recorded for trip ${tripId}: gross=${grossAmount}, fee=${platformFeeAmount}, net=${netPayoutAmount}`,
    );
    return saved;
  }

  // ─── Platform-wide revenue summary (SUPER_ADMIN) ─────────────────────────────

  async getPlatformRevenueSummary(from?: Date, to?: Date): Promise<{
    totalGMV: number;
    totalPlatformFees: number;
    totalBrokerCommissions: number;
    totalNetPayouts: number;
    recordCount: number;
    byTenant: Array<{ tenantId: string; gmv: number; fees: number }>;
  }> {
    const qb = this.revenueRepository.createQueryBuilder('r').where('r.isSettled = true');

    if (from && to) {
      qb.andWhere('r.settledAt BETWEEN :from AND :to', { from, to });
    }

    const records = await qb.getMany();

    const totalGMV = records.reduce((s, r) => s + Number(r.grossAmount), 0);
    const totalPlatformFees = records.reduce((s, r) => s + Number(r.platformFeeAmount), 0);
    const totalBrokerCommissions = records.reduce((s, r) => s + Number(r.brokerCommissionAmount), 0);
    const totalNetPayouts = records.reduce((s, r) => s + Number(r.netPayoutAmount), 0);

    // Group by tenant
    const tenantMap = new Map<string, { gmv: number; fees: number }>();
    for (const r of records) {
      const existing = tenantMap.get(r.tenantId) || { gmv: 0, fees: 0 };
      tenantMap.set(r.tenantId, {
        gmv: existing.gmv + Number(r.grossAmount),
        fees: existing.fees + Number(r.platformFeeAmount),
      });
    }

    return {
      totalGMV,
      totalPlatformFees,
      totalBrokerCommissions,
      totalNetPayouts,
      recordCount: records.length,
      byTenant: Array.from(tenantMap.entries()).map(([tenantId, v]) => ({
        tenantId,
        ...v,
      })),
    };
  }

  // ─── Per-tenant revenue breakdown ────────────────────────────────────────────

  async getTenantRevenue(tenantId: string, from?: Date, to?: Date): Promise<{
    totalGMV: number;
    totalFeesPaid: number;
    totalBrokerCommissions: number;
    netEarnings: number;
    records: RevenueRecord[];
  }> {
    const qb = this.revenueRepository
      .createQueryBuilder('r')
      .where('r.tenantId = :tenantId', { tenantId })
      .andWhere('r.isSettled = true');

    if (from && to) {
      qb.andWhere('r.settledAt BETWEEN :from AND :to', { from, to });
    }

    const records = await qb.orderBy('r.settledAt', 'DESC').getMany();

    return {
      totalGMV: records.reduce((s, r) => s + Number(r.grossAmount), 0),
      totalFeesPaid: records.reduce((s, r) => s + Number(r.platformFeeAmount), 0),
      totalBrokerCommissions: records.reduce((s, r) => s + Number(r.brokerCommissionAmount), 0),
      netEarnings: records.reduce((s, r) => s + Number(r.netPayoutAmount), 0),
      records,
    };
  }
}
