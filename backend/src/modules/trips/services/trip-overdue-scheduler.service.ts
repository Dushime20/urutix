import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TripStatus } from '../../../entities/trip.entity';
import { TripsService } from '../trips.service';
import { OVERDUE_BATCH_SIZE, OVERDUE_ISSUE_TYPE } from '../trip-overdue.util';

/**
 * Periodically marks IN_PROGRESS trips as OVERDUE once plannedEndTime has passed.
 *
 * Does NOT auto-complete trips. Idempotent: the UPDATE is scoped to
 * status = IN_PROGRESS, so a second run cannot re-transition or re-notify.
 * SKIP LOCKED protects concurrent scheduler instances and races with Complete Trip.
 *
 * Pause (DELAYED) and HOS break flows are intentionally excluded — only
 * IN_PROGRESS trips whose plannedEndTime has elapsed become OVERDUE.
 */
@Injectable()
export class TripOverdueSchedulerService {
  private readonly logger = new Logger(TripOverdueSchedulerService.name);
  private running = false;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @Optional() private readonly tripsService?: TripsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processOverdueTrips(): Promise<number> {
    if (this.running) {
      this.logger.debug('Overdue scan already in progress — skipping overlapping tick');
      return 0;
    }
    this.running = true;
    try {
      return await this.scanAndMarkOverdue();
    } catch (err) {
      this.logger.error('Overdue trip scan failed', err);
      return 0;
    } finally {
      this.running = false;
    }
  }

  /**
   * Public for tests and manual ops triggers. Processes one batch at a time
   * until no eligible rows remain (capped to avoid unbounded loops).
   */
  async scanAndMarkOverdue(now: Date = new Date(), maxBatches = 20): Promise<number> {
    let total = 0;
    for (let i = 0; i < maxBatches; i++) {
      const ids = await this.markOverdueBatch(now);
      if (ids.length === 0) break;
      total += ids.length;
      if (this.tripsService) {
        await this.tripsService.finalizeOverdueTransitions(ids, now);
      }
      if (ids.length < OVERDUE_BATCH_SIZE) break;
    }

    const recovered = await this.findUnfinalizedOverdueIds();
    if (recovered.length > 0 && this.tripsService) {
      await this.tripsService.finalizeOverdueTransitions(recovered, now);
    }

    if (total > 0) {
      this.logger.log(`Marked ${total} trip(s) OVERDUE`);
    }
    return total;
  }

  /**
   * Atomically claim a batch of IN_PROGRESS trips whose expected end has passed.
   * Returns claimed IDs (empty when nothing to do — safe to call repeatedly).
   */
  async markOverdueBatch(now: Date = new Date()): Promise<string[]> {
    const result: Array<{ id: string }> = await this.dataSource.query(
      `
      UPDATE trips
      SET
        status = $1,
        "onTimePerformance" = false,
        "updatedAt" = NOW()
      WHERE id IN (
        SELECT id FROM trips
        WHERE status = $2
          AND "plannedEndTime" <= $3
          AND "deleted_at" IS NULL
        ORDER BY "plannedEndTime" ASC
        LIMIT $4
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id
      `,
      [TripStatus.OVERDUE, TripStatus.IN_PROGRESS, now, OVERDUE_BATCH_SIZE],
    );

    return (result || []).map((row) => row.id);
  }

  /**
   * Recover OVERDUE rows that were status-flipped but never got an audit/notify
   * (e.g. process crash between UPDATE and finalize). Safe: finalize is idempotent.
   */
  async findUnfinalizedOverdueIds(): Promise<string[]> {
    const result: Array<{ id: string }> = await this.dataSource.query(
      `
      SELECT id FROM trips
      WHERE status = $1
        AND "deleted_at" IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE("issuesReported", '[]'::jsonb)) AS issue
          WHERE issue->>'type' = $2
        )
      ORDER BY "plannedEndTime" ASC
      LIMIT $3
      FOR UPDATE SKIP LOCKED
      `,
      [TripStatus.OVERDUE, OVERDUE_ISSUE_TYPE, OVERDUE_BATCH_SIZE],
    );
    return (result || []).map((row) => row.id);
  }
}
