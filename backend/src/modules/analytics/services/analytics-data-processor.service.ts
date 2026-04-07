import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { Load } from '../../../entities/load.entity';
import { CreditTransaction, CreditTransactionType } from '../../../entities/credit-transaction.entity';

export interface LoadCompletedEvent {
  loadId: string;
  tenantId: string;
  cargoOwnerId: string;
  status: string;
}

export interface CreditConsumptionEvent {
  tenantId: string;
  userId: string;
  amount: number;
  type: CreditTransactionType;
  referenceId?: string;
  referenceType?: string;
}

/**
 * Analytics data processor.
 * The cargo_owner_analytics table has not been migrated yet.
 * Event listeners are kept so nothing breaks — writes are skipped until the table exists.
 */
@Injectable()
export class AnalyticsDataProcessorService {
  private readonly logger = new Logger(AnalyticsDataProcessorService.name);

  constructor(
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
    @InjectRepository(CreditTransaction)
    private creditTransactionRepository: Repository<CreditTransaction>,
  ) {}

  @OnEvent('load.completed')
  async processCompletedLoad(payload: LoadCompletedEvent): Promise<void> {
    this.logger.debug(`load.completed event received for ${payload.loadId} — analytics table not yet migrated, skipping write`);
  }

  @OnEvent('credit.consumed')
  async processCreditConsumption(payload: CreditConsumptionEvent): Promise<void> {
    this.logger.debug(`credit.consumed event received for ${payload.userId} — analytics table not yet migrated, skipping write`);
  }

  @Cron('0 2 * * *')
  async processDailyAnalytics(): Promise<void> {
    this.logger.debug('Daily analytics cron — analytics table not yet migrated, skipping');
  }

  @Cron('0 0 * * 0')
  async processWeeklyInsights(): Promise<void> {
    this.logger.debug('Weekly insights cron — analytics table not yet migrated, skipping');
  }

  async backfillAnalyticsData(_tenantId?: string, _limit: number = 1000): Promise<void> {
    this.logger.debug('Backfill requested — analytics table not yet migrated, skipping');
  }
}
