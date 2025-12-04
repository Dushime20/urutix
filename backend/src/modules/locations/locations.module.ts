import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { LocationUtilsService } from './location-utils.service';
import { Location } from '../../entities/location.entity';
import { OpenStreetMapLocationService } from './openstreetmap-location.service';
import { OSMLocationEnrichmentService } from './osm-location-enrichment.service';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    EnhancedAuthModule,
  ],
  controllers: [LocationsController],
  providers: [
    LocationsService,
    LocationUtilsService,
    OpenStreetMapLocationService,
    OSMLocationEnrichmentService,
  ],
  exports: [
    LocationsService,
    LocationUtilsService,
    OpenStreetMapLocationService,
    OSMLocationEnrichmentService,
  ],
})
export class LocationsModule {}
