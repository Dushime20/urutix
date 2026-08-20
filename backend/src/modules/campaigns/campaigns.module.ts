import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DistributionCampaign } from '../../entities/distribution-campaign.entity';
import { Load } from '../../entities/load.entity';
import { Trip } from '../../entities/trip.entity';
import { Payment } from '../../entities/payment.entity';
import { MatchingModule } from '../matching/matching.module';
import { LoadsModule } from '../loads/loads.module';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignGeoService } from './campaign-geo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DistributionCampaign, Load, Trip, Payment]),
    MatchingModule,
    forwardRef(() => LoadsModule),
    EnhancedAuthModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignGeoService],
  exports: [CampaignsService, CampaignGeoService],
})
export class CampaignsModule {}
