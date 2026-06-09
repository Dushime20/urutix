import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchingService } from '../matching.service';
import { MLPredictionService } from './ml-prediction.service';

/**
 * MatchingSchedulerService
 *
 * Provides two scheduled jobs required by the FRS:
 *
 * 1. FR-MATCH Lifecycle / EXPIRED step (§6.8):
 *    Runs every hour — expires REQUESTED matches that have exceeded the 24 h SLA
 *    and promotes the next best POTENTIAL candidate for each affected load.
 *
 * 2. FR-MATCH-007 (§6.5):
 *    Runs on the 1st of every month at 02:00 AM — retrains the ML prediction
 *    model on the previous 90 days of completed trip data.
 */
@Injectable()
export class MatchingSchedulerService {
  private readonly logger = new Logger(MatchingSchedulerService.name);

  constructor(
    private readonly matchingService: MatchingService,
    private readonly mlPredictionService: MLPredictionService,
  ) {}

  /**
   * FR-MATCH Lifecycle — EXPIRED step (§6.8)
   * Expire REQUESTED matches that have not been responded to within the 24 h SLA
   * and promote the next best POTENTIAL candidate.
   * Runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireStaleMatchesJob(): Promise<void> {
    this.logger.log('⏰ [Scheduler] Running expireStaleMatches cron job...');
    try {
      await this.matchingService.expireStaleMatches();
      this.logger.log('✅ [Scheduler] expireStaleMatches completed');
    } catch (error) {
      this.logger.error(`❌ [Scheduler] expireStaleMatches failed: ${error.message}`, error.stack);
    }
  }

  /**
   * FR-MATCH-007 (§6.5) — Monthly ML model retraining
   * Retrains the prediction model on the last 90 days of completed trip data.
   * Runs on the 1st of every month at 02:00 AM.
   */
  @Cron('0 2 1 * *') // 02:00 AM on the 1st of every month
  async retrainMLModelJob(): Promise<void> {
    this.logger.log('🤖 [Scheduler] Running monthly ML model retraining...');
    try {
      await this.mlPredictionService.trainModel();
      this.logger.log('✅ [Scheduler] ML model retraining completed');
    } catch (error) {
      this.logger.error(`❌ [Scheduler] ML model retraining failed: ${error.message}`, error.stack);
    }
  }
}
