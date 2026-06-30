import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Bid } from '../../entities/bid.entity';
import { Auction } from '../../entities/auction.entity';
import { Load } from '../../entities/load.entity';
import { Location } from '../../entities/location.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { Trip } from '../../entities/trip.entity';
import { AuctionWatch } from '../../entities/auction-watch.entity';
import { AuctionView } from '../../entities/auction-view.entity';
import { LoadContract } from '../../entities/load-contract.entity';
import { SubscriptionPlan } from '../../entities/subscription-plan.entity';
import { TenantSubscription } from '../../entities/tenant-subscription.entity';
import { CreditAccount } from '../../entities/credit-account.entity';
import { CreditTransaction } from '../../entities/credit-transaction.entity';
import { FeatureCreditCost } from '../../entities/feature-credit-cost.entity';
import { BiddingService } from './bidding.service';
import { BiddingIntelligenceService } from './bidding-intelligence.service';
import { BidValidationService } from './services/bid-validation.service';
import { AuctionSchedulerService } from './auction-scheduler.service';
import { BiddingController } from './bidding.controller';
import { NotificationModule } from '../notifications/notification.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CreditService } from '../../services/credit.service';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Bid,
      Auction,
      Load,
      Location,
      User,
      UserProfile,
      Truck,
      Driver,
      Trip,
      AuctionWatch,
      AuctionView,
      LoadContract,
      SubscriptionPlan,
      TenantSubscription,
      CreditAccount,
      CreditTransaction,
      FeatureCreditCost,
    ]),
    NotificationModule,
    AnalyticsModule,
    AvailabilityModule,
  ],
  providers: [BiddingService, BiddingIntelligenceService, BidValidationService, CreditService, AuctionSchedulerService],
  controllers: [BiddingController],
  exports: [BiddingService, BiddingIntelligenceService, BidValidationService],
})
export class BiddingModule {
  constructor() {
    console.log('BiddingModule loaded successfully');
  }
}
