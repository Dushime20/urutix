import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { CarrierTier, CarrierTierLevel } from '../../entities/carrier-tier.entity';
import { Trip, TripStatus } from '../../entities/trip.entity';
import { Truck } from '../../entities/truck.entity';
import { Notification } from '../../entities/notification.entity';

// Tier thresholds
const TIER_THRESHOLDS = {
  [CarrierTierLevel.PLATINUM]: { minOnTime: 95, maxDamage: 1, minTrips: 50 },
  [CarrierTierLevel.GOLD]:     { minOnTime: 90, maxDamage: 2, minTrips: 20 },
  [CarrierTierLevel.SILVER]:   { minOnTime: 80, maxDamage: 5, minTrips: 10 },
  [CarrierTierLevel.BRONZE]:   { minOnTime: 0,  maxDamage: 100, minTrips: 0 },
};

@Injectable()
export class CarrierTierService {
  private readonly logger = new Logger(CarrierTierService.name);

  constructor(
    @InjectRepository(CarrierTier)
    private readonly tierRepository: Repository<CarrierTier>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  // ─── Get tier for a truck owner ──────────────────────────────────────────────

  async getTierForOwner(truckOwnerId: string, tenantId: string): Promise<CarrierTier | null> {
    return this.tierRepository.findOne({ where: { truckOwnerId, tenantId } });
  }

  // ─── Get leaderboard ─────────────────────────────────────────────────────────

  async getLeaderboard(tenantId: string): Promise<CarrierTier[]> {
    return this.tierRepository.find({
      where: { tenantId },
      order: { tier: 'DESC', onTimeRate: 'DESC', totalTrips: 'DESC' },
      take: 20,
    });
  }

  // ─── Get progress toward next tier ───────────────────────────────────────────

  async getTierProgress(truckOwnerId: string, tenantId: string): Promise<{
    currentTier: CarrierTierLevel;
    nextTier: CarrierTierLevel | null;
    tripsNeeded: number;
    onTimeRateNeeded: number;
    currentStats: { onTimeRate: number; damageRate: number; totalTrips: number };
  }> {
    const tier = await this.getTierForOwner(truckOwnerId, tenantId);
    const current = tier?.tier ?? CarrierTierLevel.BRONZE;

    const tierOrder = [CarrierTierLevel.BRONZE, CarrierTierLevel.SILVER, CarrierTierLevel.GOLD, CarrierTierLevel.PLATINUM];
    const currentIdx = tierOrder.indexOf(current);
    const nextTier = currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null;

    const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;

    return {
      currentTier: current,
      nextTier,
      tripsNeeded: nextThreshold ? Math.max(0, nextThreshold.minTrips - (tier?.totalTrips ?? 0)) : 0,
      onTimeRateNeeded: nextThreshold ? Math.max(0, nextThreshold.minOnTime - (tier?.onTimeRate ?? 0)) : 0,
      currentStats: {
        onTimeRate: tier?.onTimeRate ?? 0,
        damageRate: tier?.damageRate ?? 0,
        totalTrips: tier?.totalTrips ?? 0,
      },
    };
  }

  // ─── Monthly cron: recalculate all tiers ─────────────────────────────────────

  @Cron('0 2 1 * *') // 2am on 1st of every month
  async recalculateAllTiers(): Promise<void> {
    this.logger.log('Starting monthly carrier tier recalculation...');

    // Get all distinct truck owners with completed trips
    const ownerRows = await this.tripRepository
      .createQueryBuilder('t')
      .select('DISTINCT t."tenantId"', 'tenantId')
      .addSelect('tk."ownerId"', 'ownerId')
      .innerJoin(Truck, 'tk', 'tk.id = t."truckId"')
      .where('t.status = :status', { status: TripStatus.COMPLETED })
      .getRawMany();

    for (const row of ownerRows) {
      try {
        await this.recalculateForOwner(row.ownerId, row.tenantId);
      } catch (err) {
        this.logger.error(`Failed to recalculate tier for owner ${row.ownerId}: ${err.message}`);
      }
    }

    this.logger.log(`Tier recalculation complete for ${ownerRows.length} owners.`);
  }

  async recalculateForOwner(truckOwnerId: string, tenantId: string): Promise<CarrierTier> {
    // Get all completed trips for this owner's trucks in the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trips = await this.tripRepository
      .createQueryBuilder('t')
      .innerJoin(Truck, 'tk', 'tk.id = t."truckId" AND tk."ownerId" = :ownerId', { ownerId: truckOwnerId })
      .where('t."tenantId" = :tenantId', { tenantId })
      .andWhere('t.status = :status', { status: TripStatus.COMPLETED })
      .andWhere('t."actualEndTime" >= :since', { since: sixMonthsAgo })
      .getMany();

    const totalTrips = trips.length;

    // On-time rate: actualEndTime <= plannedEndTime
    const onTimeTrips = trips.filter(
      (t) => t.actualEndTime && t.plannedEndTime && t.actualEndTime <= t.plannedEndTime,
    ).length;
    const onTimeRate = totalTrips > 0 ? (onTimeTrips / totalTrips) * 100 : 0;

    // Damage rate: trips with issues reported (from issuesReported JSONB)
    const damagedTrips = trips.filter((t) => {
      const issues = (t as any).issuesReported;
      return Array.isArray(issues) && issues.some((i: any) => i.type === 'DAMAGE');
    }).length;
    const damageRate = totalTrips > 0 ? (damagedTrips / totalTrips) * 100 : 0;

    // Calculate tier
    const newTier = this.calculateTier(onTimeRate, damageRate, totalTrips);

    // Upsert
    let record = await this.tierRepository.findOne({ where: { truckOwnerId, tenantId } });
    const previousTier = record?.tier;

    if (!record) {
      record = this.tierRepository.create({ truckOwnerId, tenantId });
    }

    record.tier = newTier;
    record.previousTier = previousTier;
    record.onTimeRate = Math.round(onTimeRate * 100) / 100;
    record.damageRate = Math.round(damageRate * 100) / 100;
    record.totalTrips = totalTrips;
    record.calculatedAt = new Date();

    const saved = await this.tierRepository.save(record);

    // Notify on downgrade
    if (previousTier && this.tierRank(newTier) < this.tierRank(previousTier)) {
      await this.sendTierNotification(
        truckOwnerId,
        tenantId,
        `Your carrier tier has been downgraded from ${previousTier} to ${newTier}. Improve your on-time delivery rate to regain your tier.`,
      );
    } else if (previousTier && this.tierRank(newTier) > this.tierRank(previousTier)) {
      await this.sendTierNotification(
        truckOwnerId,
        tenantId,
        `🎉 Congratulations! Your carrier tier has been upgraded to ${newTier}!`,
      );
    }

    return saved;
  }

  private calculateTier(onTimeRate: number, damageRate: number, totalTrips: number): CarrierTierLevel {
    const t = TIER_THRESHOLDS;
    if (
      onTimeRate >= t[CarrierTierLevel.PLATINUM].minOnTime &&
      damageRate <= t[CarrierTierLevel.PLATINUM].maxDamage &&
      totalTrips >= t[CarrierTierLevel.PLATINUM].minTrips
    ) return CarrierTierLevel.PLATINUM;

    if (
      onTimeRate >= t[CarrierTierLevel.GOLD].minOnTime &&
      damageRate <= t[CarrierTierLevel.GOLD].maxDamage &&
      totalTrips >= t[CarrierTierLevel.GOLD].minTrips
    ) return CarrierTierLevel.GOLD;

    if (
      onTimeRate >= t[CarrierTierLevel.SILVER].minOnTime &&
      damageRate <= t[CarrierTierLevel.SILVER].maxDamage &&
      totalTrips >= t[CarrierTierLevel.SILVER].minTrips
    ) return CarrierTierLevel.SILVER;

    return CarrierTierLevel.BRONZE;
  }

  private tierRank(tier: CarrierTierLevel): number {
    return { BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4 }[tier] ?? 1;
  }

  private async sendTierNotification(userId: string, tenantId: string, message: string): Promise<void> {
    try {
      await this.notificationRepository.save(
        this.notificationRepository.create({
          userId,
          tenantId,
          title: 'Carrier Tier Update',
          message,
          type: 'TIER_UPDATE' as any,
          isRead: false,
        } as any),
      );
    } catch (err) {
      this.logger.error(`Failed to send tier notification: ${err.message}`);
    }
  }
}
