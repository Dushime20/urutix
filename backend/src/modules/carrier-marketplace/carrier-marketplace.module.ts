import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarrierMarketplaceService } from './carrier-marketplace.service';
import { CarrierMarketplaceController } from './carrier-marketplace.controller';
import { Truck } from '../../entities/truck.entity';
import { User } from '../../entities/user.entity';
import { UserProfile } from '../../entities/user-profile.entity';
import { UserRating } from '../../entities/user-rating.entity';
import { CarrierTier } from '../../entities/carrier-tier.entity';
import { PrivateCarrierNetwork } from '../../entities/private-carrier-network.entity';
import { Load } from '../../entities/load.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Truck,
      User,
      UserProfile,
      UserRating,
      CarrierTier,
      PrivateCarrierNetwork,
      Load,
    ]),
    EnhancedAuthModule,
  ],
  controllers: [CarrierMarketplaceController],
  providers: [CarrierMarketplaceService],
  exports: [CarrierMarketplaceService],
})
export class CarrierMarketplaceModule {}
