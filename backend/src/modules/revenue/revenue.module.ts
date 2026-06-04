import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueEngineService } from './revenue-engine.service';
import { RevenueController } from './revenue.controller';
import { RevenueRecord } from '../../entities/revenue-record.entity';
import { Trip } from '../../entities/trip.entity';
import { Load } from '../../entities/load.entity';
import { TenantSubscription } from '../../entities/tenant-subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RevenueRecord, Trip, Load, TenantSubscription]),
  ],
  controllers: [RevenueController],
  providers: [RevenueEngineService],
  exports: [RevenueEngineService],
})
export class RevenueModule {}
