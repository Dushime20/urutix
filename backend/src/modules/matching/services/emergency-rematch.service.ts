import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, TripStatus } from '../../../entities/trip.entity';
import { Load, LoadStatus } from '../../../entities/load.entity';
import { Truck } from '../../../entities/truck.entity';
import { Notification } from '../../../entities/notification.entity';
import { UserScore } from '../../../entities/user-score.entity';

const RESCUE_BOND_PREMIUM = 0.15;       // 15% premium on offered price
const CANCELLATION_PENALTY_DAYS = 30;   // bid visibility reduction period

@Injectable()
export class EmergencyRematchService {
  private readonly logger = new Logger(EmergencyRematchService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(UserScore)
    private readonly scoreRepository: Repository<UserScore>,
  ) {}

  /**
   * Called when a post-acceptance trip is cancelled.
   * Re-publishes the load with CRITICAL urgency and rescue bond premium.
   */
  async triggerEmergencyRematch(tripId: string): Promise<{
    loadId: string;
    rescueBondApplied: boolean;
    newOfferedPrice: number;
    message: string;
  }> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

    const load = await this.loadRepository.findOne({ where: { id: (trip as any).loadId } });
    if (!load) throw new NotFoundException(`Load for trip ${tripId} not found`);

    // Only trigger if trip was in a post-acceptance state
    if (![TripStatus.PLANNED, TripStatus.IN_PROGRESS].includes(trip.status)) {
      this.logger.warn(`Trip ${tripId} is not in a post-acceptance state — skipping emergency rematch`);
      return { loadId: load.id, rescueBondApplied: false, newOfferedPrice: Number((load as any).offeredPrice), message: 'Not eligible for emergency rematch' };
    }

    // Apply rescue bond premium
    const originalPrice = Number((load as any).offeredPrice) || 0;
    const rescuePrice = Math.round(originalPrice * (1 + RESCUE_BOND_PREMIUM));

    // Re-publish load with CRITICAL urgency and rescue bond flag
    await this.loadRepository.update(load.id, {
      status: LoadStatus.PUBLISHED,
      urgencyLevel: 'CRITICAL' as any,
      offeredPrice: rescuePrice,
      isTimeCritical: true,
      // Store rescue bond metadata
      matchingCriteria: {
        ...(load as any).matchingCriteria,
        isRescueBond: true,
        rescueBondPremium: RESCUE_BOND_PREMIUM,
        originalPrice,
        emergencyRematchAt: new Date().toISOString(),
      },
    } as any);

    this.logger.log(
      `Emergency rematch triggered for load ${load.id}. Rescue bond applied: ${originalPrice} → ${rescuePrice}`,
    );

    // Notify cargo owner
    await this.sendNotification(
      (load as any).cargoOwnerId,
      load.tenantId,
      '🚨 Emergency Re-Match Initiated',
      `Your load has been re-published with a rescue bond premium (+15%). We are urgently finding a replacement carrier.`,
    );

    return {
      loadId: load.id,
      rescueBondApplied: true,
      newOfferedPrice: rescuePrice,
      message: 'Emergency rematch triggered. Load re-published with rescue bond premium.',
    };
  }

  /**
   * Apply cancellation penalty to a truck owner who cancelled post-acceptance.
   */
  async applyCancellationPenalty(truckOwnerId: string, tenantId: string): Promise<void> {
    try {
      // Decrement score
      let score = await this.scoreRepository.findOne({ where: { userId: truckOwnerId, tenantId } });
      if (!score) {
        const newScore = this.scoreRepository.create({
          userId: truckOwnerId,
          tenantId,
          overallScore: 100,
        } as any);
        score = Array.isArray(newScore) ? newScore[0] : newScore;
      }

      const currentScore = Number((score as any).overallScore ?? 100);
      await this.scoreRepository.update(
        { userId: truckOwnerId, tenantId },
        { overallScore: Math.max(0, currentScore - 10) } as any,
      );

      // Store penalty expiry in score metadata
      await this.scoreRepository.query(
        `UPDATE user_scores SET metadata = jsonb_set(
          COALESCE(metadata, '{}'),
          '{cancellationPenaltyUntil}',
          to_jsonb($1::text)
        ) WHERE "userId" = $2 AND "tenantId" = $3`,
        [
          new Date(Date.now() + CANCELLATION_PENALTY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
          truckOwnerId,
          tenantId,
        ],
      );

      // Notify truck owner
      await this.sendNotification(
        truckOwnerId,
        tenantId,
        '⚠️ Cancellation Penalty Applied',
        `You cancelled a confirmed trip. A penalty has been applied to your score and your bid visibility will be reduced for ${CANCELLATION_PENALTY_DAYS} days.`,
      );

      this.logger.log(`Cancellation penalty applied to truck owner ${truckOwnerId}`);
    } catch (err) {
      this.logger.error(`Failed to apply cancellation penalty: ${err.message}`);
    }
  }

  /**
   * Check if a truck owner is currently under a cancellation penalty.
   */
  async isUnderPenalty(truckOwnerId: string, tenantId: string): Promise<boolean> {
    try {
      const result = await this.scoreRepository.query(
        `SELECT metadata->>'cancellationPenaltyUntil' as penalty_until
         FROM user_scores WHERE "userId" = $1 AND "tenantId" = $2`,
        [truckOwnerId, tenantId],
      );
      if (!result?.[0]?.penalty_until) return false;
      return new Date(result[0].penalty_until) > new Date();
    } catch {
      return false;
    }
  }

  /**
   * Get emergency rematch status for a load.
   */
  async getEmergencyStatus(loadId: string): Promise<{
    isEmergency: boolean;
    rescueBondApplied: boolean;
    originalPrice?: number;
    currentPrice?: number;
    triggeredAt?: string;
  }> {
    const load = await this.loadRepository.findOne({ where: { id: loadId } });
    if (!load) throw new NotFoundException(`Load ${loadId} not found`);

    const criteria = (load as any).matchingCriteria || {};
    return {
      isEmergency: !!criteria.isRescueBond,
      rescueBondApplied: !!criteria.isRescueBond,
      originalPrice: criteria.originalPrice,
      currentPrice: Number((load as any).offeredPrice),
      triggeredAt: criteria.emergencyRematchAt,
    };
  }

  private async sendNotification(userId: string, tenantId: string, title: string, message: string): Promise<void> {
    try {
      await this.notificationRepository.save(
        this.notificationRepository.create({
          userId,
          tenantId,
          title,
          message,
          type: 'EMERGENCY_REMATCH' as any,
          isRead: false,
        } as any),
      );
    } catch (err) {
      this.logger.error(`Failed to send emergency notification: ${err.message}`);
    }
  }
}
