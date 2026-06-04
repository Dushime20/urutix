import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeofencingService } from './geofencing.service';
import { GeofencingController } from './geofencing.controller';
import { GeofenceZone } from '../../entities/geofence-zone.entity';
import { Notification } from '../../entities/notification.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GeofenceZone, Notification]), EnhancedAuthModule],
  controllers: [GeofencingController],
  providers: [GeofencingService],
  exports: [GeofencingService],
})
export class GeofencingModule {}
