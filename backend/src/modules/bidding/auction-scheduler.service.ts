import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Auction, AuctionStatus } from '../../entities/auction.entity';

/**
 * Runs periodic checks to transition auctions between states automatically:
 *
 *  SCHEDULED → ACTIVE  when auctionStart <= now
 *  ACTIVE    → CLOSED  when auctionEnd   <= now
 *
 * Runs every minute so transitions happen within 60 seconds of the deadline.
 */
@Injectable()
export class AuctionSchedulerService {
  private readonly logger = new Logger(AuctionSchedulerService.name);

  constructor(
    @InjectRepository(Auction)
    private readonly auctionRepository: Repository<Auction>,
  ) {}

  /**
   * Promote SCHEDULED auctions whose start time has passed to ACTIVE.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async activateScheduledAuctions(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.auctionRepository
        .createQueryBuilder()
        .update(Auction)
        .set({ status: AuctionStatus.ACTIVE })
        .where('status = :status', { status: AuctionStatus.SCHEDULED })
        .andWhere('auctionStart <= :now', { now })
        .execute();

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `✅ Activated ${result.affected} auction(s) that passed their start time`,
        );
      }
    } catch (err) {
      this.logger.error('Error activating scheduled auctions', err);
    }
  }

  /**
   * Close ACTIVE auctions whose end time has passed.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async closeExpiredAuctions(): Promise<void> {
    try {
      const now = new Date();
      const result = await this.auctionRepository
        .createQueryBuilder()
        .update(Auction)
        .set({ status: AuctionStatus.CLOSED })
        .where('status = :status', { status: AuctionStatus.ACTIVE })
        .andWhere('auctionEnd <= :now', { now })
        .execute();

      if (result.affected && result.affected > 0) {
        this.logger.log(
          `🔒 Closed ${result.affected} auction(s) that passed their end time`,
        );
      }
    } catch (err) {
      this.logger.error('Error closing expired auctions', err);
    }
  }
}
