import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bid } from '../../entities/bid.entity';
import { Auction } from '../../entities/auction.entity';
import { Load } from '../../entities/load.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { Truck } from '../../entities/truck.entity';
import { Driver } from '../../entities/driver.entity';
import { Trip } from '../../entities/trip.entity';
import { AuctionWatch } from '../../entities/auction-watch.entity';
import { AuctionView } from '../../entities/auction-view.entity';
import { LoadContract } from '../../entities/load-contract.entity';
import { BiddingService } from './bidding.service';
import { BiddingController } from './bidding.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bid,
      Auction,
      Load,
      User,
      UserProfile,
      Truck,
      Driver,
      Trip,
      AuctionWatch,
      AuctionView,
      LoadContract,
    ]),
  ],
  providers: [BiddingService],
  controllers: [BiddingController],
  exports: [BiddingService],
})
export class BiddingModule {
  constructor() {
    console.log('BiddingModule loaded successfully');
  }
}
